import { prisma } from "../../config/database.js";
import { DonationProgress } from "@prisma/client";

export class DonationProgressRepository {
    /**
     * Cria um novo registro de progresso para uma doação
     * Isso acontece automaticamente quando um receptor é escolhido
     * Inicialmente, todos os checkboxes estão desmarcados (false)
     * @param donationId 
     * @returns 
     */
    async create(donationId: string): Promise<DonationProgress> {
        return prisma.donationProgress.create({
            data: {
                donationId,
            },
        });
    }

    /**
     * Busca o progresso de uma doação específica
     * Retorna null se ainda não houver progresso criado
     * (o que significa que nenhum receptor foi escolhido ainda)
     * @param donationId 
     * @returns 
     */
    async findByDonation(donationId: string): Promise<DonationProgress | null> {
        return prisma.donationProgress.findUnique({
            where: { donationId },
        });
    }

    /**
     * Atualiza campos específicos do progresso
     * Recebe um objeto com apenas os campos que devem ser atualizados
     * Por exemplo: { pickupConfirmedByDonor: true }
     * Isso permite marcar/desmarcar checkboxes individuais
     * @param donationId 
     * @param data 
     * @returns 
     */
    async update(donationId: string, data: Partial<Omit<DonationProgress, "id" | "donationId">>): Promise<DonationProgress> {
        return prisma.donationProgress.update({
            where: { donationId },
            data,
        });
    }

    /**
     * Deleta o registro de progresso de uma doação
     * Usado quando a doação volta para o status OPEN
     * (por exemplo, quando há uma devolução)
     * Isso reseta todo o fluxo de confirmações
     * @param donationId 
     */
    async delete(donationId: string): Promise<void> {
        await prisma.donationProgress.delete({
            where: { donationId },
        });
    }

    /**
     * Verifica se a retirada foi confirmada por ambos
     * Útil para determinar se podemos mudar o status da doação para PICKED_UP 
     * @param donationId 
     * @returns 
     */
    async isPickupConfirmed(donationId: string): Promise<boolean> {
        const progress = await this.findByDonation(donationId);
        
        if (!progress) {
            return false;
        }

        return progress.pickupConfirmedByDonor && progress.pickupConfirmedByReceiver;
    }

    /**
     * Verifica se a conclusão foi confirmada por ambos
     * Quando ambos confirmam, a doação pode ser marcada como COMPLETED
     * @param donationId 
     * @returns 
     */
    async isCompletionConfirmed(donationId: string): Promise<boolean> {
        const progress = await this.findByDonation(donationId);
        
        if (!progress) {
            return false;
        }

        return progress.completionConfirmedByDonor && progress.completionConfirmedByReceiver;
    }

    /**
     * Verifica se a devolução foi completamente processada
     * A devolução requer três passos:
     *  1. Receptor sinaliza a devolução
     *  2. Doador confirma que recebeu de volta
     *  3. Receptor confirma que devolveu
     * @param donationId 
     * @returns 
     */
    async isReturnCompleted(donationId: string): Promise<boolean> {
        const progress = await this.findByDonation(donationId);
        
        if (!progress) {
            return false;
        }

        return (
            progress.returnSignaledByReceiver &&
            progress.returnConfirmedByDonor &&
            progress.returnConfirmedByReceiver
        );
    }

    /**
     * Reseta todos os campos de devolução
     * Usado se o processo de devolução precisa ser cancelado
     * @param donationId 
     * @returns 
     */
    async resetReturnProcess(donationId: string): Promise<DonationProgress> {
        return this.update(donationId, {
            returnSignaledByReceiver: false,
            returnConfirmedByDonor: false,
            returnConfirmedByReceiver: false,
        });
    }

    /**
     * Reseta completamente todos os checkboxes
     * Volta tudo para o estado inicial (todos false)
     * Usado quando a doação volta para OPEN após uma devolução completa
     * @param donationId 
     * @returns 
     */
    async resetAll(donationId: string): Promise<DonationProgress> {
        return this.update(donationId, {
            pickupConfirmedByDonor: false,
            pickupConfirmedByReceiver: false,
            completionConfirmedByDonor: false,
            completionConfirmedByReceiver: false,
            returnSignaledByReceiver: false,
            returnConfirmedByDonor: false,
            returnConfirmedByReceiver: false,
        });
    }

    /**
     * Verifica se o receptor pode sinalizar devolução
     * Só pode devolver se a retirada já foi confirmada por ambos
     * (ou seja, a pessoa já está com o item)
     * @param donationId 
     * @returns 
     */
    async canSignalReturn(donationId: string): Promise<boolean> {
        const progress = await this.findByDonation(donationId);
        
        if (!progress) {
            return false;
        }

        return progress.pickupConfirmedByDonor && progress.pickupConfirmedByReceiver;
    }

    /**
     * Verifica se os checkboxes de conclusão devem estar habilitados
     * Só podem confirmar conclusão se a retirada já foi confirmada
     * @param donationId 
     * @returns 
     */
    async canConfirmCompletion(donationId: string): Promise<boolean> {
        const progress = await this.findByDonation(donationId);
        
        if (!progress) {
            return false;
        }

        return progress.pickupConfirmedByDonor && progress.pickupConfirmedByReceiver;
    }

    /**
     * Retorna um resumo do estado atual do progresso
     * Útil para o front-end decidir quais checkboxes mostrar e habilitar
     * @param donationId 
     * @returns 
     */
    async getProgressSummary(donationId: string) {
        const progress = await this.findByDonation(donationId);
        
        if (!progress) {
            return {
                hasProgress: false,
                pickupConfirmed: false,
                completionConfirmed: false,
                returnInProgress: false,
                returnCompleted: false,
            };
        }

        const pickupConfirmed = progress.pickupConfirmedByDonor && progress.pickupConfirmedByReceiver;
        const completionConfirmed = progress.completionConfirmedByDonor && progress.completionConfirmedByReceiver;
        const returnInProgress = progress.returnSignaledByReceiver;
        const returnCompleted = progress.returnSignaledByReceiver && 
                            progress.returnConfirmedByDonor && 
                            progress.returnConfirmedByReceiver;

        return {
            hasProgress: true,
            pickupConfirmed,
            completionConfirmed,
            returnInProgress,
            returnCompleted,
            progress, // Inclui o objeto completo para detalhes
        };
    }
}