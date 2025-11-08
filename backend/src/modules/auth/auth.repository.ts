import { prisma } from "../../config/database.js";
import { RevokedToken, PasswordResetToken } from "@prisma/client";

export class AuthRepository {

    /**
     * Salva um token na lista de tokens revogados
     * Quando um usuário faz logout, o token dele é adicionado aqui
     * Isso impede que o token continue sendo usado mesmo após o logout
     * @param token 
     * @param userId 
     * @param expiresAt 
     * @returns 
     */
    async revokeToken(token: string, userId: string, expiresAt: Date): Promise<RevokedToken> {
        return prisma.revokedToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });
    }

    /**
     * Verifica se um token foi revogado (se o usuário fez logout)
     * Retorna true se o token está na lista de revogados, false caso contrário
     * Esta função é chamada em cada requisição autenticada para garantir
     * que tokens de usuários que fizeram logout não possam mais ser usados
     * @param token 
     * @returns 
     */
    async isTokenRevoked(token: string): Promise<boolean> {
        const revokedToken = await prisma.revokedToken.findUnique({
            where: { token },
            select: { id: true }, // Só precisamos saber se existe
        });

        return revokedToken !== null;
    }

    /**
     * Remove tokens revogados que já expiraram
     * Como tokens têm data de expiração, não faz sentido mantê-los
     * revogados para sempre no banco. Esta função limpa os antigos
     * Pode ser executada periodicamente por um job/cron
     * @returns 
     */
    async cleanExpiredRevokedTokens(): Promise<number> {
        const result = await prisma.revokedToken.deleteMany({
        where: {
            expiresAt: {
                lt: new Date(), // lt = less than (menor que a data atual)
            },
        },
        });

        return result.count;
    }

    /**
     * Cria um novo token de recuperação de senha
     * Quando um usuário esquece a senha, geramos um token único
     * Este token é enviado por email e permite que o usuário crie uma nova senha 
     * @param userId 
     * @param token 
     * @param expiresAt 
     * @returns 
     */
    async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
        return prisma.passwordResetToken.create({
        data: {
            userId,
            token,
            expiresAt,
        },
        });
    }

    /**
     * Busca um token de recuperação de senha pelo valor do token
     * Inclui informações do usuário associado
     * Útil para verificar se o token é válido antes de permitir a troca de senha
     * @param token 
     * @returns 
     */
    async findPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
        return prisma.passwordResetToken.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });
    }

    /**
     * Marca um token de recuperação de senha como usado
     * Isso impede que o mesmo token seja usado múltiplas vezes
     * Um token só pode ser usado uma vez por questões de segurança
     * @param tokenId 
     */
    async markPasswordResetTokenAsUsed(tokenId: string): Promise<void> {
        await prisma.passwordResetToken.update({
            where: { id: tokenId },
            data: { used: true },
        });
    }

    /**
     * Invalida todos os tokens de recuperação de senha de um usuário
     * Útil quando o usuário consegue resetar a senha com sucesso
     * ou quando queremos forçar que todos os tokens antigos sejam invalidados 
     * @param userId 
     */
    async invalidateAllPasswordResetTokens(userId: string): Promise<void> {
        await prisma.passwordResetToken.updateMany({
            where: {
                userId,
                used: false,
            },
            data: {
                used: true,
            },
        });
    }

    /**
     * Remove tokens de recuperação de senha que já expiraram
     * Similar à limpeza de tokens revogados, mantém o banco limpo
     * removendo dados desnecessários
     * @returns 
     */
    async cleanExpiredPasswordResetTokens(): Promise<number> {
        const result = await prisma.passwordResetToken.deleteMany({
        where: {
            expiresAt: {
                lt: new Date(),
            },
        },
        });

        return result.count;
    }

    /**
     * Revoga todos os tokens ativos de um usuário
     * Útil em situações de segurança, como quando o usuário muda a senha
     * ou quando detectamos atividade suspeita
     * Força o usuário a fazer login novamente em todos os dispositivos
     * @param userId 
     * @returns 
     */
    async revokeAllUserTokens(userId: string): Promise<number> {
        await this.invalidateAllPasswordResetTokens(userId);
        
        return 0; // Retorna 0 pois não revogamos tokens JWT ativos nesta implementação
    }

    /**
     * Conta quantos tokens de recuperação válidos um usuário tem
     * Útil para prevenir spam de solicitações de recuperação de senha
     * Podemos limitar a quantidade de tokens ativos por usuário
     * @param userId 
     * @returns 
     */
    async countValidPasswordResetTokens(userId: string): Promise<number> {
        return prisma.passwordResetToken.count({
        where: {
            userId,
            used: false,
            expiresAt: {
                gt: new Date(), // gt = greater than (maior que a data atual)
            },
        },
        });
    }
}