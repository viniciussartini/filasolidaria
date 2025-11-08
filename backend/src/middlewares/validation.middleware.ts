import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ValidationError } from "../shared/errors/AppError.js";

/**
 * Este middleware é responsável por validar dados usando schemas Zod
 * Ele pode validar o corpo da requisição (body), parâmetros da URL (params)
 * ou query strings (query)
 * 
 * Exemplo de uso:
 * router.post("/users", validate(registerSchema), createUser);
 * 
 * Se a validação falhar, ele automaticamente retorna um erro 400 com
 * detalhes sobre quais campos estão inválidos
 * @param schema 
 * @param source 
 * @returns 
 */
export function validate(schema: z.ZodSchema, source: "body" | "params" | "query" = "body") {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const dataToValidate = req[source];

            const validatedData = await schema.parseAsync(dataToValidate);
            req[source] = validatedData;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map((err) => ({
                    field: err.path.join("."), // Campo que falhou (ex: "email", "address.street")
                    message: err.message,       // Mensagem de erro específica
                }));

                return next(new ValidationError(
                    JSON.stringify(errors, null, 2)
                ));
            }

            next(error);
        }
    };
}

/**
 * Middleware específico para validar múltiplas fontes ao mesmo tempo
 * Útil quando você precisa validar tanto params quanto body, por exemplo
 * @param schemas 
 * @returns 
 */
export function validateMultiple(schemas: {body?: z.ZodSchema; params?: z.ZodSchema; query?: z.ZodSchema;}) {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const errors: Array<{ source: string; field: string; message: string }> = [];

            if (schemas.body) {
                try {
                    req.body = await schemas.body.parseAsync(req.body);
                } catch (error) {
                    if (error instanceof ZodError) {
                        error.issues.forEach((err) => {
                            errors.push({
                                source: "body",
                                field: err.path.join("."),
                                message: err.message,
                            });
                        });
                    }
                }
            }

            if (schemas.params) {
                try {
                    req.params = await schemas.params.parseAsync(req.params) as any;
                } catch (error) {
                    if (error instanceof ZodError) {
                        error.issues.forEach((err) => {
                            errors.push({
                                source: "params",
                                field: err.path.join("."),
                                message: err.message,
                            });
                        });
                    }
                }
            }

            if (schemas.query) {
                try {
                    req.query = await schemas.query.parseAsync(req.query) as any;
                } catch (error) {
                    if (error instanceof ZodError) {
                        error.issues.forEach((err) => {
                            errors.push({
                                source: "query",
                                field: err.path.join("."),
                                message: err.message,
                            });
                        });
                    }
                }
            }

            if (errors.length > 0) {
                return next(new ValidationError(
                    JSON.stringify(errors, null, 2)
                ));
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}