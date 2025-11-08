import { z } from "zod";

// Schema para validar um ID MongoDB
// MongoDB usa ObjectIds que têm exatamente 24 caracteres hexadecimais
// Este schema garante que o ID recebido está no formato correto
export const mongoIdSchema = z.object({
    id: z.string()
        .length(24, "ID inválido")
        .regex(/^[a-f\d]{24}$/i, "ID deve ser um ObjectId válido do MongoDB"),
    });

    export const multipleIdsSchema = z.object({
    ids: z.array(
        z.string()
        .length(24, "ID inválido")
        .regex(/^[a-f\d]{24}$/i, "ID deve ser um ObjectId válido do MongoDB")
    ).min(1, "Pelo menos um ID deve ser fornecido"),
    });

    export const confirmationSchema = z.object({
    confirm: z.literal(true, {
        message: "A confirmação deve ser verdadeira",
    }),
});