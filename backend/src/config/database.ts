import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

// Função para conectar ao banco de dados
export async function connectDatabase(): Promise<void> {
    try {
        await prisma.$connect();
        console.log("✅ Conectado ao MongoDB com sucesso!");
    } catch (error) {
        console.error("❌ Erro ao conectar ao MongoDB:", error);
        process.exit(1);
    }
}

// Função para desconectar do banco (útil para testes e shutdown graceful)
export async function disconnectDatabase(): Promise<void> {
    await prisma.$disconnect();
    console.log("🔌 Desconectado do MongoDB");
}

export { prisma };