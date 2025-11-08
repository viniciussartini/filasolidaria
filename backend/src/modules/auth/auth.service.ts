import { UserRepository } from "../../modules/user/user.repository.js";
import { AuthRepository } from "../../modules/auth/auth.repository.js";
import { CreateUserData, LoginData, LoginResponse } from "../../types/index.js";
import { hashPassword, comparePassword, generateSecureToken } from "../../utils/helpers.js";
import { generateToken, verifyToken, getTokenExpiration } from "../../config/jwt.js";
import { sendEmail } from "../../config/email.js";
import { 
    ConflictError, 
    UnauthorizedError, 
    NotFoundError,
    ValidationError 
} from "../../shared/errors/AppError.js";

export class AuthService {
    private userRepository: UserRepository;
    private authRepository: AuthRepository;

    constructor() {
        this.userRepository = new UserRepository();
        this.authRepository = new AuthRepository();
    }

    /**
     * Registra um novo usuário no sistema
     * Este método coordena várias etapas: valida se o email está disponível,
     * faz o hash da senha (nunca armazenamos senhas em texto puro),
     * cria o usuário no banco, e retorna os dados necessários para o login
     * @param data 
     * @returns 
     */
    async register(data: CreateUserData): Promise<LoginResponse> {
        const emailExists = await this.userRepository.emailExists(data.email);
        
        if (emailExists) {
            throw new ConflictError("Este email já está cadastrado");
        }

        const hashedPassword = await hashPassword(data.password);

        const user = await this.userRepository.create({
            ...data, 
            password: hashedPassword,
        });

        const token = generateToken({
            userId: user.id,
            email: user.email,
            platform: "web",
        });

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        };
    }

    /**
     * Autentica um usuário e retorna um token JWT
     * O processo é simples mas seguro: busca o usuário, compara a senha,
     * e se tudo estiver correto, gera um token válido
     * @param data 
     * @returns 
     */
    async login(data: LoginData): Promise<LoginResponse> {
        const user = await this.userRepository.findByEmail(data.email, true);

        if (!user || !user.password) {
            throw new UnauthorizedError("Email ou senha incorretos");
        }

        const isPasswordValid = await comparePassword(data.password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedError("Email ou senha incorretos");
        }

        const token = generateToken({
            userId: user.id,
            email: user.email,
            platform: data.platform,
        });

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        };
    }

    /**
     * Realiza o logout do usuário
     * Em sistemas JWT, logout é um desafio porque tokens são stateless
     * Nossa solução é adicionar o token a uma lista de revogados
     * Assim o middleware pode verificar se o token foi invalidado
     * @param token 
     */
    async logout(token: string): Promise<void> {
        const decoded = verifyToken(token);
        const expiresAt = getTokenExpiration(token);

        if (!expiresAt) {
            throw new ValidationError("Token inválido");
        }

        await this.authRepository.revokeToken(token, decoded.userId, expiresAt);
    }

    /**
     * Verifica se um token foi revogado (logout foi feito)
     * Este método é chamado pelo middleware de autenticação
     * em cada requisição protegida
     * @param token 
     * @returns 
     */
    async isTokenRevoked(token: string): Promise<boolean> {
        return this.authRepository.isTokenRevoked(token);
    }

    /**
     * Inicia o processo de recuperação de senha
     * Gera um token único, salva no banco, e envia por email
     * O token tem validade limitada (geralmente 1 hora) por segurança
     * @param email 
     * @returns 
     */
    async forgotPassword(email: string): Promise<void> {
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
            return;
        }

        const validTokensCount = await this.authRepository.countValidPasswordResetTokens(user.id);
        
        if (validTokensCount >= 3) {
            throw new ValidationError(
                "Você já tem solicitações de recuperação pendentes. Por favor, verifique seu email ou aguarde antes de solicitar novamente."
            );
        }

        const resetToken = generateSecureToken(32);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await this.authRepository.createPasswordResetToken(
            user.id,
            resetToken,
            expiresAt
        );

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        const emailHtml = `
        <h2>Recuperação de Senha - Fila Solidária</h2>
        <p>Olá, ${user.name}!</p>
        <p>Você solicitou a recuperação de senha da sua conta.</p>
        <p>Clique no link abaixo para criar uma nova senha:</p>
        <p><a href="${resetUrl}">Redefinir minha senha</a></p>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou esta recuperação, ignore este email.</p>
        <br>
        <p>Equipe Fila Solidária</p>
        `;

        const emailText = `
        Recuperação de Senha - Fila Solidária
        
        Olá, ${user.name}!
        
        Você solicitou a recuperação de senha da sua conta.
        
        Acesse o link abaixo para criar uma nova senha:
        ${resetUrl}
        
        Este link expira em 1 hora.
        
        Se você não solicitou esta recuperação, ignore este email.
        
        Equipe Fila Solidária
        `;

        await sendEmail({
            to: user.email,
            subject: "Recuperação de Senha - Fila Solidária",
            html: emailHtml,
            text: emailText,
        });
    }

    /**
     * Completa o processo de recuperação de senha
     * Valida o token, verifica se não expirou e não foi usado,
     * então atualiza a senha do usuário
     * @param token 
     * @param newPassword 
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        const resetToken = await this.authRepository.findPasswordResetToken(token);

        if (!resetToken) {
            throw new NotFoundError("Token de recuperação inválido ou expirado");
        }

        if (resetToken.used) {
            throw new ValidationError("Este token já foi utilizado");
        }

        if (resetToken.expiresAt < new Date()) {
            throw new ValidationError("Este token expirou. Solicite uma nova recuperação de senha");
        }

        const hashedPassword = await hashPassword(newPassword);
        await this.userRepository.updatePassword(resetToken.userId, hashedPassword);
        await this.authRepository.markPasswordResetTokenAsUsed(resetToken.id);
        await this.authRepository.invalidateAllPasswordResetTokens(resetToken.userId);
    }
}