import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
}

export function getObjectDifferences<T extends Record<string, any>>(
    oldObj: T,
    newObj: Partial<T>
    ): Record<string, { oldValue: any; newValue: any }> {
    const differences: Record<string, { oldValue: any; newValue: any }> = {};

    // Itera sobre todas as chaves do novo objeto
    for (const key in newObj) {
        // Verifica se o valor mudou e se a chave existe no objeto antigo
        if (newObj[key] !== undefined && oldObj[key] !== newObj[key]) {
        differences[key] = {
            oldValue: oldObj[key],
            newValue: newObj[key],
        };
        }
    }

    return differences;
}

export function sanitizeUserData(user: any) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
}

export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function formatPostalCode(postalCode: string): string {
    return postalCode.replace(/\D/g, "");
}

export function formatPhone(phone: string): string {
    return phone.replace(/\D/g, "");
}

export function isValidAge(age: number): boolean {
    return age >= 13 && age <= 120;
}

export function calculateExpirationDate(timeString: string): Date {
    const unit = timeString.slice(-1); // Pega a última letra (d, h, m)
    const value = parseInt(timeString.slice(0, -1)); // Pega o número

    const now = new Date();

    switch (unit) {
        case "d": // dias
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
        case "h": // horas
        return new Date(now.getTime() + value * 60 * 60 * 1000);
        case "m": // minutos
        return new Date(now.getTime() + value * 60 * 1000);
        default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // padrão: 7 dias
    }
}

export function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
    const cleaned: any = {};
    
    for (const key in obj) {
        if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
        }
    }
    
    return cleaned;
}