import { prisma } from "../../config/database.js";
import { CreateUserData, UpdateUserData } from "../../types/index.js";
import { User, ProfileEditHistory } from "@prisma/client";

export class UserRepository {
    /**
     *  Cria um novo usuário no banco de dados
     * Recebe todos os dados necessários já validados e formatados
     * Retorna o usuário criado (sem a senha por segurança)
     * @param data 
     * @returns
     */
    async create(data: CreateUserData): Promise<Omit<User, "password">> {
        const user = await prisma.user.create({
        data: {
            email: data.email,
            password: data.password,
            name: data.name,
            age: data.age,
            postalCode: data.postalCode,
            city: data.city,
            state: data.state,
            street: data.street,
            houseNumber: data.houseNumber,
            neighborhood: data.neighborhood,
            biography: data.biography,
            phone: data.phone,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            socialNetworks: data.socialNetworks,
        },
        select: {
            id: true,
            email: true,
            name: true,
            age: true,
            postalCode: true,
            city: true,
            state: true,
            street: true,
            houseNumber: true,
            neighborhood: true,
            biography: true,
            phone: true,
            contactEmail: true,
            contactPhone: true,
            socialNetworks: true,
            createdAt: true,
        },
        });

        return user;
    }

    /**
     * Busca um usuário pelo ID
     * O parâmetro includePassword permite controlar se queremos a senha ou não
     * Por padrão, não incluímos a senha por segurança
     * @param id 
     * @param includePassword 
     * @returns 
     */
    async findById(id: string, includePassword: boolean = false): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                password: includePassword,
                name: true,
                age: true,
                postalCode: true,
                city: true,
                state: true,
                street: true,
                houseNumber: true,
                neighborhood: true,
                biography: true,
                phone: true,
                contactEmail: true,
                contactPhone: true,
                socialNetworks: true,
                createdAt: true,
            },
        }) as Promise<User | null>;
    }

    /**
     * Busca um usuário pelo email
     * Muito usado na autenticação (login)
     * Inclui a senha porque precisamos dela para comparar com a senha informada
     * @param email 
     * @param includePassword 
     * @returns 
     */
    async findByEmail(email: string, includePassword: boolean = false): Promise<User | null> {
        return prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: includePassword,
                name: true,
                age: true,
                postalCode: true,
                city: true,
                state: true,
                street: true,
                houseNumber: true,
                neighborhood: true,
                biography: true,
                phone: true,
                contactEmail: true,
                contactPhone: true,
                socialNetworks: true,
                createdAt: true,
            },
        }) as Promise<User | null>;
    }

    /**
     * Atualiza os dados de um usuário
     * Só atualiza os campos que foram fornecidos (update parcial)
     * Retorna o usuário atualizado sem a senha
     * @param id 
     * @param data 
     * @returns 
     */

    async update(id: string, data: UpdateUserData): Promise<Omit<User, "password">> {
        const user = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                age: true,
                postalCode: true,
                city: true,
                state: true,
                street: true,
                houseNumber: true,
                neighborhood: true,
                biography: true,
                phone: true,
                contactEmail: true,
                contactPhone: true,
                socialNetworks: true,
                createdAt: true,
            },
        });

        return user;
    }

    /**
     * Deleta um usuário permanentemente do banco de dados
     * Esta é uma operação irreversível e deve ser usada com cuidado
     * O Prisma automaticamente deleta todos os dados relacionados devido ao onDelete: Cascade
     * @param id 
     */
    async delete(id: string): Promise<void> {
        await prisma.user.delete({
            where: { id },
        });
    }

    /**
     * Atualiza apenas a senha do usuário
     * Útil para o fluxo de recuperação de senha
     * A nova senha já vem hasheada do service
     * @param id 
     * @param hashedPassword 
     */
    async updatePassword(id: string, hashedPassword: string): Promise<void> {
        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
    }

    /**
     * Salva um registro no histórico de edições do perfil
     * Isso permite que administradores vejam o que foi modificado e quando
     * Os dados alterados são salvos em formato JSON para flexibilidade
     * @param userId 
     * @param changedFields 
     * @returns 
     */
    async saveProfileEditHistory(userId: string, changedFields: Record<string, { oldValue: any; newValue: any }>): Promise<ProfileEditHistory> {
        return prisma.profileEditHistory.create({
            data: {
                userId,
                changedFields,
            },
        });
    }

    /**
     * Busca todo o histórico de edições de um usuário
     * Ordenado do mais recente para o mais antigo
     * Esta função é restrita apenas para administradores
     * @param userId 
     * @returns 
     */
    async getProfileEditHistory(userId: string): Promise<ProfileEditHistory[]> {
        return prisma.profileEditHistory.findMany({
            where: { userId },
            orderBy: { editedAt: "desc" }, // Mais recente primeiro
        });
    }

    /**
     * Busca o perfil público de um usuário
     * Retorna apenas informações básicas que podem ser exibidas publicamente
     * Não inclui dados sensíveis como senhas ou informações administrativas
     * @param userId 
     * @returns 
     */
    async getPublicProfile(userId: string) {
        return prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                city: true,
                state: true,
                biography: true,
                contactEmail: true,
                contactPhone: true,
                socialNetworks: true,
                createdAt: true,
                _count: {
                    select: {
                        donations: true,
                        receivedDonations: true,
                    },
                },
            },
        });
    }

    /**
     * Verifica se um email já está cadastrado
     * Útil para validar unicidade antes de criar um novo usuário
     * Retorna true se o email já existe, false caso contrário
     * @param email 
     * @returns 
     */
    async emailExists(email: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });
        
        return user !== null;
    }

    /**
     * Busca estatísticas completas de um usuário
     * Inclui total de doações criadas, recebidas e em andamento
     * @param userId 
     * @returns 
     */
    async getUserStats(userId: string) {
        const [donationsCreated, donationsReceived, donationsInProgress] = await Promise.all([
            prisma.donation.count({
                where: { donorId: userId },
            }),
            prisma.donation.count({
                where: { 
                    receiverId: userId,
                    status: "COMPLETED",
                },
            }),
            prisma.donation.count({
                where: {
                    OR: [
                        { donorId: userId },
                        { receiverId: userId },
                    ],
                    status: { in: ["IN_PROGRESS", "PICKED_UP"] },
                },
            }),
        ]);

        return {
        donationsCreated,
        donationsReceived,
        donationsInProgress,
        };
    }
}