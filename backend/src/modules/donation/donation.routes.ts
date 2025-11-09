import { Router } from "express";
import { DonationController } from "../../modules/donation/donation.controller.js";
import { validate, validateMultiple } from "../../middlewares/validation.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
    createDonationSchema,
    updateDonationSchema,
    donationFiltersSchema,
    paginationSchema,
    signalReturnSchema,
    updateProgressSchema,
} from "../../modules/donation/donation.schema.js";
import { mongoIdSchema } from "../../shared/schemas/common.schema.js";

const router = Router();
const donationController = new DonationController();

/**
 * POST /donations
 * Cria uma nova doação
 * Esta rota REQUER autenticação - apenas usuários logados podem criar doações
 * O usuário autenticado automaticamente se torna o doador
 * A doação é criada com status OPEN e fica imediatamente visível
 * para todos os usuários que podem se candidatar para recebê-la
 * O sistema gera automaticamente um ID sequencial amigável (ex: #1234)
 * além do ObjectId do MongoDB usado internamente
 */
router.post("/", authenticate, validate(createDonationSchema), donationController.createDonation);

/**
 * GET /donations
 * Lista doações com filtros opcionais e paginação
 * Esta é uma rota PÚBLICA - qualquer pessoa pode ver doações
 * mesmo sem estar autenticada, para promover transparência
 * e permitir que visitantes conheçam a plataforma
 * Aceita vários query parameters para filtrar:
 *  - status: OPEN, IN_PROGRESS, PICKED_UP, COMPLETED
 *  - category: FOOD, CLOTHING, FURNITURE, etc
 *  - city: nome da cidade
 *  - state: sigla do estado (ex: SP, RJ)
 *  - page: número da página (padrão: 1)
 *  - limit: itens por página (padrão: 10, máximo: 100)
 * Exemplo: GET /donations?category=FOOD&city=São Paulo&page=2&limit=20
 */
router.get("/", validateMultiple({
    query: paginationSchema.merge(donationFiltersSchema),
    }),
    donationController.listDonations
);

/**
 * GET /donations/my-donations
 * Lista todas as doações criadas pelo usuário autenticado
 * IMPORTANTE: Esta rota DEVE vir ANTES de /donations/:id
 * Se vier depois, o Express vai interpretar "my-donations" como um ID
 * e tentar processar pela rota parametrizada
 * Esta rota mostra todas as doações do usuário independente do status:
 *  - OPEN: esperando candidatos
 *  - IN_PROGRESS: receptor escolhido, aguardando retirada
 *  - PICKED_UP: retirada confirmada, aguardando conclusão
 *  - COMPLETED: doação finalizada com sucesso
 * Útil para a página "Minhas Doações" no front-end
 */
router.get("/my-donations", authenticate, donationController.getMyDonations);

/**
 * GET /donations/received
 * Lista todas as doações que o usuário está recebendo ou recebeu
 * Mostra doações onde o usuário foi escolhido como receptor
 * Inclui doações em andamento e já concluídas
 * Não inclui candidaturas que ainda não foram aceitas
 * (para isso usa a rota /donations/my-candidacies)
 * Útil para a página "Doações Recebidas" no front-end
 */
router.get("/received", authenticate, donationController.getReceivedDonations);

/**
 * GET /donations/my-candidacies
 * Lista todas as candidaturas ativas do usuário
 * Mostra para quais doações o usuário se candidatou
 * e que ainda estão com status OPEN (esperando o doador escolher)
 * Assim que o doador escolhe alguém (seja o usuário ou não),
 * a candidatura desaparece desta lista
 * Útil para o usuário acompanhar suas candidaturas pendentes
 */
router.get("/my-candidacies", authenticate, donationController.getMyCandidacies);

/**
 * GET /donations/:id
 * Busca uma doação específica pelo ID
 * Esta é uma rota PÚBLICA - qualquer pessoa pode ver detalhes
 * No entanto, algumas informações são restritas:
 *  - Se a doação está OPEN: todos veem tudo
 *  - Se tem receptor escolhido: apenas doador e receptor veem
 * informações de contato e progresso dos checkboxes
 * O ID pode ser tanto o ObjectId do MongoDB quanto o ID sequencial
 * mas para simplificar, usamos apenas o ObjectId nas rotas
 */
router.get("/:id", validate(mongoIdSchema, "params"), donationController.getDonation);

/**
 * PATCH /donations/:id
 * Atualiza uma doação existente
 * IMPORTANTE: Só permite editar doações com status OPEN
 * Uma vez que um receptor é escolhido, a doação não pode mais ser editada
 * Isso protege receptores que se candidataram baseados em informações específicas
 * Por exemplo, se alguém se candidatou porque a doação era na zona norte
 * e o doador muda para zona sul depois, isso seria injusto
 * Apenas o doador (criador da doação) pode editá-la
 * Todas as modificações são registradas no histórico público de edições
 */
router.patch("/:id", authenticate, validateMultiple({
    params: mongoIdSchema,
    body: updateDonationSchema,
    }),
    donationController.updateDonation
);

/**
 * DELETE /donations/:id
 * Exclui permanentemente uma doação
 * Similar à edição, só permite excluir doações com status OPEN
 * Se já tem receptor, não pode mais excluir
 * Apenas o doador pode excluir sua própria doação
 * Quando deletada, todas as candidaturas associadas também são removidas
 * automaticamente devido ao cascade delete configurado no schema do Prisma
 */
router.delete("/:id", authenticate, validate(mongoIdSchema, "params"), donationController.deleteDonation);

/**
 * GET /donations/:id/history
 * Retorna o histórico público de edições da doação
 * IMPORTANTE: Este histórico é PÚBLICO - qualquer pessoa pode ver
 * Diferente do histórico de perfil que é restrito a administradores
 * O histórico de doações é público para transparência
 * Candidatos podem ver se a doação mudou depois que eles se candidataram
 * Isso cria confiança e permite que pessoas detectem mudanças suspeitas
 * Por exemplo, se o doador muda constantemente o endereço, isso pode ser
 * um sinal de alerta para potenciais receptores
 */
router.get("/:id/history", validate(mongoIdSchema, "params"), donationController.getDonationEditHistory);

/**
 * POST /donations/:id/apply
 * Permite que um usuário se candidate para receber uma doação
 * Este é o primeiro passo para receber uma doação - manifestar interesse
 * REGRAS importantes que o service valida:
 *  - Usuário não pode se candidatar para própria doação
 *  - Só pode se candidatar para doações com status OPEN
 *  - Não pode se candidatar duas vezes para a mesma doação
 * Após se candidatar, o usuário aparece na lista de candidatos
 * que o doador pode visualizar para escolher quem vai receber
 */
router.post("/:id/apply", authenticate, validate(mongoIdSchema, "params"), donationController.applyForDonation);

/**
 * GET /donations/:id/candidates
 * Lista todos os candidatos de uma doação
 * IMPORTANTE: Apenas o DOADOR pode ver esta lista
 * Isso protege a privacidade dos candidatos - eles não querem que
 * outros candidatos vejam que também estão interessados
 * O doador vê informações úteis para tomar decisão:
 *  - Nome, idade, cidade e estado de cada candidato
 *  - Biografia (se preenchida)
 *  - Quantas doações cada candidato já recebeu (reputação)
 *  - Data que se candidatou (ordem de chegada)
 * Isso ajuda o doador a fazer uma escolha informada
 */
router.get("/:id/candidates", authenticate, validate(mongoIdSchema, "params"), donationController.getDonationCandidates);

/**
 * DELETE /donations/:id/candidacy
 * Permite que o usuário retire sua candidatura
 * Útil quando o usuário muda de ideia ou já recebeu outra doação similar
 * REGRA: Só funciona se a doação ainda está com status OPEN
 * Se o usuário já foi escolhido como receptor (status IN_PROGRESS),
 * ele deve usar a rota /cancel-receiving ao invés desta
 */
router.delete("/:id/candidacy", authenticate, validate(mongoIdSchema, "params"), donationController.withdrawCandidacy);

/**
 * POST /donations/:id/choose-receiver
 * O doador escolhe quem vai receber a doação
 * Este é um momento CRÍTICO no fluxo da aplicação
 * Várias coisas acontecem automaticamente:
 *  1. Status muda de OPEN para IN_PROGRESS
 *  2. O receiverId é definido
 *  3. Todas as OUTRAS candidaturas são REMOVIDAS
 *  4. Um registro de progresso é criado (para os checkboxes)
 *  5. A doação DESAPARECE da listagem pública
 *  6. Apenas doador e receptor veem a doação agora
 * Requer o receiverId no body da requisição
 */
router.post("/:id/choose-receiver", authenticate, validate(mongoIdSchema, "params"), donationController.chooseReceiver);

/**
 * POST /donations/:id/cancel-receiving
 * O receptor cancela o recebimento da doação
 * Isso pode acontecer quando o receptor:
 *  - Não consegue mais buscar a doação
 *  - Mudou de ideia
 *  - Encontrou outra solução
 * REGRA: Só funciona se status é IN_PROGRESS
 * Se já confirmou retirada (PICKED_UP), não pode mais cancelar
 * Neste caso, precisa usar o fluxo de devolução
 * Quando cancela:
 *  - Status volta para OPEN
 *  - receiverId é removido
 *  - Progresso dos checkboxes é deletado
 *  - Doação volta a ser visível ao público
 *  - Outras pessoas podem se candidatar novamente
 */
router.post("/:id/cancel-receiving", authenticate, validate(mongoIdSchema, "params"), donationController.cancelReceiving);

/**
 * PATCH /donations/:id/progress
 * Atualiza os checkboxes de progresso da doação
 * Esta é a rota que implementa todo o fluxo de acompanhamento
 * Doador e receptor marcam checkboxes conforme as etapas avançam
 * REGRAS IMPORTANTES:
 *  - Doador só pode marcar checkboxes "ByDonor"
 *  - Receptor só pode marcar checkboxes "ByReceiver"
 *  - Checkboxes de conclusão só habilitam após retirada confirmada
 *  - Devolução só pode ser sinalizada após retirada confirmada
 * O body contém os checkboxes que deseja marcar/desmarcar
 * Exemplo: { pickupConfirmedByDonor: true }
 * O service automaticamente atualiza o STATUS da doação baseado
 * nos checkboxes marcados:
 *  - Ambos confirmaram retirada → status vira PICKED_UP
 *  - Ambos confirmaram conclusão → status vira COMPLETED
 */
router.patch("/:id/progress", authenticate, validateMultiple({
    params: mongoIdSchema,
    body: updateProgressSchema,
    }),
    donationController.updateProgress
);

/**
 * POST /donations/:id/signal-return
 * O receptor sinaliza que quer devolver a doação
 * Isso abre uma caixa de texto para explicar o MOTIVO da devolução
 * Motivos comuns:
 *  - Item não estava conforme descrito
 *  - Item estava danificado
 *  - Mudança de necessidade
 * O motivo fica visível para doador E receptor
 * Isso cria transparência sobre o que deu errado
 * REGRA: Só pode devolver se a retirada JÁ foi confirmada por ambos
 * (ou seja, o item já está com o receptor)
 * Após sinalizar, doador e receptor precisam confirmar a devolução
 */
router.post("/:id/signal-return", authenticate, validateMultiple({
    params: mongoIdSchema,
    body: signalReturnSchema,
    }),
    donationController.signalReturn
);

/**
 * POST /donations/:id/confirm-return
 * Confirma o processo de devolução (doador ou receptor)
 * Ambos precisam confirmar para completar a devolução
 * Quando AMBOS confirmam:
 *  1. Status volta para OPEN
 *  2. receiverId é removido
 *  3. Motivo da devolução é limpo
 *  4. Registro de progresso é deletado (todos checkboxes resetados)
 *  5. Doação volta a ser visível ao público
 *  6. Novas pessoas podem se candidatar
 * É como um "reset" completo da doação para tentar novamente
 * com outro receptor
 * Esta rota pode ser chamada tanto pelo doador quanto pelo receptor
 * O sistema identifica automaticamente quem está confirmando
 */
router.post("/:id/confirm-return", authenticate, validate(mongoIdSchema, "params"), donationController.confirmReturn);

/**
 * GET /donations/:id/progress
 * Busca o estado atual do progresso de uma doação
 * IMPORTANTE: Apenas doador e receptor podem ver
 * Visitantes não têm acesso a estas informações
 * Retorna um resumo útil para o front-end:
 *  - Quais checkboxes estão marcados
 *  - Se retirada foi confirmada por ambos
 *  - Se conclusão foi confirmada por ambos
 *  - Se há processo de devolução em andamento
 *  - Se devolução foi completada
 *  - Informações de contato (dependendo do tipo de retirada)
 * Este resumo ajuda o front-end a decidir: 
 *  - Quais checkboxes mostrar
 *  - Quais checkboxes habilitar
 *  - Que mensagens exibir ao usuário
 */
router.get("/:id/progress", authenticate, validate(mongoIdSchema, "params"), donationController.getProgress);

export default router;