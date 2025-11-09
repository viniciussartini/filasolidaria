import { Response, NextFunction } from "express";
import { DonationService } from "../../modules/donation/donation.service.js";
import { AuthenticatedRequest } from "../../types/index.js";

export class DonationController {
    private donationService: DonationService;

    constructor() {
        this.donationService = new DonationService();
    }

    /**
     * Rota esperada: POST /donations
     * Cria uma nova doação
     * Headers: Authorization: Bearer TOKEN
     * Body: dados da doação conforme validado pelo createDonationSchema
     * Doação é criada automaticamente com status OPEN
     * @param req 
     * @param res 
     * @param next 
     */
    createDonation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const donorId = req.user!.userId;
            const donation = await this.donationService.createDonation(donorId, req.body);

            res.status(201).json({
                status: "success",
                message: "Doação criada com sucesso",
                data: donation,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: GET /donations
     * Lista doações com filtros e paginação
     * Query params: status, category, city, state, page, limit
     * Não requer autenticação - qualquer pessoa pode ver doações abertas
     * @param req 
     * @param res 
     * @param next 
     */
    listDonations = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { status, category, city, state, page, limit } = req.query;

            const filters = {
                status: status as any,
                category: category as any,
                city: city as string,
                state: state as string,
            };

            const pageNum = page ? parseInt(page as string, 10) : 1;
            const limitNum = limit ? parseInt(limit as string, 10) : 10;

            const result = await this.donationService.listDonations(
                filters,
                pageNum,
                limitNum
            );

            res.status(200).json({
                status: "success",
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: GET /donations/:id
     * Busca uma doação específica pelo ID
     * Não requer autenticação - qualquer pessoa pode ver detalhes
     * Se a doação tem receptor, só doador e receptor veem informações completas
     * @param req 
     * @param res 
     * @param next 
     */
    getDonation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const donation = await this.donationService.getDonation(id);

            res.status(200).json({
                status: "success",
                data: donation,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: PATCH /donations/:id
     * Atualiza uma doação existente
     * Headers: Authorization: Bearer TOKEN
     * Body: campos que deseja atualizar (todos opcionais)
     * IMPORTANTE: Só permite editar doações com status OPEN
     * @param req 
     * @param res 
     * @param next 
     */
    updateDonation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;

            const updatedDonation = await this.donationService.updateDonation(
                id,
                userId,
                req.body
            );

            res.status(200).json({
                status: "success",
                message: "Doação atualizada com sucesso",
                data: updatedDonation,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: DELETE /donations/:id
     * Exclui uma doação
     * Headers: Authorization: Bearer TOKEN
     * IMPORTANTE: Só permite excluir doações com status OPEN
     * @param req 
     * @param res 
     * @param next 
     */
    deleteDonation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;

            await this.donationService.deleteDonation(id, userId);

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: GET /donations/:id/history
     * Busca o histórico de edições de uma doação
     * Não requer autenticação - histórico é público para transparência
     * Permite que candidatos vejam se a doação mudou após se candidatarem
     * @param req 
     * @param res 
     * @param next 
     */
    getDonationEditHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;

            const history = await this.donationService.getDonationEditHistory(id);

            res.status(200).json({
                status: "success",
                data: history,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: GET /donations/my-donations
     * Lista todas as doações criadas pelo usuário autenticado
     * Headers: Authorization: Bearer TOKEN
     * Retorna doações em todos os status (OPEN, IN_PROGRESS, etc)
     * @param req 
     * @param res 
     * @param next 
     */
    getMyDonations = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.userId;

            const donations = await this.donationService.getMyDonations(userId);

            res.status(200).json({
                status: "success",
                data: donations,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: GET /donations/received
     * Lista todas as doações que o usuário está recebendo ou recebeu
     * Headers: Authorization: Bearer TOKEN
     * Mostra doações onde o usuário foi escolhido como receptor
     * @param req 
     * @param res 
     * @param next 
     */
    getReceivedDonations = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.userId;

            const donations = await this.donationService.getReceivedDonations(userId);

            res.status(200).json({
                status: "success",
                data: donations,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: POST /donations/:id/apply
     * Candidata-se para receber uma doação
     * Headers: Authorization: Bearer TOKEN
     * Usuário manifesta interesse em receber a doação
     * Não pode se candidatar para própria doação ou doações não abertas
     * @param req 
     * @param res 
     * @param next 
     */
    applyForDonation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;
            const candidacy = await this.donationService.applyForDonation(id, userId);

            res.status(201).json({
                status: "success",
                message: "Candidatura realizada com sucesso",
                data: candidacy,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: GET /donations/:id/candidates
     * Lista todos os candidatos de uma doação
     * Headers: Authorization: Bearer TOKEN
     * IMPORTANTE: Apenas o doador pode ver esta lista
     * Protege a privacidade dos candidatos
     * @param req 
     * @param res 
     * @param next 
     */
    getDonationCandidates = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;
            const candidates = await this.donationService.getDonationCandidates(id, userId);

            res.status(200).json({
                status: "success",
                data: candidates,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: DELETE /donations/:id/candidacy
     * Retira a candidatura para uma doação
     * Headers: Authorization: Bearer TOKEN
     * Usuário desiste de receber a doação
     * Só funciona se a doação ainda está OPEN
     * @param req 
     * @param res 
     * @param next 
     */
    withdrawCandidacy = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;
            await this.donationService.withdrawCandidacy(id, userId);

            res.status(200).json({
                status: "success",
                message: "Candidatura retirada com sucesso",
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: GET /donations/my-candidacies
     * Lista todas as candidaturas do usuário autenticado
     * Headers: Authorization: Bearer TOKEN
     * Mostra para quais doações o usuário se candidatou
     * @param req 
     * @param res 
     * @param next 
     */
    getMyCandidacies = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user!.userId;

            const candidacies = await this.donationService.getMyCandidacies(userId);

            res.status(200).json({
                status: "success",
                data: candidacies,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: POST /donations/:id/choose-receiver
     * Doador escolhe quem vai receber a doação
     * Headers: Authorization: Bearer TOKEN
     * Body: { receiverId }
     * Mudanças que acontecem:
     *  - Status muda para IN_PROGRESS
     *  - Receptor é definido
     *  - Outras candidaturas são removidas
     *  - Registro de progresso é criado
     *  - Doação some da listagem pública
     * @param req 
     * @param res 
     * @param next 
     */
    chooseReceiver = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const { receiverId } = req.body;
            const donorId = req.user!.userId;
            const donation = await this.donationService.chooseReceiver(id, receiverId, donorId);

            res.status(200).json({
                status: "success",
                message: "Receptor escolhido com sucesso",
                data: donation,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: POST /donations/:id/cancel-receiving
     * Receptor cancela o recebimento
     * Headers: Authorization: Bearer TOKEN
     * Só funciona se status é IN_PROGRESS
     * Doação volta para OPEN e fica visível novamente
     * @param req 
     * @param res 
     * @param next 
     */
    cancelReceiving = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;

            await this.donationService.cancelReceiving(id, userId);

            res.status(200).json({
                status: "success",
                message: "Recebimento cancelado com sucesso",
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: PATCH /donations/:id/progress
     * Atualiza os checkboxes de progresso da doação
     * Headers: Authorization: Bearer TOKEN
     * Body: checkboxes que deseja marcar/desmarcar
     * Doador só marca checkboxes de doador
     * Receptor só marca checkboxes de receptor
     * @param req 
     * @param res 
     * @param next 
     */
    updateProgress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;
            const donation = await this.donationService.updateProgress(id, userId, req.body);

            res.status(200).json({
                status: "success",
                message: "Progresso atualizado com sucesso",
                data: donation,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: POST /donations/:id/signal-return
     * Receptor sinaliza que quer devolver a doação
     * Headers: Authorization: Bearer TOKEN
     * Body: { returnReason }
     * Só pode devolver se a retirada já foi confirmada
     * Motivo fica visível para doador e receptor
     * @param req 
     * @param res 
     * @param next 
     */
    signalReturn = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;
            const { returnReason } = req.body;
            await this.donationService.signalReturn(id, userId, returnReason);

            res.status(200).json({
                status: "success",
                message: "Devolução sinalizada com sucesso",
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: POST /donations/:id/confirm-return
     * Confirma a devolução (doador ou receptor)
     * Headers: Authorization: Bearer TOKEN
     * Quando AMBOS confirmam:
     *  - Status volta para OPEN
     *  - Receptor é removido
     *  - Progresso é deletado
     *  - Doação fica visível ao público novamente
     * @param req 
     * @param res 
     * @param next 
     */
    confirmReturn = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;
            const result = await this.donationService.confirmReturn(id, userId);

            res.status(200).json({
                status: "success",
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Rota esperada: GET /donations/:id/progress
     * Busca o estado atual do progresso de uma doação
     * Headers: Authorization: Bearer TOKEN
     * Apenas doador e receptor podem ver
     * Retorna resumo: o que foi confirmado, o que está pendente, etc
     * @param req 
     * @param res 
     * @param next 
     */
    getProgress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;
            const progress = await this.donationService.getProgress(id, userId);

            res.status(200).json({
                status: "success",
                data: progress,
            });
        } catch (error) {
            next(error);
        }
    };
}
