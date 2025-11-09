import { prisma } from "../../config/database.js";
import { CreateDonationData, UpdateDonationData, DonationFilters, PaginatedResponse } from "../../types/index.js";
import { Donation, DonationEditHistory, Candidacy, DonationProgress } from "@prisma/client";

export class DonationRepository {

    /**
     * Gera e retorna o próximo ID sequencial para uma doação
     * O MongoDB usa ObjectIds, mas queremos IDs amigáveis como "Doação #1234"
     * Usamos um contador separado no banco para isso
     * @returns 
     */
    async getNextSequentialId(): Promise<number> {
        const counter = await prisma.counter.upsert({
            where: { name: "donation_sequential_id" },
            update: {
                value: { increment: 1 },
            },
            create: {
                name: "donation_sequential_id",
                value: 1,
            },
        });

        return counter.value;
    }


    /**
     * Cria uma nova doação no banco de dados
     * Automaticamente gera um ID sequencial e define status como OPEN
     * @param donorId 
     * @param data 
     * @returns 
     */
    async create(donorId: string, data: CreateDonationData): Promise<Donation> {
        const sequentialId = await this.getNextSequentialId();

        return prisma.donation.create({
            data: {
                sequentialId,
                title: data.title,
                description: data.description,
                pickupType: data.pickupType,
                postalCode: data.postalCode,
                street: data.street,
                locationNumber: data.locationNumber,
                neighborhood: data.neighborhood,
                city: data.city,
                state: data.state,
                category: data.category,
                donorId,
                status: "OPEN",
            },
            include: {
                donor: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        state: true,
                    },
                },
            },
        });
    }


    /**
     * Busca uma doação específica pelo ID
     * Inclui informações do doador e, se houver, do receptor
     * @param id 
     * @returns 
     */
    async findById(id: string): Promise<Donation | null> {
        return prisma.donation.findUnique({
            where: { id },
            include: {
                donor: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        state: true,
                        contactEmail: true,
                        contactPhone: true,
                        socialNetworks: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        state: true,
                        contactEmail: true,
                        contactPhone: true,
                    },
                },
                progress: true,
                _count: {
                    select: {
                        candidacies: true, // Quantas pessoas se candidataram
                    },
                },
            },
        });
    }

    /**
     * Lista doações com filtros e paginação
     * Permite filtrar por status, categoria, cidade e estado
     * Retorna dados paginados para não sobrecarregar a API
     * @param filters 
     * @param page 
     * @param limit 
     * @returns 
     */
    async findMany(filters: DonationFilters, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Donation>> {
        const where: any = {};

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.category) {
            where.category = filters.category;
        }

        if (filters.city) {
            where.city = { contains: filters.city, mode: "insensitive" };
        }

        if (filters.state) {
            where.state = filters.state;
        }

        const skip = (page - 1) * limit;

        const [donations, total] = await Promise.all([
        prisma.donation.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" }, // Mais recentes primeiro
            include: {
                donor: {
                    select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
                    },
                },
                _count: {
                    select: {
                    candidacies: true,
                    },
                },
            },
        }),
            prisma.donation.count({ where }),
        ]);

        return {
            data: donations,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Atualiza os dados de uma doação
     * Só permite atualizar doações com status OPEN
     * @param id 
     * @param data 
     * @returns 
     */
    async update(id: string, data: UpdateDonationData): Promise<Donation> {
        return prisma.donation.update({
            where: { id },
            data,
            include: {
                donor: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        state: true,
                    },
                },
            },
        });
    }

    /**
     * Deleta uma doação permanentemente
     * Por causa do onDelete: Cascade, também deleta candidaturas e histórico
     * @param id 
     */
    async delete(id: string): Promise<void> {
        await prisma.donation.delete({
            where: { id },
        });
    }

    /**
     * Salva um registro no histórico de edições da doação
     * Permite rastrear todas as mudanças feitas na doação ao longo do tempo
     * @param donationId 
     * @param changedFields 
     * @returns 
     */
    async saveDonationEditHistory(donationId: string, changedFields: Record<string, { oldValue: any; newValue: any }>): Promise<DonationEditHistory> {
        return prisma.donationEditHistory.create({
            data: {
                donationId,
                changedFields,
            },
        });
    }

    /**
     * Busca o histórico completo de edições de uma doação
     * Público - qualquer um pode ver as mudanças feitas na doação
     * @param donationId 
     * @returns 
     */
    async getDonationEditHistory(donationId: string): Promise<DonationEditHistory[]> {
        return prisma.donationEditHistory.findMany({
            where: { donationId },
            orderBy: { editedAt: "desc" },
        });
    }

    /**
     * Lista todas as doações criadas por um usuário específico
     * Útil para a página "Minhas Doações"
     * @param donorId 
     * @returns 
     */
    async findByDonor(donorId: string): Promise<Donation[]> {
        return prisma.donation.findMany({
            where: { donorId },
            orderBy: { createdAt: "desc" },
            include: {
                receiver: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        candidacies: true,
                    },
                },
            },
        });
    }

    /**
     * Lista todas as doações recebidas por um usuário específico
     * Mostra doações onde o usuário foi escolhido como receptor
     * @param receiverId 
     * @returns 
     */
    async findByReceiver(receiverId: string): Promise<Donation[]> {
        return prisma.donation.findMany({
            where: { receiverId },
            orderBy: { createdAt: "desc" },
            include: {
                donor: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        state: true,
                    },
                },
                progress: true,
            },
        });
    }


    /**
     * Atualiza o status de uma doação
     * Usado quando a doação muda de OPEN para IN_PROGRESS, etc.
     * @param id 
     * @param status 
     * @returns 
     */
    async updateStatus(id: string, status: "OPEN" | "IN_PROGRESS" | "PICKED_UP" | "COMPLETED"): Promise<Donation> {
        return prisma.donation.update({
            where: { id },
            data: { status },
        });
    }

    /**
     * Define quem vai receber a doação
     * Muda o status para IN_PROGRESS e associa o receptor
     * @param donationId 
     * @param receiverId 
     * @returns 
     */
    async setReceiver(donationId: string, receiverId: string): Promise<Donation> {
        return prisma.donation.update({
            where: { id: donationId },
            data: {
                receiverId,
                status: "IN_PROGRESS",
            },
        });
    }

    /**
     * Remove o receptor atual da doação
     * Volta o status para OPEN e limpa o receiverId
     * Usado quando o receptor cancela a candidatura
     * @param donationId 
     * @returns 
     */
    async removeReceiver(donationId: string): Promise<Donation> {
        return prisma.donation.update({
            where: { id: donationId },
            data: {
                receiverId: null,
                status: "OPEN",
                returnReason: null, // Limpa também o motivo de devolução se houver
            },
        });
    }


    /**
     * Atualiza o motivo de devolução da doação
     * Usado quando o receptor quer devolver e precisa explicar o porquê
     * @param donationId 
     * @param reason 
     * @returns 
     */
    async updateReturnReason(donationId: string, reason: string): Promise<Donation> {
        return prisma.donation.update({
            where: { id: donationId },
            data: { returnReason: reason },
        });
    }
}