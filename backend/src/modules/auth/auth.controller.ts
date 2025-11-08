import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../modules/auth/auth.service.js";
import { AuthenticatedRequest } from "../../types/index.js";

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    /**
     * Rota esperada: POST /auth/register
     * Registra um novo usuário no sistema
     * Body: todos os dados do usuário conforme validado pelo registerSchema
     * Retorna: token JWT e dados básicos do usuário criado
     * @param req 
     * @param res 
     * @param next 
     */
    register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.authService.register(req.body);

            res.status(201).json({
                status: "success",
                message: "Usuário registrado com sucesso",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: POST /auth/login
     * Autentica um usuário existente
     * Body: { email, password, platform }
     * Retorna: token JWT e dados básicos do usuário
     * @param req 
     * @param res 
     * @param next 
     */
    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.authService.login(req.body);

            res.status(200).json({
                status: "success",
                message: "Login realizado com sucesso",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: POST /auth/logout
     * Realiza o logout do usuário
     * Headers: Authorization: Bearer TOKEN
     * Esta rota requer autenticação - o middleware authenticate deve ser aplicado
     * @param req 
     * @param res 
     * @param next 
     */
    logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authHeader = req.headers.authorization!;
            const token = authHeader.split(" ")[1];
            await this.authService.logout(token);

            res.status(200).json({
                status: "success",
                message: "Logout realizado com sucesso",
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: POST /auth/forgot-password
     * Inicia o processo de recuperação de senha
     * Body: { email }
     * Envia um email com link para resetar a senha
     * @param req 
     * @param res 
     * @param next 
     */
    forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email } = req.body;
            await this.authService.forgotPassword(email);

            res.status(200).json({
                status: "success",
                message: "Se o email estiver cadastrado, você receberá instruções para recuperar sua senha",
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: POST /auth/reset-password
     * Completa o processo de recuperação de senha
     * Body: { token, newPassword, confirmPassword }
     * O token vem do link enviado por email
     * @param req 
     * @param res 
     * @param next 
     */
    resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { token, newPassword } = req.body;
            await this.authService.resetPassword(token, newPassword);

            res.status(200).json({
                status: "success",
                message: "Senha redefinida com sucesso. Faça login com sua nova senha",
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: GET /auth/verify
     * Verifica se o token atual ainda é válido
     * Headers: Authorization: Bearer TOKEN
     * Útil para o front-end verificar se o usuário ainda está autenticado
     * especialmente após o app ficar inativo por um tempo
     * @param req 
     * @param res 
     * @param next 
     */
    verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.status(200).json({
                status: "success",
                message: "Token válido",
                data: {
                    user: req.user,
                },
            });
        } catch (error) {
            next(error);
        }
    };
}