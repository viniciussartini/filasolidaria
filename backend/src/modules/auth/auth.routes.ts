import { Router } from "express";
import { AuthController } from "../../modules/auth/auth.controller.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from "../../modules/auth/auth.schema.js";

const router = Router();
const authController = new AuthController();

/**
 * POST /auth/register// Registra um novo usuário no sistema
 * Esta é a primeira interação que um usuário novo tem com a aplicação
 * Validamos rigorosamente todos os dados usando o registerSchema
 * que verifica email, senha, idade mínima, formato de CEP e telefone, etc.
 * Se tudo estiver correto, o usuário é criado e já recebe um token
 * permitindo que ele fique automaticamente logado após o cadastro
 */
router.post("/register", validate(registerSchema), authController.register);

/** 
 * POST /auth/login
 * Autentica um usuário existente. Recebe email, senha e plataforma (web ou mobile)
 * A plataforma é importante porque define o tempo de expiração do token:
 *  - Web: o token expira em 7 dias (configurável)
 *  - Mobile: o token expira em 365 dias (praticamente não expira)
 * Essa diferença existe porque em apps mobile é mais inconveniente ter que fazer login frequentemente, e o token fica armazenado de forma
 * mais segura no dispositivo do que em um navegador
*/
router.post("/login", validate(loginSchema), authController.login);

/**
 * POST /auth/logout
 * Invalida o token atual do usuário.
 * Esta rota REQUER autenticação porque precisamos saber qual token revogar
 * O middleware authenticate extrai e valida o token antes de chegar aqui
 * O controller então adiciona esse token à lista de tokens revogados
 * A partir desse momento, mesmo que o token seja válido em termos de
 * assinatura e prazo de validade, ele não funcionará mais
 * Isso implementa um logout "real" que muitas APIs JWT não têm
 */
router.post("/logout", authenticate, authController.logout);

/**
 * POST /auth/forgot-password
 * Inicia o processo de recuperação de senha
 * Recebe apenas o email do usuário, gera um token único de recuperação que expira em 1 hora.
 * Envia um email com um link contendo esse token. O usuário clica no link, vai para o front-end, e lá usa o token
 * para criar uma nova senha através da rota reset-password
 * IMPORTANTE: Sempre retornamos a mesma mensagem, mesmo se o email não existe no sistema
 * para não vazar informações sobre usuários cadastrados.
 */
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * POST /auth/reset-password
 * Completa o processo de recuperação de senha. Recebe o token (que veio do email) e a nova senha.
 * Valida que o token é válido, não expirou e não foi usado antes.
 * Atualiza a senha do usuário com o novo valor (fazendo hash)
 * marca o token como usado para que não possa ser reutilizado.
 * Isso previne que alguém que interceptou o email possa usar o token
 * depois que o usuário legítimo já trocou a senha
 */
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);

/**
 * GET /auth/verify
 * Verifica se o token atual ainda é válido. Esta rota é útil para o front-end verificar periodicamente
 * se o usuário ainda está autenticado, especialmente:
 *  - Quando o app é reaberto após ficar inativo
 *  - Antes de fazer operações sensíveis
 *  - Para decidir se deve redirecionar para a página de login
 * Se o token for válido, retorna informações básicas do usuário.
 * Se for inválido ou expirado, o middleware authenticate já vai
 * lançar um erro antes de chegar no controller
 */
router.get("/verify", authenticate, authController.verifyToken);

export default router;