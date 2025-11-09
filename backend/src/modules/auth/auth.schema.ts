import { z } from "zod";

export const registerSchema = z.object({
    name: z.string()
        .min(2, "Nome deve ter no mínimo 2 caracteres")
        .max(100, "Nome deve ter no máximo 100 caracteres"),
    
    email: z.email("Email inválido")
        .toLowerCase(), // Converte para minúsculo automaticamente
    
    password: z.string()
        .min(6, "Senha deve ter no mínimo 6 caracteres")
        .max(50, "Senha deve ter no máximo 50 caracteres"),
    
    confirmPassword: z.string(),
    
    age: z.number()
        .int("Idade deve ser um número inteiro")
        .min(13, "Você deve ter no mínimo 13 anos")
        .max(120, "Idade inválida"),
    
    postalCode: z.string()
        .regex(/^\d{5}-?\d{3}$/, "CEP inválido (formato: 12345-678 ou 12345678)"),
    
    city: z.string()
        .min(2, "Cidade deve ter no mínimo 2 caracteres")
        .max(100, "Cidade deve ter no máximo 100 caracteres"),
    
    state: z.string()
        .length(2, "Estado deve ter exatamente 2 caracteres (ex: SP, RJ)")
        .toUpperCase(), // Converte para maiúsculo automaticamente
    
    street: z.string()
        .min(3, "Rua deve ter no mínimo 3 caracteres")
        .max(200, "Rua deve ter no máximo 200 caracteres"),
    
    houseNumber: z.string()
        .min(1, "Número é obrigatório")
        .max(20, "Número deve ter no máximo 20 caracteres"),
    
    neighborhood: z.string()
        .min(2, "Bairro deve ter no mínimo 2 caracteres")
        .max(100, "Bairro deve ter no máximo 100 caracteres"),
    
    biography: z.string()
        .max(500, "Biografia deve ter no máximo 500 caracteres")
        .optional(),
    
    phone: z.string()
        .regex(/^\(?[1-9]{2}\)? ?(?:[2-8]|9[0-9])[0-9]{3}-?[0-9]{4}$/, 
        "Telefone inválido (formato: (11) 98765-4321 ou 11987654321)"),
    
    contactEmail: z.email("Email de contato inválido")
        .toLowerCase(),
    
    contactPhone: z.string()
        .regex(/^\(?[1-9]{2}\)? ?(?:[2-8]|9[0-9])[0-9]{3}-?[0-9]{4}$/, 
        "Telefone de contato inválido"),
    
    socialNetworks: z.string()
        .max(500, "Redes sociais deve ter no máximo 500 caracteres")
        .optional(),
    }).refine((data) => data.password === data.confirmPassword, {
        message: "As senhas não coincidem",
        path: ["confirmPassword"], // Indica em qual campo mostrar o erro
    });

    export const loginSchema = z.object({
        email: z.email("Email inválido")
            .toLowerCase(),
        
        password: z.string()
            .min(1, "Senha é obrigatória"),
    });

    export const forgotPasswordSchema = z.object({
    email: z.email("Email inválido")
        .toLowerCase(),
    });

    export const resetPasswordSchema = z.object({
    token: z.string()
        .min(1, "Token é obrigatório"),
    
    newPassword: z.string()
        .min(6, "Senha deve ter no mínimo 6 caracteres")
        .max(50, "Senha deve ter no máximo 50 caracteres"),
    
    confirmPassword: z.string(),
    }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
    });

    export const updateProfileSchema = z.object({
    name: z.string()
        .min(2, "Nome deve ter no mínimo 2 caracteres")
        .max(100, "Nome deve ter no máximo 100 caracteres")
        .optional(),
    
    age: z.number()
        .int("Idade deve ser um número inteiro")
        .min(13, "Você deve ter no mínimo 13 anos")
        .max(120, "Idade inválida")
        .optional(),
    
    postalCode: z.string()
        .regex(/^\d{5}-?\d{3}$/, "CEP inválido")
        .optional(),
    
    city: z.string()
        .min(2, "Cidade deve ter no mínimo 2 caracteres")
        .max(100, "Cidade deve ter no máximo 100 caracteres")
        .optional(),
    
    state: z.string()
        .length(2, "Estado deve ter exatamente 2 caracteres")
        .toUpperCase()
        .optional(),
    
    street: z.string()
        .min(3, "Rua deve ter no mínimo 3 caracteres")
        .max(200, "Rua deve ter no máximo 200 caracteres")
        .optional(),
    
    houseNumber: z.string()
        .min(1, "Número é obrigatório")
        .max(20, "Número deve ter no máximo 20 caracteres")
        .optional(),
    
    neighborhood: z.string()
        .min(2, "Bairro deve ter no mínimo 2 caracteres")
        .max(100, "Bairro deve ter no máximo 100 caracteres")
        .optional(),
    
    biography: z.string()
        .max(500, "Biografia deve ter no máximo 500 caracteres")
        .optional(),
    
    phone: z.string()
        .regex(/^\(?[1-9]{2}\)? ?(?:[2-8]|9[0-9])[0-9]{3}-?[0-9]{4}$/, 
        "Telefone inválido")
        .optional(),
    
    contactEmail: z.email("Email de contato inválido")
        .toLowerCase()
        .optional(),
    
    contactPhone: z.string()
        .regex(/^\(?[1-9]{2}\)? ?(?:[2-8]|9[0-9])[0-9]{3}-?[0-9]{4}$/, 
        "Telefone de contato inválido")
        .optional(),
    
    socialNetworks: z.string()
        .max(500, "Redes sociais deve ter no máximo 500 caracteres")
        .optional(),
    }).refine((data) => Object.keys(data).length > 0, {
        message: "Pelo menos um campo deve ser fornecido para atualização",
});

export const updatePasswordSchema = z.object({
    currentPassword: z.string()
    .min(1, "Senha atual é obrigatória"),

    newPassword: z.string()
    .min(6, "Nova senha deve ter no mínimo 6 caracteres")
    .max(50, "Nova senha deve ter no máximo 50 caracteres"),

    confirmPassword: z.string(),
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "As senhas não coincidem",
        path: ["confirmPassword"],
    }).refine((data) => data.currentPassword !== data.newPassword, {
        message: "A nova senha deve ser diferente da senha atual",
        path: ["newPassword"],
});