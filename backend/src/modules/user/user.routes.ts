import { Router } from "express";
import { UserController } from "../user/user.controller.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { updateProfileSchema } from "../../modules/auth/auth.schema.js";
import { mongoIdSchema } from "../../shared/schemas/common.schema.js";

const router = Router();
const userController = new UserController();

/**
 * GET /users/profile
 * Retorna o perfil completo do usuário autenticado
 * Esta é uma rota privada - apenas o próprio usuário vê seu perfil completo
 * Inclui todos os dados pessoais, estatísticas de doações, etc.
 * É diferente do perfil público que qualquer pessoa pode ver
 */
router.get("/profile", authenticate, userController.getProfile);

/**
 * PATCH /users/profile
 * Atualiza o perfil do usuário autenticado
 * Esta rota permite atualização parcial - o usuário pode enviar
 * apenas os campos que deseja modificar. Por exemplo, pode enviar apenas { city: "Rio de Janeiro" }
 * sem precisar enviar todos os outros campos
 * Cada atualização é registrada no histórico de edições com:
 *  - Data da alteração
 *  - Campos que foram modificados
 *  - Valores antigos e novos
 * Esse histórico é visível apenas para administradores
 */
router.patch("/profile", authenticate, validate(updateProfileSchema), userController.updateProfile);

/**
 * PATCH /users/password
 * Atualiza apenas a senha do usuário
 * Esta rota é separada da atualização de perfil porque envolve
 * validação adicional por questões de segurança
 * O usuário DEVE fornecer a senha atual para poder criar uma nova
 * Isso garante que se alguém deixou o computador desbloqueado com
 * a sessão ativa, não pode simplesmente trocar a senha sem saber a atual
 */
router.patch("/password", authenticate, userController.updatePassword);

/**
 * DELETE /users/account
 * Exclui permanentemente a conta do usuário. ATENÇÃO: Esta é uma operação IRREVERSÍVEL
 * Quando executada, deleta:
 *  - O usuário
 *  - Todas as doações criadas pelo usuário (cascade)
 *  - Todas as candidaturas do usuário (cascade)
 *  - Todo o histórico de edições de perfil (cascade)
 *  - Tokens revogados e de recuperação de senha (cascade)
 *  Em uma aplicação real, você pode querer:
 *  - Pedir confirmação adicional (senha ou código por email)
 *  - Fazer soft delete ao invés de hard delete
 *  - Manter dados anonimizados para estatísticas
 */
router.delete("/account", authenticate, userController.deleteAccount);

/**
 * GET /users/profile/history
 * Retorna o histórico de edições do perfil do usuário
 * Por enquanto, apenas o próprio usuário pode ver seu histórico
 * Em uma implementação com sistema de roles, administradores poderiam ver o histórico de qualquer usuário para fins de auditoria
 * Útil para detectar:
 *  - Atividades suspeitas (muitas mudanças em pouco tempo)
 *  - Recuperar informações antigas (qual era meu endereço anterior?)
 *  - Auditoria de compliance (quem mudou o quê e quando?)
 */
router.get("/profile/history", authenticate, userController.getProfileEditHistory);

/**
 * GET /users/stats
 * Retorna estatísticas do usuário autenticado. Mostra métricas úteis como:
 *  - Total de doações criadas
 *  - Total de doações recebidas (concluídas)
 *  - Total de doações em andamento
 * Essas estatísticas ajudam o usuário a acompanhar sua atividade
 * e podem ser usadas para gamificação (badges, rankings, etc)
 */
router.get("/stats", authenticate, userController.getUserStats);

/**
 * GET /users/:userId/public
 * Retorna o perfil público de qualquer usuário. Esta é uma rota PÚBLICA - não requer autenticação
 * Retorna apenas informações que podem ser compartilhadas:
 *  - Nome
 *  - Cidade e estado
 *  - Biografia
 *  - Redes sociais
 *  - Data de cadastro
 *  - Total de doações criadas e recebidas
 * NÃO retorna informações sensíveis como:
 *  - Email pessoal
 *  - Telefone
 *  - Endereço completo
 *  - Histórico de edições
 * Esta rota é útil para que pessoas interessadas em uma doação
 * possam conhecer melhor o doador antes de se candidatar
 */
router.get("/:userId/public", validate(mongoIdSchema, "params"), userController.getPublicProfile);

/**
 * GET /users/:userId/stats
 * Retorna estatísticas públicas de qualquer usuário
 * Similar ao perfil público, qualquer pessoa pode ver
 * Mostra a reputação do usuário na plataforma:
 *  - Quantas doações ele já fez
 *  - Quantas doações ele recebeu
 *  - Quantas estão em andamento
 * Isso cria transparência e confiança na comunidade
 * Um usuário com muitas doações concluídas tem mais credibilidade
 */
router.get("/:userId/stats", validate(mongoIdSchema, "params"), userController.getPublicUserStats);

export default router;