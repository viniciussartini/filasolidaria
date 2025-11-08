import { NextFunction } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import { verifyToken } from "../config/jwt.js";
import { AuthRepository } from "../modules/auth/auth.repository.js";
import { UnauthorizedError } from "../shared/errors/AppError.js";


/**
 * Este middleware é a primeira linha de defesa da nossa aplicação
 * Ele garante que apenas usuários autenticados possam acessar rotas protegidas
 * Funciona extraindo o token do header Authorization, validando esse token,
 * e anexando as informações do usuário à requisição para uso posterior
 * @param req 
 * @param next 
 */
export async function authenticate(req: AuthenticatedRequest, next: NextFunction): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedError("Token não fornecido");
        }

        const parts = authHeader.split(" ");

        if (parts.length !== 2) {
            throw new UnauthorizedError("Formato de token inválido");
        }

        const [scheme, token] = parts;

        if (!/^Bearer$/i.test(scheme)) {
            throw new UnauthorizedError("Token mal formatado");
        }

        const decoded = verifyToken(token);

        const authRepository = new AuthRepository();
        const isRevoked = await authRepository.isTokenRevoked(token);

        if (isRevoked) {
            throw new UnauthorizedError("Token revogado. Faça login novamente.");
        }

        req.user = {
        userId: decoded.userId,
        email: decoded.email,
        platform: decoded.platform,
        };

        next();
    } catch (error) {
        next(error);
    }
    }


/**
 * Middleware opcional que permite rotas funcionarem com ou sem autenticação
 * Útil para rotas que mostram mais informações se o usuário estiver logado,
 * mas também funcionam para visitantes não autenticados
 * Por exemplo: listagem de doações pode mostrar mais detalhes para usuários logados
 * @param req 
 * @param next 
 * @returns 
 */
export async function optionalAuthenticate(req: AuthenticatedRequest, next: NextFunction): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next();
        }

        const parts = authHeader.split(" ");

        if (parts.length !== 2) {
            return next();
        }

        const [scheme, token] = parts;

        if (!/^Bearer$/i.test(scheme)) {
            return next();
        }

        const decoded = verifyToken(token);
        const authRepository = new AuthRepository();
        const isRevoked = await authRepository.isTokenRevoked(token);

        if (!isRevoked) {
            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                platform: decoded.platform,
            };
        }

        next();
    } catch (error) {
        next();
    }
}


/**
 * Middleware para verificar se o usuário autenticado é o dono do recurso
 * Útil para rotas como "atualizar perfil" onde userId vem nos params
 * e precisa ser o mesmo do usuário logado
 * Este é um factory function que retorna um middleware configurado
 * @param paramName 
 * @returns 
 */
export function requireOwnership(paramName: string = "userId") {
    return (req: AuthenticatedRequest, next: NextFunction): void => {
        try {
            if (!req.user) {
                throw new UnauthorizedError("Autenticação necessária");
            }

            const resourceOwnerId = req.params[paramName];

            if (req.user.userId !== resourceOwnerId) {
                throw new UnauthorizedError(
                "Você não tem permissão para acessar este recurso"
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}