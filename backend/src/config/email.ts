import nodemailer from 'nodemailer';

export const EMAIL_CONFIG = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true para porta 465, false para outras portas
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    from: process.env.EMAIL_FROM || 'noreply@filasolidaria.com',
};

export const createEmailTransporter = () => {
    return nodemailer.createTransport({
        host: EMAIL_CONFIG.host,
        port: EMAIL_CONFIG.port,
        secure: EMAIL_CONFIG.secure,
        auth: EMAIL_CONFIG.auth,
    });
};

export interface EmailData {
  to: string;           // Email do destinatário
  subject: string;      // Assunto do email
  text?: string;        // Versão texto do email (para clientes que não suportam HTML)
  html: string;         // Versão HTML do email (mais bonita e rica)
}

export async function sendEmail(data: EmailData): Promise<void> {
    const transporter = createEmailTransporter();
    
    try {
        await transporter.sendMail({
        from: EMAIL_CONFIG.from,
        to: data.to,
        subject: data.subject,
        text: data.text,
        html: data.html,
        });
        console.log(`✉️  Email enviado para ${data.to}`);
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
        throw new Error('Falha ao enviar email');
    }
}