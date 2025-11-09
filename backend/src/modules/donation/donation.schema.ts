import { z } from "zod";

const donationCategoryEnum = z.enum([
    "FOOD",
    "APPLIANCES",
    "FURNITURE",
    "CLOTHING",
    "ELECTRONICS",
    "EQUIPMENT",
    "HOME",
], {
    message: "Categoria inválida",
});

const pickupTypeEnum = z.enum([
    "PICK_UP_AT_LOCATION",
    "ARRANGE_WITH_DONOR",
], {
    message: "Tipo de retirada inválido",
});

export const createDonationSchema = z.object({
    title: z.string()
        .min(5, "Título deve ter no mínimo 5 caracteres")
        .max(100, "Título deve ter no máximo 100 caracteres"),
    
    description: z.string()
        .min(10, "Descrição deve ter no mínimo 10 caracteres")
        .max(1000, "Descrição deve ter no máximo 1000 caracteres"),
    
    pickupType: pickupTypeEnum,
    
    category: donationCategoryEnum,
    
    postalCode: z.string()
        .regex(/^\d{5}-?\d{3}$/, "CEP inválido (formato: 12345-678 ou 12345678)"),
    
    street: z.string()
        .min(3, "Rua deve ter no mínimo 3 caracteres")
        .max(200, "Rua deve ter no máximo 200 caracteres"),
    
    locationNumber: z.string()
        .min(1, "Número é obrigatório")
        .max(20, "Número deve ter no máximo 20 caracteres"),
    
    neighborhood: z.string()
        .min(2, "Bairro deve ter no mínimo 2 caracteres")
        .max(100, "Bairro deve ter no máximo 100 caracteres"),
    
    city: z.string()
        .min(2, "Cidade deve ter no mínimo 2 caracteres")
        .max(100, "Cidade deve ter no máximo 100 caracteres"),
    
    state: z.string()
        .length(2, "Estado deve ter exatamente 2 caracteres (ex: SP, RJ)")
        .toUpperCase(),
});

export const updateDonationSchema = z.object({
    title: z.string()
        .min(5, "Título deve ter no mínimo 5 caracteres")
        .max(100, "Título deve ter no máximo 100 caracteres")
        .optional(),
    
    description: z.string()
        .min(10, "Descrição deve ter no mínimo 10 caracteres")
        .max(1000, "Descrição deve ter no máximo 1000 caracteres")
        .optional(),
    
    pickupType: pickupTypeEnum.optional(),
    
    category: donationCategoryEnum.optional(),
    
    postalCode: z.string()
        .regex(/^\d{5}-?\d{3}$/, "CEP inválido")
        .optional(),
    
    street: z.string()
        .min(3, "Rua deve ter no mínimo 3 caracteres")
        .max(200, "Rua deve ter no máximo 200 caracteres")
        .optional(),
    
    locationNumber: z.string()
        .min(1, "Número é obrigatório")
        .max(20, "Número deve ter no máximo 20 caracteres")
        .optional(),
    
    neighborhood: z.string()
        .min(2, "Bairro deve ter no mínimo 2 caracteres")
        .max(100, "Bairro deve ter no máximo 100 caracteres")
        .optional(),
    
    city: z.string()
        .min(2, "Cidade deve ter no mínimo 2 caracteres")
        .max(100, "Cidade deve ter no máximo 100 caracteres")
        .optional(),
    
    state: z.string()
        .length(2, "Estado deve ter exatamente 2 caracteres")
        .toUpperCase()
        .optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser fornecido para atualização",
});

export const donationFiltersSchema = z.object({
    status: z.enum(["OPEN", "IN_PROGRESS", "PICKED_UP", "COMPLETED"]).optional(),
    category: donationCategoryEnum.optional(),
    city: z.string().optional(),
    state: z.string().length(2).toUpperCase().optional(),
});

export const paginationSchema = z.object({
    page: z.coerce
        .number()
        .int()
        .positive,
    
    limit: z.coerce
        .number()
        .int()
        .positive()
        .max(100)
        .default(10),
});

export const donationIdSchema = z.object({
    id: z.string()
        .min(1, "ID da doação é obrigatório"),
});

export const signalReturnSchema = z.object({
    returnReason: z.string()
        .min(10, "Motivo da devolução deve ter no mínimo 10 caracteres")
        .max(500, "Motivo da devolução deve ter no máximo 500 caracteres"),
});

export const updateProgressSchema = z.object({
    pickupConfirmedByDonor: z.boolean().optional(),
    pickupConfirmedByReceiver: z.boolean().optional(),
    completionConfirmedByDonor: z.boolean().optional(),
    completionConfirmedByReceiver: z.boolean().optional(),
    returnConfirmedByDonor: z.boolean().optional(),
    returnConfirmedByReceiver: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser fornecido para atualização",
});

export const chooseReceiverSchema = z.object({
    receiverId: z.string()
        .length(24, 'ID do receptor inválido')
        .regex(/^[a-f\d]{24}$/i, 'ID deve ser um ObjectId válido do MongoDB'),
});

export const sequentialIdSchema = z.object({
    sequentialId: z.string()
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().int().positive('ID sequencial deve ser um número positivo')),
});

export const confirmActionSchema = z.object({
    confirm: z.literal(true, {
        message: 'Você deve confirmar esta ação',
    }),
});