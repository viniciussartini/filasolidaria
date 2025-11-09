import { DonationRepository } from "../../modules/donation/donation.repository.js";
import { CandidacyRepository } from "../../modules/candidacy/candidacy.repository.js";
import { DonationProgressRepository } from "../../modules/donation/donation-progress.repository.js";
import { UserRepository } from "../../modules/user/user.repository.js";
import { 
    CreateDonationData, 
    UpdateDonationData, 
    DonationFilters 
} from "../../types/index.js";
import { getObjectDifferences } from "../../utils/helpers.js";
import { 
    NotFoundError, 
    ForbiddenError, 
    ValidationError 
} from "../../shared/errors/AppError.js";

export class DonationService {
    private donationRepository: DonationRepository;
    private candidacyRepository: CandidacyRepository;
    private progressRepository: DonationProgressRepository;
    private userRepository: UserRepository;

    constructor() {
        this.donationRepository = new DonationRepository();
        this.candidacyRepository = new CandidacyRepository();
        this.progressRepository = new DonationProgressRepository();
        this.userRepository = new UserRepository();
    }

    /**
     * Cria uma nova doação
     * O processo é simples mas envolve validações importantes
     * A doação é criada automaticamente com status OPEN e fica
     * visível para todos os usuários que podem se candidatar
     * @param donorId 
     * @param data 
     * @returns 
     */
    async createDonation(donorId: string, data: CreateDonationData) {
        const userExists = await this.userRepository.findById(donorId);
        
        if (!userExists) {
            throw new NotFoundError("Usuário não encontrado");
        }

        const donation = await this.donationRepository.create(donorId, data);

        return donation;
    }

    /**
     * Lista doações com filtros e paginação
     * Permite buscar doações abertas, por categoria, cidade, estado, etc.
     * A paginação é importante porque podem haver milhares de doações
     * e não queremos sobrecarregar a API ou o front-end
     * @param filters 
     * @param page 
     * @param limit 
     * @returns 
     */
    async listDonations(filters: DonationFilters, page: number = 1, limit: number = 10) {
        return this.donationRepository.findMany(filters, page, limit);
    }

    /**
     * Busca uma doação específica pelo ID
     * Retorna todos os detalhes da doação incluindo informações do doador
     * Se houver um receptor escolhido, também retorna dados dele
     * Inclui também o progresso da doação (checkboxes) se existir
     * @param donationId 
     * @returns 
     */
    async getDonation(donationId: string) {
        const donation = await this.donationRepository.findById(donationId);

        if (!donation) {
            throw new NotFoundError("Doação não encontrada");
        }

        if (donation.receiverId) {
            const progress = await this.progressRepository.findByDonation(donationId);
            return {
                ...donation,
                progress,
            };
        }

        return donation;
    }

    /**
     * Atualiza os dados de uma doação
     * IMPORTANTE: Só permite editar doações que estão com status OPEN
     * Uma vez que alguém é escolhido como receptor, os dados não podem mais mudar
     * Isso evita que o doador mude o endereço depois que alguém já aceitou
     * O histórico de edições é mantido para transparência
     * @param donationId 
     * @param userId 
     * @param data 
     * @returns 
     */
    async updateDonation(donationId: string, userId: string, data: UpdateDonationData) {
        const donation = await this.donationRepository.findById(donationId);

        if (!donation) {
            throw new NotFoundError("Doação não encontrada");
        }

        if (donation.donorId !== userId) {
            throw new ForbiddenError("Você não tem permissão para editar esta doação");
        }

        if (donation.status !== "OPEN") {
            throw new ValidationError(
                "Apenas doações abertas podem ser editadas. Esta doação já tem um receptor ou foi concluída."
            );
        }

        const changedFields = getObjectDifferences(donation, data);

        if (Object.keys(changedFields).length === 0) {
            return donation;
        }

        const updatedDonation = await this.donationRepository.update(donationId, data);

        await this.donationRepository.saveDonationEditHistory(donationId, changedFields);

        return updatedDonation;
    }

    /**
     * Exclui uma doação permanentemente
     * Assim como na edição, só permite excluir doações abertas
     * Se a doação já tem um receptor, não pode ser excluída
     * Isso protege os receptores que já se candidataram ou foram escolhidos
     * @param donationId 
     * @param userId 
     */
    async deleteDonation(donationId: string, userId: string) {
        const donation = await this.donationRepository.findById(donationId);

        if (!donation) {
            throw new NotFoundError("Doação não encontrada");
        }

        if (donation.donorId !== userId) {
            throw new ForbiddenError("Você não tem permissão para excluir esta doação");
        }

        if (donation.status !== "OPEN") {
            throw new ValidationError(
                "Apenas doações abertas podem ser excluídas. Esta doação já tem um receptor ou foi concluída."
            );
        }

        await this.donationRepository.delete(donationId);
    }

    /**
     * Busca o histórico completo de edições de uma doação
     * Este histórico é público - qualquer pessoa pode ver
     * Isso traz transparência: candidatos podem ver se a doação
     * mudou depois que eles se candidataram, por exemplo
     * @param donationId 
     * @returns 
     */
    async getDonationEditHistory(donationId: string) {
        const donation = await this.donationRepository.findById(donationId);

        if (!donation) {
            throw new NotFoundError("Doação não encontrada");
        }

        return this.donationRepository.getDonationEditHistory(donationId);
    }

    /**
     * Lista todas as doações criadas por um usuário
     * Útil para a página "Minhas Doações" onde o usuário
     * vê todas as doações que ele criou, independente do status
     * @param userId 
     * @returns 
     */
    async getMyDonations(userId: string) {
        return this.donationRepository.findByDonor(userId);
    }

    /**
     * Lista todas as doações que o usuário está recebendo ou recebeu
     * Mostra doações onde o usuário foi escolhido como receptor
     * Inclui doações em andamento, retiradas e concluídas
     * @param userId 
     * @returns 
     */
    async getReceivedDonations(userId: string) {
        return this.donationRepository.findByReceiver(userId);
    }

    /**
     * Permite que um usuário se candidate para receber uma doação
     * Este é o primeiro passo do fluxo: o usuário vê uma doação que
     * lhe interessa e manifesta interesse em recebê-la
     * Várias validações são feitas para garantir que a candidatura é válida
     * @param donationId 
     * @param userId 
     * @returns 
     */
    async applyForDonation(donationId: string, userId: string) {
        const donation = await this.donationRepository.findById(donationId);

        if (!donation) {
            throw new NotFoundError("Doação não encontrada");
        }

        if (donation.donorId === userId) {
            throw new ValidationError("Você não pode se candidatar para sua própria doação");
        }

        if (donation.status !== "OPEN") {
            throw new ValidationError(
                "Esta doação não está mais disponível para candidaturas"
            );
        }

        const existingCandidacy = await this.candidacyRepository.findByDonationAndUser( donationId, userId);

        if (existingCandidacy) {
            throw new ValidationError("Você já se candidatou para esta doação");
        }

        const candidacy = await this.candidacyRepository.create(donationId, userId);

        return candidacy;
    }

    /**
     * Lista todos os candidatos de uma doação específica
     * IMPORTANTE: Apenas o doador pode ver esta lista
     * Outros usuários não devem saber quem mais se candidatou
     * Isso protege a privacidade dos candidatos
     * @param donationId 
     * @param requestingUserId 
     * @returns 
     */
    async getDonationCandidates(donationId: string, requestingUserId: string) {
        const donation = await this.donationRepository.findById(donationId);

        if (!donation) {
            throw new NotFoundError("Doação não encontrada");
        }

        if (donation.donorId !== requestingUserId) {
            throw new ForbiddenError(
                "Apenas o doador pode visualizar a lista de candidatos"
            );
        }

        return this.candidacyRepository.findByDonation(donationId);
    }

    /**
     * Permite que o usuário retire sua candidatura
     * Isso pode acontecer quando o usuário muda de ideia ou
     * já recebeu outra doação similar
     * REGRA: Só pode retirar candidatura se a doação estiver OPEN
     * Se já foi escolhido como receptor (IN_PROGRESS), usa outro método
     * @param donationId 
     * @param userId 
     * @returns 
     */
    async withdrawCandidacy(donationId: string, userId: string) {
        const donation = await this.donationRepository.findById(donationId);

        if (!donation) {
            throw new NotFoundError("Doação não encontrada");
        }

        const candidacy = await this.candidacyRepository.findByDonationAndUser(donationId, userId);

        if (!candidacy) {
            throw new NotFoundError("Você não está candidato para esta doação");
        }

        if (donation.status === "OPEN") {
            await this.candidacyRepository.delete(candidacy.id);
            return { message: "Candidatura retirada com sucesso" };
        }

        if (donation.status === "IN_PROGRESS" && donation.receiverId === userId) {
            throw new ValidationError(
                "Use o método de cancelamento de recebimento para desistir desta doação"
            );
        }

        throw new ValidationError("Esta doação já não está mais aceitando candidaturas");
    }

    /**
     * Lista todas as candidaturas ativas de um usuário
     * Mostra para quais doações o usuário se candidatou
     * Útil para a página "Minhas Candidaturas"
     * @param userId 
     * @returns 
     */
    async getMyCandidacies(userId: string) {
        return this.candidacyRepository.findByUser(userId);
    }

    /**
     * O doador escolhe quem vai receber a doação
     * Este é um momento crítico no fluxo porque aqui acontecem várias coisas:
     *  1. A doação muda de OPEN para IN_PROGRESS
     *  2. O receptor escolhido é definido
     *  3. Todas as outras candidaturas são removidas
     *  4. Um registro de progresso é criado para rastrear os checkboxes
     *  5. A doação some da listagem pública (só doador e receptor veem)
     * @param donationId 
     * @param receiverId 
     * @param donorId 
     * @returns 
     */
    async chooseReceiver(donationId: string, receiverId: string, donorId: string) {
        const donation = await this.donationRepository.findById(donationId);

        if (!donation) {
            throw new NotFoundError("Doação não encontrada");
        }

        if (donation.donorId !== donorId) {
            throw new ForbiddenError("Apenas o doador pode escolher o receptor");
        }

        if (donation.status !== "OPEN") {
            throw new ValidationError("Esta doação já tem um receptor escolhido");
        }

        const candidacy = await this.candidacyRepository.findByDonationAndUser(donationId, receiverId);

        if (!candidacy) {
            throw new ValidationError(
                "Este usuário não se candidatou para receber esta doação"
            );
        }

        const updatedDonation = await this.donationRepository.setReceiver(donationId, receiverId);
        await this.progressRepository.create(donationId);
        await this.candidacyRepository.deleteAllByDonation(donationId);

        return updatedDonation;
    }

    /**
     * Permite que o receptor cancele o recebimento
     * Isso pode acontecer quando o receptor não consegue mais
     * buscar a doação ou mudou de ideia
     * REGRA: Só pode cancelar se o status for IN_PROGRESS
     * Se já confirmou a retirada (PICKED_UP), precisa seguir o fluxo de devolução
     * @param donationId 
     * @param userId 
     * @returns 
     */
    async cancelReceiving(donationId: string, userId: string) {
        const donation = await this.donationRepository.findById(donationId);

        if (!donation) {
            throw new NotFoundError("Doação não encontrada");
        }

        if (donation.receiverId !== userId) {
            throw new ForbiddenError(
                "Apenas o receptor pode cancelar o recebimento"
            );
        }

        if (donation.status !== "IN_PROGRESS") {
            throw new ValidationError(
                "Não é possível cancelar neste estágio. Use o processo de devolução se necessário."
            );
        }

        await this.donationRepository.removeReceiver(donationId);
        await this.progressRepository.delete(donationId);

        return { message: "Recebimento cancelado. A doação voltou a estar disponível." };
    }

    /**
     * Atualiza os checkboxes de progresso da doação
     * Este método é o coração do fluxo de acompanhamento
     * Dependendo de quais checkboxes são marcados, o status da doação muda
     * e novas opções ficam disponíveis para os usuários
     * @param donationId 
     * @param userId 
     * @param updates 
     * @returns 
     */
    async updateProgress(
        donationId: string,
        userId: string,
        updates: {
        pickupConfirmedByDonor?: boolean;
        pickupConfirmedByReceiver?: boolean;
        completionConfirmedByDonor?: boolean;
        completionConfirmedByReceiver?: boolean;
        returnConfirmedByDonor?: boolean;
        returnConfirmedByReceiver?: boolean;
        }
    ) {
        const donation = await this.donationRepository.findById(donationId);

        if (!donation) {
            throw new NotFoundError("Doação não encontrada");
        }

        if (!donation.receiverId) {
            throw new ValidationError("Esta doação ainda não tem um receptor escolhido");
        }

        const progress = await this.progressRepository.findByDonation(donationId);

        if (!progress) {
            throw new ValidationError("Registro de progresso não encontrado");
        }

        const isDonor = donation.donorId === userId;
        const isReceiver = donation.receiverId === userId;

        if (!isDonor && !isReceiver) {
            throw new ForbiddenError(
                "Você não tem permissão para atualizar esta doação"
            );
        }

        if (isDonor) {
            if (
                updates.pickupConfirmedByReceiver !== undefined ||
                updates.completionConfirmedByReceiver !== undefined ||
                updates.returnConfirmedByReceiver !== undefined
            ) {
                throw new ForbiddenError("Você só pode marcar confirmações do doador");
            }
        }

        if (isReceiver) {
            if (
                updates.pickupConfirmedByDonor !== undefined ||
                updates.completionConfirmedByDonor !== undefined ||
                updates.returnConfirmedByDonor !== undefined
            ) {
                throw new ForbiddenError("Você só pode marcar confirmações do receptor");
            }
        }

        const pickupConfirmed = 
        (updates.pickupConfirmedByDonor ?? progress.pickupConfirmedByDonor) &&
        (updates.pickupConfirmedByReceiver ?? progress.pickupConfirmedByReceiver);

        if (
            (updates.completionConfirmedByDonor || updates.completionConfirmedByReceiver) &&
            !pickupConfirmed
        ) {
            throw new ValidationError("A conclusão só pode ser confirmada após ambos confirmarem a retirada");
        }

        if (updates.returnConfirmedByReceiver && !pickupConfirmed) {
            throw new ValidationError("Só é possível sinalizar devolução após a retirada ser confirmada");
        }

        const updatedProgress = await this.progressRepository.update(
            donationId,
            updates
        );

        if (
            updatedProgress.pickupConfirmedByDonor &&
            updatedProgress.pickupConfirmedByReceiver &&
            donation.status === "IN_PROGRESS"
        ) {
            await this.donationRepository.updateStatus(donationId, "PICKED_UP");
        }

        if (
            updatedProgress.completionConfirmedByDonor &&
            updatedProgress.completionConfirmedByReceiver &&
            donation.status !== "COMPLETED"
        ) {
            await this.donationRepository.updateStatus(donationId, "COMPLETED");
        }

        return this.getDonation(donationId);
    }

    /**
     * Receptor sinaliza que quer devolver a doação
     * Quando isso acontece, uma caixa de texto aparece para explicar o motivo
     * O motivo fica visível tanto para doador quanto para receptor
     * @param donationId 
     * @param userId 
     * @param reason 
     * @returns 
     */
    async signalReturn(donationId: string, userId: string, reason: string) {
        const donation = await this.donationRepository.findById(donationId);

        if (!donation) {
            throw new NotFoundError("Doação não encontrada");
        }

        if (donation.receiverId !== userId) {
            throw new ForbiddenError("Apenas o receptor pode sinalizar devolução");
        }

        const progress = await this.progressRepository.findByDonation(donationId);

        if (!progress) {
            throw new ValidationError("Registro de progresso não encontrado");
        }

        const canReturn = await this.progressRepository.canSignalReturn(donationId);

        if (!canReturn) {
            throw new ValidationError(
                "Só é possível devolver após a retirada ser confirmada por ambos"
            );
        }

        await this.progressRepository.update(donationId, {returnSignaledByReceiver: true,});
        await this.donationRepository.updateReturnReason(donationId, reason);

        return { message: "Devolução sinalizada. Aguarde confirmação do doador." };
    }

    /**
     * Confirma o processo completo de devolução
     * Quando AMBOS (doador E receptor) confirmam a devolução:
     *  1. Status volta para OPEN
     *  2. Doação fica visível ao público novamente
     *  3. Todo o fluxo entre doador e receptor é apagado
     *  4. Novas pessoas podem se candidatar
     * @param donationId 
     * @param userId 
     * @returns 
     */
    async confirmReturn(donationId: string, userId: string) {
        const donation = await this.donationRepository.findById(donationId);

        if (!donation) {
            throw new NotFoundError("Doação não encontrada");
        }

        const isDonor = donation.donorId === userId;
        const isReceiver = donation.receiverId === userId;

        if (!isDonor && !isReceiver) {
            throw new ForbiddenError(
                "Apenas doador ou receptor podem confirmar a devolução"
            );
        }

        const progress = await this.progressRepository.findByDonation(donationId);

        if (!progress) {
            throw new ValidationError("Registro de progresso não encontrado");
        }

        if (!progress.returnSignaledByReceiver) {
            throw new ValidationError(
                "A devolução precisa ser sinalizada primeiro pelo receptor"
            );
        }

        if (isDonor) {
            await this.progressRepository.update(donationId, {returnConfirmedByDonor: true,});
        } else {
            await this.progressRepository.update(donationId, {returnConfirmedByReceiver: true,});
        }

        const isReturnCompleted = await this.progressRepository.isReturnCompleted(donationId);

        if (isReturnCompleted) {
            await this.donationRepository.removeReceiver(donationId);
            await this.progressRepository.delete(donationId);

            return {
                message: "Devolução confirmada. A doação voltou a estar disponível para candidaturas.",
            };
        }

        return {
            message: "Sua confirmação foi registrada. Aguardando confirmação da outra parte.",
        };
    }

    /**
     * Busca o estado atual do progresso de uma doação
     * Retorna um resumo fácil de entender para o front-end
     * sobre o estado atual: o que foi confirmado, o que está pendente, etc.
     * @param donationId 
     * @param userId 
     * @returns 
     */
    async getProgress(donationId: string, userId: string) {
        const donation = await this.donationRepository.findById(donationId);

        if (!donation) {
            throw new NotFoundError("Doação não encontrada");
        }

        const isDonor = donation.donorId === userId;
        const isReceiver = donation.receiverId === userId;

        if (!isDonor && !isReceiver) {
            throw new ForbiddenError(
                "Apenas doador e receptor podem visualizar o progresso"
            );
        }

        const summary = await this.progressRepository.getProgressSummary(donationId);

        return {donation, ...summary,};
    }
}
