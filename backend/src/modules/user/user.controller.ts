import { Response, NextFunction } from "express";
import { UserService } from "../../modules/user/user.service.js";
import { AuthenticatedRequest } from "../../types/index.js";

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    /**
     * Rota esperada: GET /users/profile
     * Retorna o perfil completo do usuário autenticado
     * Headers: Authorization: Bearer TOKEN
     * Retorna todos os dados do usuário incluindo estatísticas de doações
     * @param req 
     * @param res 
     * @param next 
     */
    getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.userId;
            const profile = await this.userService.getProfile(userId);

            res.status(200).json({
                status: "success",
                data: profile,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: GET /users/:userId/public
     * Retorna o perfil público de qualquer usuário
     * Não requer autenticação - qualquer pessoa pode ver
     * Retorna apenas informações públicas (sem dados sensíveis)
     * @param req 
     * @param res 
     * @param next 
     */
    getPublicProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId } = req.params;
            const profile = await this.userService.getPublicProfile(userId);

            res.status(200).json({
                status: "success",
                data: profile,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: PATCH /users/profile
     * Atualiza o perfil do usuário autenticado
     * Headers: Authorization: Bearer TOKEN
     * Body: campos que deseja atualizar (todos opcionais)
     * Registra automaticamente no histórico de edições
     * @param req 
     * @param res 
     * @param next 
     */
    updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.userId;
            const updatedProfile = await this.userService.updateProfile(userId, req.body);

            res.status(200).json({
                status: "success",
                message: "Perfil atualizado com sucesso",
                data: updatedProfile,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: PATCH /users/password
     * Atualiza a senha do usuário
     * Headers: Authorization: Bearer TOKEN// Body: { currentPassword, newPassword, confirmPassword }
     * Requer a senha atual por segurança
     * @param req 
     * @param res 
     * @param next 
     */

    updatePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.userId;
            const { currentPassword, newPassword } = req.body;
            await this.userService.updatePassword(userId, currentPassword, newPassword);

            res.status(200).json({
                status: "success",
                message: "Senha atualizada com sucesso",
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: DELETE /users/account
     * Exclui permanentemente a conta do usuário
     * Headers: Authorization: Bearer TOKEN
     * IMPORTANTE: Esta é uma operação irreversível
     * Remove o usuário e todos os dados relacionados (cascade delete)
     * @param req 
     * @param res 
     * @param next 
     */

    deleteAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.userId;
            await this.userService.deleteAccount(userId);

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: GET /users/profile/history
     * Busca o histórico de edições do perfil
     * Headers: Authorization: Bearer TOKEN
     * IMPORTANTE: Atualmente só permite ver o próprio histórico
     * Em produção com sistema de roles, admins poderiam ver de qualquer usuário
     * @param req 
     * @param res 
     * @param next 
     */
    getProfileEditHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.userId;
            const history = await this.userService.getProfileEditHistory(
                userId,
                userId // Por enquanto, usuário só vê próprio histórico
            );

            res.status(200).json({
                status: "success",
                data: history,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: GET /users/stats
     * Busca estatísticas do usuário
     * Headers: Authorization: Bearer TOKEN
     * Retorna total de doações criadas, recebidas e em andamento
     * @param req 
     * @param res 
     * @param next 
     */
    getUserStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.userId;
            const stats = await this.userService.getUserStats(userId);

            res.status(200).json({
                status: "success",
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: GET /users/:userId/stats
     * Busca estatísticas públicas de qualquer usuário
     * Não requer autenticação
     * Útil para mostrar reputação de doadores/receptores
     * @param req 
     * @param res 
     * @param next 
     */
    getPublicUserStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId } = req.params;
            const stats = await this.userService.getUserStats(userId);

            res.status(200).json({
                status: "success",
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    };
}