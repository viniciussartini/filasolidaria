import { UserRepository } from "../../modules/user/user.repository.js";
import { UpdateUserData } from "../../types/index.js";
import { getObjectDifferences, hashPassword } from "../../utils/helpers.js";
import { NotFoundError, ForbiddenError, ConflictError } from "../../shared/errors/AppError.js";

export class UserService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    /**
     * Busca o perfil completo do usuário autenticado
     * Retorna todos os dados do usuário exceto a senha
     * Também inclui estatísticas de doações (criadas, recebidas, em andamento)
     * @param userId 
     * @returns 
     */

    async getProfile(userId: string) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError("Usuário não encontrado");
        }

        const stats = await this.userRepository.getUserStats(userId);

        return {
            ...user,
            stats,
        };
    }

    /**
     * // Busca o perfil público de qualquer usuário
     * Retorna apenas informações que podem ser exibidas publicamente
     * Não inclui dados sensíveis ou administrativos
     * Qualquer pessoa pode ver o perfil público de outro usuário
     * @param userId 
     * @returns 
     */

    async getPublicProfile(userId: string) {
        const profile = await this.userRepository.getPublicProfile(userId);

        if (!profile) {
            throw new NotFoundError("Usuário não encontrado");
        }

        return profile;
    }

    /**
     * Atualiza o perfil do usuário
     * Este é um método complexo porque precisa rastrear o que foi alterado
     * e salvar essa informação no histórico de edições
     * O histórico é importante para auditoria e pode ser visualizado por administradores
     * @param userId 
     * @param data 
     * @returns 
     */

    async updateProfile(userId: string, data: UpdateUserData) {
        const currentUser = await this.userRepository.findById(userId);

        if (!currentUser) {
            throw new NotFoundError("Usuário não encontrado");
        }

        if (data.contactEmail && data.contactEmail !== currentUser.contactEmail) {
            const emailExists = await this.userRepository.emailExists(data.contactEmail);
            if (emailExists) {
                throw new ConflictError("Este email de contato já está em uso");
            }
        }

        const changedFields = getObjectDifferences(currentUser, data);

        if (Object.keys(changedFields).length === 0) {
            return currentUser;
        }

        const updatedUser = await this.userRepository.update(userId, data);

        await this.userRepository.saveProfileEditHistory(userId, changedFields);

        return updatedUser;
    }

    /**
     * // Atualiza apenas a senha do usuário
     * Este método é separado da atualização de perfil porque envolve
     * validação adicional (senha atual) por questões de segurança
     * @param userId 
     * @param currentPassword 
     * @param newPassword 
     */

    async updatePassword(userId: string, currentPassword: string, newPassword: string ): Promise<void> {
        const user = await this.userRepository.findById(userId, true);

        if (!user || !user.password) {
            throw new NotFoundError("Usuário não encontrado");
        }

        const { comparePassword } = await import("../../utils/helpers.js");
        const isCurrentPasswordValid = await comparePassword(
            currentPassword,
            user.password
        );

        if (!isCurrentPasswordValid) {
            throw new ForbiddenError("Senha atual incorreta");
        }

        const hashedNewPassword = await hashPassword(newPassword);

        await this.userRepository.updatePassword(userId, hashedNewPassword);
    }

    /**
     * Exclui permanentemente a conta do usuário
     * Esta é uma operação irreversível e deve ser usada com muito cuidado
     * Graças ao cascade delete do Prisma, isso também remove:
     *  - Todas as doações criadas pelo usuário
     *  - Todas as candidaturas do usuário
     *  - Todo o histórico de edições do perfil
     *  - Tokens revogados e de recuperação de senha
     * @param userId 
     */
    async deleteAccount(userId: string): Promise<void> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
        throw new NotFoundError("Usuário não encontrado");
        }

        // Incluir verificação se o usuário não tem doações em andamento

        await this.userRepository.delete(userId);
    }

    /**
     * Busca o histórico completo de edições do perfil de um usuário
     * IMPORTANTE: Este método deve ser restrito apenas para administradores
     * No controller, devemos verificar se o usuário solicitante é admin antes de chamar este método
     * @param userId 
     * @param requestingUserId 
     * @returns 
     */

    async getProfileEditHistory(userId: string, requestingUserId: string) {
        if (userId !== requestingUserId) {
        throw new ForbiddenError(
            "Apenas administradores podem visualizar histórico de edições de outros usuários"
        );
        }

        const user = await this.userRepository.findById(userId);

        if (!user) {
        throw new NotFoundError("Usuário não encontrado");
        }

        return this.userRepository.getProfileEditHistory(userId);
    }

    /**
     * Busca estatísticas detalhadas de um usuário
     * Mostra total de doações criadas, recebidas e em andamento
     * Útil para dashboards e perfis
     * @param userId 
     * @returns 
     */

    async getUserStats(userId: string) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError("Usuário não encontrado");
        }

        return this.userRepository.getUserStats(userId);
    }

    /**
     * Verifica se um usuário existe
     * Útil para validações em outros services
     * @param userId 
     * @returns 
     */
    async userExists(userId: string): Promise<boolean> {
        const user = await this.userRepository.findById(userId);
        return user !== null;
    }
}