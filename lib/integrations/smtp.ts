import * as nodemailer from "nodemailer";

export interface SmtpConfig {
  server: string;
  port: number;
  user: string;
  password: string;
  useTls: boolean;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SmtpTestResult {
  success: boolean;
  error?: string;
  serverInfo?: {
    name: string;
    greeting?: string;
  };
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Create a nodemailer transporter with the given SMTP configuration
 */
function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.server,
    port: config.port,
    secure: config.port === 465, // true for 465, false for other ports
    auth: {
      user: config.user,
      pass: config.password,
    },
    tls: {
      rejectUnauthorized: config.useTls,
      minVersion: "TLSv1.2",
    },
  });
}

/**
 * Test SMTP connection with the given configuration
 * @param config SMTP configuration
 * @param timeout Timeout in milliseconds (default: 10000)
 */
export async function testSmtpConnection(
  config: SmtpConfig,
  timeout: number = 10000
): Promise<SmtpTestResult> {
  // Validate required fields
  if (!config.server || !config.port || !config.user || !config.password) {
    return {
      success: false,
      error: "Configuracao SMTP incompleta",
    };
  }

  try {
    const transporter = createTransporter(config);

    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout na conexao SMTP")), timeout);
    });

    // Race between verification and timeout
    const result = await Promise.race([
      transporter.verify(),
      timeoutPromise,
    ]);

    // If verification succeeds, result is true
    if (result === true) {
      return {
        success: true,
        serverInfo: {
          name: config.server,
        },
      };
    }

    return {
      success: false,
      error: "Falha na verificacao SMTP",
    };
  } catch (error) {
    let errorMessage = "Erro desconhecido na conexao SMTP";

    if (error instanceof Error) {
      // Parse common SMTP errors
      if (error.message.includes("ECONNREFUSED")) {
        errorMessage = `Conexao recusada pelo servidor ${config.server}:${config.port}`;
      } else if (error.message.includes("ETIMEDOUT") || error.message.includes("Timeout")) {
        errorMessage = `Timeout na conexao com ${config.server}:${config.port}`;
      } else if (error.message.includes("ENOTFOUND")) {
        errorMessage = `Servidor nao encontrado: ${config.server}`;
      } else if (error.message.includes("Invalid login") || error.message.includes("AUTH")) {
        errorMessage = "Credenciais de autenticacao invalidas";
      } else if (error.message.includes("certificate")) {
        errorMessage = "Erro no certificado TLS/SSL";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send an email using the given SMTP configuration
 */
export async function sendEmail(
  config: SmtpConfig,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  // Validate required fields
  if (!options.to || !options.subject) {
    return {
      success: false,
      error: "Destinatario e assunto sao obrigatorios",
    };
  }

  if (!options.html && !options.text) {
    return {
      success: false,
      error: "Conteudo do email e obrigatorio (html ou text)",
    };
  }

  try {
    const transporter = createTransporter(config);

    const mailOptions = {
      from: options.from || config.user,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    let errorMessage = "Erro ao enviar email";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Re-export presets from separate file (safe for client import)
export { smtpPresets, type SmtpPresetName } from "./smtp-presets";
