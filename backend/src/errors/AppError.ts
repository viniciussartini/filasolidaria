// Classe base para erros da aplicação
// Todos os outros erros herdarão desta classe
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number = 400, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        // Mantém o stack trace correto para onde o erro foi lançado
        Error.captureStackTrace(this, this.constructor);
    }
    }

    export class NotFoundError extends AppError {
    constructor(message: string = "Recurso não encontrado") {
        super(message, 404);
    }
    }

    export class UnauthorizedError extends AppError {
    constructor(message: string = "Não autorizado") {
        super(message, 401);
    }
    }

    export class ForbiddenError extends AppError {
    constructor(message: string = "Acesso negado") {
        super(message, 403);
    }
    }

    export class ConflictError extends AppError {
    constructor(message: string = "Conflito de dados") {
        super(message, 409);
    }
    }

    export class ValidationError extends AppError {
    constructor(message: string = "Dados inválidos") {
        super(message, 400);
    }
    }

    export class InternalServerError extends AppError {
    constructor(message: string = "Erro interno do servidor") {
        super(message, 500, false); // isOperational = false pois é erro inesperado
    }
}