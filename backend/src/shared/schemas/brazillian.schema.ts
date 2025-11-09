import { z } from "zod";

export const cpfSchema = z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 
    "CPF inválido (formato: 123.456.789-10 ou 12345678910)")
    .transform((val) => val.replace(/\D/g, ""))
    .refine((cpf) => {

        if (cpf.length !== 11) {
            return false;
        
        } 
        const invalidCPFs = [
            "00000000000",
            "11111111111",
            "22222222222",
            "33333333333",
            "44444444444",
            "55555555555",
            "66666666666",
            "77777777777",
            "88888888888",
            "99999999999",
        ];
        
        if (invalidCPFs.includes(cpf)) {
            return false;
        }

        let sum = 0;
        for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
        }

        let digit = 11 - (sum % 11);

        if (digit >= 10) {
            digit = 0;
        }

        if (digit !== parseInt(cpf.charAt(9))) {
            return false;
        }

        sum = 0;
        for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
        }

        digit = 11 - (sum % 11);

        if (digit >= 10) {
            digit = 0;
        }

        if (digit !== parseInt(cpf.charAt(10))) {
            return false;
        }
        
        return true;
}, "CPF inválido");

export const cnpjSchema = z.string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, 
    "CNPJ inválido (formato: 12.345.678/0001-90 ou 12345678000190)")
    .transform((val) => val.replace(/\D/g, ""))
    .refine((cnpj) => {
        if (cnpj.length !== 14) {
            return false;
        }
        
        const invalidCNPJs = [
            "00000000000000",
            "11111111111111",
            "22222222222222",
            "33333333333333",
            "44444444444444",
            "55555555555555",
            "66666666666666",
            "77777777777777",
            "88888888888888",
            "99999999999999",
        ];
        
        if (invalidCNPJs.includes(cnpj)) {
            return false;
        }
        
        const calcDigit = (cnpj: string, positions: number) => {
            let sum = 0;
            let pos = positions - 7;
            
            for (let i = positions; i >= 1; i--) {
                sum += parseInt(cnpj.charAt(positions - i)) * pos--;
                if (pos < 2) {
                    pos = 9;
                }
            }
            
            const result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
            return result;
        };
        
        const digit1 = calcDigit(cnpj, 12);
        const digit2 = calcDigit(cnpj, 13);
        
        return (
            digit1 === parseInt(cnpj.charAt(12)) &&
            digit2 === parseInt(cnpj.charAt(13))
        );
}, "CNPJ inválido");

export const cepSchema = z.string()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido (formato: 12345-678 ou 12345678)")
    .transform((val) => val.replace(/\D/g, ""));

export const phoneSchema = z.string()
    .regex(
    /^(?:\+55\s?)?(?:\(?\d{2}\)?[\s-]?)?(?:9\d{4}[\s-]?\d{4}|\d{4}[\s-]?\d{4})$/,
    "Telefone inválido (formato: (11) 98765-4321 ou 11987654321)"
    )
    .transform((val) => val.replace(/\D/g, "")); // Remove formatação

export const cellphoneSchema = z.string()
    .regex(
        /^(?:\+55\s?)?(?:\(?\d{2}\)?[\s-]?)?9\d{4}[\s-]?\d{4}$/,
        "Celular inválido (formato: (11) 98765-4321)"
    )
    .transform((val) => val.replace(/\D/g, ""));

export const landlineSchema = z.string()
    .regex(
        /^(?:\+55\s?)?(?:\(?\d{2}\)?[\s-]?)?[2-8]\d{3}[\s-]?\d{4}$/,
        "Telefone fixo inválido (formato: (11) 3456-7890)"
    )
    .transform((val) => val.replace(/\D/g, ""));

export const stateSchema = z.enum([
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO",
], {
    message: "Estado inválido. Use a sigla do estado (ex: SP, RJ)",
});

export const brazilianAddressSchema = z.object({
    cep: cepSchema,
    street: z.string()
        .min(3, "Logradouro deve ter no mínimo 3 caracteres")
        .max(200, "Logradouro deve ter no máximo 200 caracteres"),
    number: z.string()
        .min(1, "Número é obrigatório")
        .max(20, "Número deve ter no máximo 20 caracteres"),
    complement: z.string()
        .max(100, "Complemento deve ter no máximo 100 caracteres")
        .optional(),
    neighborhood: z.string()
        .min(2, "Bairro deve ter no mínimo 2 caracteres")
        .max(100, "Bairro deve ter no máximo 100 caracteres"),
    city: z.string()
        .min(2, "Cidade deve ter no mínimo 2 caracteres")
        .max(100, "Cidade deve ter no máximo 100 caracteres"),
    state: stateSchema,
});
