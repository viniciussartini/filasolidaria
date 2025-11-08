import { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors/AppError.js";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

/**
 * Este middleware é o centralizador de tratamento de erros da aplicação
 * Ele captura TODOS os erros que acontecem durante o processamento de uma requisição
 * e os transforma em respostas JSON padronizadas e amigáveis
 * @param err 
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    if (process.env.NODE_ENV === "development") {
        console.error("🔴 Erro capturado:", err);
    }

    if (err instanceof AppError) {
        return void res.status(err.statusCode).json({
            status: "error",
            message: err.message,
            ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
        });
    }

    if (err instanceof ZodError) {
        const errors = err.issues.map((error) => ({
            field: error.path.join("."),
            message: error.message,
        }));

        return void res.status(400).json({
            status: "error",
            message: "Erro de validação",
            errors,
        });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Código P2025 = registro não encontrado
        if (err.code === "P2025") {
            return void res.status(404).json({
                status: "error",
                message: "Registro não encontrado",
            });
        }

        // Código P2002 = violação de constraint única (duplicate key)
        if (err.code === "P2002") {
            const target = (err.meta?.target as string[]) || [];
            return void res.status(409).json({
                status: "error",
                message: `Já existe um registro com este(a) ${target.join(", ")}`,
            });
        }

        // Código P2003 = violação de foreign key
        if (err.code === "P2003") {
            return void res.status(400).json({
                status: "error",
                message: "Referência inválida. O registro relacionado não existe.",
            });
        }

        // Para outros erros do Prisma, retornamos uma mensagem genérica
        return void res.status(400).json({
            status: "error",
            message: "Erro ao processar operação no banco de dados",
            ...(process.env.NODE_ENV === "development" && { 
                details: err.message,
                code: err.code 
            }),
        });
    }

    // Erro de validação do Prisma (schema inválido)
    if (err instanceof Prisma.PrismaClientValidationError) {
        return void res.status(400).json({
            status: "error",
            message: "Dados inválidos fornecidos",
            ...(process.env.NODE_ENV === "development" && { details: err.message }),
        });
    }

    // Erros de sintaxe JSON
    // Acontece quando o corpo da requisição não é um JSON válido
    if (err instanceof SyntaxError && "body" in err) {
        return void res.status(400).json({
            status: "error",
            message: "JSON inválido no corpo da requisição",
        });
    }

    console.error("❌ Erro não tratado:", err);

    return void res.status(500).json({
        status: "error",
        message: "Erro interno do servidor",
        ...(process.env.NODE_ENV === "development" && {
            message: err.message,
            stack: err.stack,
        }),
    });
}


/**
 * Middleware para capturar rotas não encontradas (404)
 * Este middleware deve ser registrado APÓS todas as rotas
 * Se a requisição chegou até aqui, significa que nenhuma rota correspondeu
 * @param req 
 * @param res
 */
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
    res.status(404).json({
        status: "error",
        message: `Rota ${req.method} ${req.path} não encontrada`,
    });
}


/**
 * Middleware para lidar com erros assíncronos
 * Este é um wrapper que você pode usar em rotas assíncronas
 * Ele captura rejeições de promises e passa para o error handler
 * Uso: router.get("/rota", asyncHandler(async (req, res) => { ... }))
 * @param fn 
 * @returns 
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}