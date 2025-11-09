import { prisma } from "../../config/database.js";
import { Candidacy } from "@prisma/client";

export class CandidacyRepository {
    /**
     * Cria uma nova candidatura
     * Vincula um usuário a uma doação específica que ele deseja receber
     * A constraint unique no schema garante que um usuário não pode
     * se candidatar duas vezes para a mesma doação
     * @param donationId 
     * @param userId 
     * @returns 
     */
    async create(donationId: string, userId: string): Promise<Candidacy> {
        return prisma.candidacy.create({
            data: {
                donationId,
                userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        state: true,
                        biography: true,
                        contactEmail: true,
                        contactPhone: true,
                    },
                },
            },
        });
    }

    /**
     * Busca uma candidatura específica pelo ID
     * Útil para verificar detalhes de uma candidatura
     * @param id 
     * @returns 
     */
    async findById(id: string): Promise<Candidacy | null> {
        return prisma.candidacy.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        state: true,
                    },
                },
                donation: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    },
                },
            },
        });
    }

    /**
     * Verifica se já existe uma candidatura específica
     * Recebe o ID da doação e do usuário
     * Retorna a candidatura se existir, null caso contrário
     * Importante para evitar duplicação de candidaturas
     * @param donationId 
     * @param userId 
     * @returns 
     */
    async findByDonationAndUser(donationId: string, userId: string): Promise<Candidacy | null> {
        return prisma.candidacy.findUnique({
            where: {
                donationId_userId: {
                    donationId,
                    userId,
                },
            },
        });
    }


    /**
     * Lista todas as candidaturas de uma doação específica
     * Mostra quem se candidatou para receber aquela doação
     * O doador usa esta lista para escolher o receptor
     * Ordenado por data de criação (primeiro a se candidatar aparece primeiro)
     * @param donationId 
     * @returns 
     */
    async findByDonation(donationId: string): Promise<Candidacy[]> {
        return prisma.candidacy.findMany({
            where: { donationId },
            orderBy: { createdAt: "asc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        age: true,
                        city: true,
                        state: true,
                        biography: true,
                        contactEmail: true,
                        contactPhone: true,
                        socialNetworks: true,
                        _count: {
                            select: {
                                receivedDonations: true, // Mostra quantas doações a pessoa já recebeu
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Lista todas as candidaturas de um usuário específico
     * Mostra em quais doações o usuário se candidatou
     * Útil para a página "Minhas Candidaturas"
     * @param userId 
     * @returns 
     */
    async findByUser(userId: string): Promise<Candidacy[]> {
        return prisma.candidacy.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                donation: {
                    select: {
                        id: true,
                        sequentialId: true,
                        title: true,
                        description: true,
                        status: true,
                        category: true,
                        city: true,
                        state: true,
                        createdAt: true,
                        donor: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
    }


    /**
     * Remove uma candidatura específica
     * Usado quando o usuário desiste de receber a doação
     * ou quando o doador escolhe alguém (as outras candidaturas são removidas)
     * @param id 
     */
    async delete(id: string): Promise<void> {
        await prisma.candidacy.delete({
            where: { id },
        });
    }


    /**
     * Remove uma candidatura específica usando doação e usuário
     * Alternativa ao delete por ID, útil quando temos esses dois valores
     * @param donationId 
     * @param userId 
     */
    async deleteByDonationAndUser(donationId: string, userId: string): Promise<void> {
        await prisma.candidacy.delete({
            where: {
                donationId_userId: {
                    donationId,
                    userId,
                },
            },
        });
    }

    /**
     * Remove todas as candidaturas de uma doação
     * Usado quando o doador escolhe um receptor - todas as outras
     * candidaturas precisam ser removidas
     * @param donationId 
     * @returns 
     */
    async deleteAllByDonation(donationId: string): Promise<number> {
        const result = await prisma.candidacy.deleteMany({
            where: { donationId },
        });

        return result.count;
    }

    /**
     * Conta quantas candidaturas uma doação tem
     * Útil para mostrar "X pessoas interessadas" na listagem de doações
     * @param donationId 
     * @returns 
     */
    async countByDonation(donationId: string): Promise<number> {
        return prisma.candidacy.count({
            where: { donationId },
        });
    }

    /**
     * Verifica se um usuário já se candidatou para uma doação
     * Retorna true se já existe candidatura, false caso contrário
     * Mais eficiente que findByDonationAndUser quando só precisamos
     * saber se existe ou não
     * @param donationId 
     * @param userId 
     * @returns 
     */
    async hasCandidacy(donationId: string, userId: string): Promise<boolean> {
        const count = await prisma.candidacy.count({
            where: {
                donationId,
                userId,
            },
        });

        return count > 0;
    }
}