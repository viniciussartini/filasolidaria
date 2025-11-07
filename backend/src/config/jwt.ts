import jwt from "jsonwebtoken";
import { JwtPayload } from "../types/index.js";
import { UnauthorizedError } from "../errors/AppError.js";

export const JWT_CONFIG = {
    secret: process.env.JWT_SECRET || "default_secret_change_in_production",
    expiresInWeb: process.env.JWT_EXPIRES_IN_WEB || "7d",
    expiresInMobile: process.env.JWT_EXPIRES_IN_MOBILE || "365d",
    };

    export function generateToken(payload: JwtPayload): string {
    const expiresIn = payload.platform === "web" 
        ? JWT_CONFIG.expiresInWeb 
        : JWT_CONFIG.expiresInMobile;



    return jwt.sign(
        payload, 
        JWT_CONFIG.secret, 
        expiresIn as any
    );
}

export function verifyToken(token: string): JwtPayload {
    try {
        const decoded = jwt.verify(token, JWT_CONFIG.secret) as JwtPayload;
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError("Token expirado");
        }
        if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError("Token inválido");
        }
        throw new UnauthorizedError("Erro ao verificar token");
    }
}

export function decodeToken(token: string): JwtPayload | null {
    try {
        const decoded = jwt.decode(token) as JwtPayload;
        return decoded;
    } catch (error) {
        return null;
    }
}

export function getTokenExpiration(token: string): Date | null {
    try {
        const decoded = jwt.decode(token) as any;
        if (decoded && decoded.exp) {
        // O "exp" do JWT está em segundos, precisamos converter para milissegundos
        return new Date(decoded.exp * 1000);
        }
        return null;
    } catch (error) {
        return null;
    }
}