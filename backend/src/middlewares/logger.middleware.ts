import { Request, Response, NextFunction } from "express";

/**
 * Este middleware loga informações sobre cada requisição que chega no servidor
 * É extremamente útil para debug e monitoramento em produção
 * Ele registra: método HTTP, rota, tempo de resposta, status code, etc.
 * @param req 
 * @param res 
 * @param next 
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get("user-agent") || "unknown";

    console.log(`➡️  ${method} ${originalUrl} - IP: ${ip} - ${userAgent}`);

    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
        const duration = Date.now() - startTime;
        const statusColor = getStatusColor(res.statusCode);
        console.log(
        `⬅️  ${method} ${originalUrl} - ${statusColor}${res.statusCode}\x1b[0m - ${duration}ms`
        );

        if (res.statusCode >= 400) {
            console.log(`   ⚠️  Erro: ${JSON.stringify(body, null, 2)}`);
        }

        return originalJson(body);
    };


    next();
}

/**
 * Função auxiliar para colorir o output do console baseado no status code
 * Códigos 2xx em verde (sucesso)
 * Códigos 3xx em ciano (redirecionamento)
 * Códigos 4xx em amarelo (erro do cliente)
 * Códigos 5xx em vermelho (erro do servidor)
 * @param statusCode 
 * @returns 
 */
function getStatusColor(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) {
        return "\x1b[32m"; // Verde
    }

    if (statusCode >= 300 && statusCode < 400) {
        return "\x1b[36m"; // Ciano
    }

    if (statusCode >= 400 && statusCode < 500) {
        return "\x1b[33m"; // Amarelo
    }

    return "\x1b[31m"; // Vermelho
}

/**
 * Middleware para logar apenas requisições lentas (acima de um threshold)
 * Útil para identificar endpoints que precisam de otimização
 * @param thresholdMs 
 * @returns 
 */
export function slowRequestLogger(thresholdMs: number = 1000) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const startTime = Date.now();
        const { method, originalUrl } = req;

        const originalJson = res.json.bind(res);

        res.json = function (body: any) {
            const duration = Date.now() - startTime;

            if (duration > thresholdMs) {
                console.warn(
                `🐌 REQUISIÇÃO LENTA: ${method} ${originalUrl} - ${duration}ms (threshold: ${thresholdMs}ms)`
                );
            }

            return originalJson(body);
        };

        next();
    };
}

/**
 * Middleware para logar informações detalhadas sobre erros
 * Complementa o error handler registrando informações adicionais
 * @param err 
 * @param req 
 * @param next 
 */
export function errorLogger(err: Error, req: Request, next: NextFunction): void {
    console.error("\n❌ ERRO CAPTURADO:");
    console.error(`   Rota: ${req.method} ${req.originalUrl}`);
    console.error(`   IP: ${req.ip}`);
    console.error(`   User-Agent: ${req.get("user-agent")}`);
    console.error(`   Body: ${JSON.stringify(req.body, null, 2)}`);
    console.error(`   Erro: ${err.message}`);

    if (process.env.NODE_ENV === "development") {
        console.error(`   Stack: ${err.stack}`);
    }
    console.error(" ");

    next(err);
}