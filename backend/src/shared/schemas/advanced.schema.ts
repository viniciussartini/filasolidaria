import { z } from "zod";

export const advancedSearchSchema = z.object({
    // Filtros de texto
    search: z.string()
        .min(3, "Busca deve ter no mínimo 3 caracteres")
        .optional(),
    
    // Filtros de localização
    city: z.string().optional(),
    state: z.string().length(2).toUpperCase().optional(),
    neighborhood: z.string().optional(),
    
    // Filtros de categoria e status
    category: z.enum([
        "FOOD",
        "APPLIANCES",
        "FURNITURE",
        "CLOTHING",
        "ELECTRONICS",
        "EQUIPMENT",
        "HOME",
    ]).optional(),
    
    status: z.enum([
        "OPEN",
        "IN_PROGRESS",
        "PICKED_UP",
        "COMPLETED",
    ]).optional(),
    
    // Filtro de tipo de retirada
    pickupType: z.enum([
        "PICK_UP_AT_LOCATION",
        "ARRANGE_WITH_DONOR",
    ]).optional(),
    
    // Filtros de data
    createdAfter: z.iso.datetime("Data inválida")
        .optional(),
    
    createdBefore: z.iso.datetime("Data inválida")
        .optional(),
    
    // Filtro por doador específico
    donorId: z.string()
        .length(24)
        .regex(/^[a-f\d]{24}$/i)
        .optional(),
    
    // Ordenação
    sortBy: z.enum([
        "createdAt",
        "title",
        "city",
        "category",
    ]).optional(),
    
    sortOrder: z.enum(["asc", "desc"])
        .optional()
        .default("desc"),
});

// Schema para reportar problema em uma doação
// Usuários podem reportar doações com problemas para moderação
export const reportDonationSchema = z.object({
    reason: z.enum([
        "INAPPROPRIATE_CONTENT",
        "FAKE_DONATION",
        "SPAM",
        "MISLEADING_INFO",
        "OTHER",
    ], {
        message: "Motivo de denúncia inválido",
    }),
    
    description: z.string()
        .min(10, "Descrição deve ter no mínimo 10 caracteres")
        .max(1000, "Descrição deve ter no máximo 1000 caracteres"),
    
    evidence: z.url("URL inválida")
        .optional(), // Link para evidência (screenshot, etc)
});

export const rateDonationSchema = z.object({
    rating: z.number()
        .int("Avaliação deve ser um número inteiro")
        .min(1, "Avaliação mínima é 1")
        .max(5, "Avaliação máxima é 5"),

    comment: z.string()
        .min(10, "Comentário deve ter no mínimo 10 caracteres")
        .max(500, "Comentário deve ter no máximo 500 caracteres")
        .optional(),

    aspects: z.object({
        communication: z.number().int().min(1).max(5).optional(),
        punctuality: z.number().int().min(1).max(5).optional(),
        itemCondition: z.number().int().min(1).max(5).optional(),
    }).optional(),
});

export const sendMessageSchema = z.object({
    message: z.string()
        .min(1, "Mensagem não pode estar vazia")
        .max(2000, "Mensagem deve ter no máximo 2000 caracteres")
        .trim(),
    
    // Tipo de mensagem
    type: z.enum(["TEXT", "SYSTEM"])
        .default("TEXT"),
    
    // Referência a mensagem anterior (para replies)
    replyTo: z.string()
        .length(24)
        .regex(/^[a-f\d]{24}$/i)
        .optional(),
});

export const notificationPreferencesSchema = z.object({
  // Notificações por email
    emailNotifications: z.object({
        newCandidacy: z.boolean().default(true),
        receiverChosen: z.boolean().default(true),
        donationUpdate: z.boolean().default(true),
        messageReceived: z.boolean().default(true),
        returnSignaled: z.boolean().default(true),
    }).optional(),
    
    // Notificações push (para mobile)
    pushNotifications: z.object({
        enabled: z.boolean().default(true),
        newCandidacy: z.boolean().default(true),
        receiverChosen: z.boolean().default(true),
        donationUpdate: z.boolean().default(true),
        messageReceived: z.boolean().default(true),
    }).optional(),
});

export const editHistoryFiltersSchema = z.object({
    startDate: z.iso.datetime("Data inicial inválida")
        .optional(),
    
    endDate: z.iso.datetime("Data final inválida")
        .optional(),
    
    fieldName: z.string()
        .optional(), // Filtrar por campo específico que foi editado
});

// Schema para estatísticas de usuário com filtros
// Permite ver estatísticas em períodos específicos
export const userStatsFiltersSchema = z.object({
    startDate: z.iso.datetime("Data inicial inválida")
        .optional(),
    
    endDate: z.iso.datetime("Data final inválida")
        .optional(),
    
    groupBy: z.enum([
        "day",
        "week",
        "month",
        "year",
    ]).optional(),
});

export const exportUserDataSchema = z.object({
    format: z.enum(["JSON", "CSV", "PDF"])
        .default("JSON"),
    
    includeDeletedData: z.boolean()
        .default(false),
    
    sections: z.array(z.enum([
        "profile",
        "donations",
        "candidacies",
        "messages",
        "history",
    ])).optional(), // Se não especificado, exporta tudo
});

export const privacySettingsSchema = z.object({
  // Perfil público
    showFullName: z.boolean().default(true),
    showAge: z.boolean().default(true),
    showCity: z.boolean().default(true),
    showState: z.boolean().default(true),
    showBiography: z.boolean().default(true),
    showSocialNetworks: z.boolean().default(true),
    
    // Estatísticas públicas
    showDonationStats: z.boolean().default(true),
    showReceivedStats: z.boolean().default(true),
    
    // Visibilidade em listagens
    appearInSearch: z.boolean().default(true),
    showLastActive: z.boolean().default(false),
});

export const verifyEmailSchema = z.object({
    verificationCode: z.string()
        .length(6, "Código deve ter 6 dígitos")
        .regex(/^\d{6}$/, "Código deve conter apenas números"),
});

export const changeEmailSchema = z.object({
    currentPassword: z.string()
        .min(1, "Senha atual é obrigatória"),
    
    newEmail: z.email("Novo email inválido")
        .toLowerCase(),
    
    confirmNewEmail: z.email("Confirmação de email inválida")
        .toLowerCase(),
    }).refine((data) => data.newEmail === data.confirmNewEmail, {
        message: "Os emails não coincidem",
        path: ["confirmNewEmail"],
});

export const blockUserSchema = z.object({
    reason: z.enum([
        "SPAM",
        "INAPPROPRIATE_BEHAVIOR",
        "FAKE_DONATIONS",
        "SCAM",
        "HARASSMENT",
        "OTHER",
    ]),
    
    description: z.string()
        .min(10, "Descrição deve ter no mínimo 10 caracteres")
        .max(500, "Descrição deve ter no máximo 500 caracteres"),
    
    duration: z.enum([
        "TEMPORARY", // Bloqueio temporário
        "PERMANENT", // Bloqueio permanente
    ]).default("TEMPORARY"),
    
    // Se temporário, até quando?
    until: z.iso.datetime("Data inválida")
        .optional(),
});

export const validatePostalCodeSchema = z.object({
    postalCode: z.string()
        .regex(/^\d{5}-?\d{3}$/, "CEP inválido (formato: 12345-678 ou 12345678)")
        .transform((val) => val.replace(/\D/g, "")), // Remove hífens
});

export const searchAddressSchema = z.object({
    postalCode: z.string()
        .regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
});