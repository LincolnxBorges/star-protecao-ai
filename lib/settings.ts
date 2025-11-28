import { db } from "@/lib/db";
import { settings, settingsAuditLog, messageTemplate } from "@/lib/schema";
import type { MessageTemplate, NewMessageTemplate } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt, maskSensitive, isEncrypted } from "@/lib/crypto";
import {
  type SettingsCategory,
  SETTINGS_CATEGORIES,
  getSettingsSchema,
  getDefaultSettings,
  getSensitiveFields,
  defaultSettingsMap,
} from "@/lib/settings-schemas";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// ===========================================
// Settings CRUD Operations
// ===========================================

/**
 * Gets settings for a specific category
 * @param category - The settings category to fetch
 * @returns The settings data or default values if not found
 */
export async function getSettings<T>(category: SettingsCategory): Promise<T> {
  const result = await db
    .select()
    .from(settings)
    .where(eq(settings.category, category))
    .limit(1);

  if (result.length === 0) {
    return getDefaultSettings(category) as T;
  }

  const data = result[0].data as Record<string, unknown>;
  return decryptSensitiveFields(category, data) as T;
}

/**
 * Updates settings for a specific category
 * @param category - The settings category to update
 * @param data - The new settings data
 * @param userId - The ID of the user making the change (for audit)
 */
export async function updateSettings<T extends Record<string, unknown>>(
  category: SettingsCategory,
  data: T,
  userId: string
): Promise<void> {
  // Validate data against schema
  const schema = getSettingsSchema(category);
  const validationResult = schema.safeParse(data);

  if (!validationResult.success) {
    throw new Error(`Validation failed: ${validationResult.error.message}`);
  }

  // Get current settings for audit comparison
  const currentSettings = await getSettings<Record<string, unknown>>(category);

  // Create audit logs for sensitive field changes
  await createAuditLogsForChanges(category, currentSettings, data, userId);

  // Encrypt sensitive fields before saving
  const encryptedData = encryptSensitiveFields(category, data);

  // Upsert settings
  await db
    .insert(settings)
    .values({
      category,
      data: encryptedData,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: settings.category,
      set: {
        data: encryptedData,
        updatedAt: new Date(),
      },
    });
}

/**
 * Gets all settings for all categories
 * @returns Object with all settings keyed by category
 */
export async function getAllSettings(): Promise<
  Record<SettingsCategory, unknown>
> {
  const result: Record<string, unknown> = {};

  for (const category of SETTINGS_CATEGORIES) {
    result[category] = await getSettings(category);
  }

  return result as Record<SettingsCategory, unknown>;
}

// ===========================================
// Encryption Helpers
// ===========================================

function encryptSensitiveFields(
  category: SettingsCategory,
  data: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveFields = getSensitiveFields(category);
  const result = { ...data };

  for (const fieldPath of sensitiveFields) {
    const value = getNestedValue(result, fieldPath);
    if (typeof value === "string" && value && !isEncrypted(value)) {
      setNestedValue(result, fieldPath, encrypt(value));
    }
  }

  return result;
}

function decryptSensitiveFields(
  category: SettingsCategory,
  data: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveFields = getSensitiveFields(category);
  const result = { ...data };

  for (const fieldPath of sensitiveFields) {
    const value = getNestedValue(result, fieldPath);
    if (typeof value === "string" && value && isEncrypted(value)) {
      try {
        setNestedValue(result, fieldPath, decrypt(value));
      } catch {
        // If decryption fails, keep the original value
        console.error(`Failed to decrypt field ${fieldPath} in ${category}`);
      }
    }
  }

  return result;
}

function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  return path.split(".").reduce((current: unknown, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const keys = path.split(".");
  const lastKey = keys.pop()!;

  let current = obj;
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[lastKey] = value;
}

// ===========================================
// Audit Logging
// ===========================================

async function createAuditLogsForChanges(
  category: SettingsCategory,
  previousData: Record<string, unknown>,
  newData: Record<string, unknown>,
  userId: string
): Promise<void> {
  const sensitiveFields = getSensitiveFields(category);

  for (const fieldPath of sensitiveFields) {
    const previousValue = getNestedValue(previousData, fieldPath);
    const newValue = getNestedValue(newData, fieldPath);

    if (previousValue !== newValue) {
      await createAuditLog({
        userId,
        category,
        field: fieldPath,
        previousValue:
          typeof previousValue === "string"
            ? maskSensitive(previousValue)
            : JSON.stringify(previousValue),
      });
    }
  }
}

/**
 * Creates an audit log entry
 */
export async function createAuditLog(entry: {
  userId: string;
  category: string;
  field: string;
  previousValue: string | null;
}): Promise<void> {
  await db.insert(settingsAuditLog).values({
    userId: entry.userId,
    category: entry.category,
    field: entry.field,
    previousValue: entry.previousValue,
    changedAt: new Date(),
  });
}

/**
 * Gets audit logs for a specific category
 * @param category - The settings category to get logs for
 * @param limit - Maximum number of logs to return
 */
export async function getAuditLogs(
  category?: SettingsCategory,
  limit = 50
): Promise<typeof settingsAuditLog.$inferSelect[]> {
  const query = db.select().from(settingsAuditLog);

  if (category) {
    return query
      .where(eq(settingsAuditLog.category, category))
      .orderBy(settingsAuditLog.changedAt)
      .limit(limit);
  }

  return query.orderBy(settingsAuditLog.changedAt).limit(limit);
}

// ===========================================
// Admin Verification
// ===========================================

/**
 * Checks if the current user is an admin
 * @returns true if the user is authenticated (for now, all authenticated users are admins)
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return !!session?.user;
}

/**
 * Gets the current user ID from the session
 * @returns The user ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user?.id || null;
}

/**
 * Requires admin access, throws if not admin
 */
export async function requireAdmin(): Promise<string> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("Unauthorized: Admin access required");
  }

  return userId;
}

// ===========================================
// Initialization / Seed
// ===========================================

/**
 * Initializes default settings for all categories
 * Only creates settings that don't already exist
 */
export async function initializeDefaultSettings(): Promise<void> {
  for (const category of SETTINGS_CATEGORIES) {
    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.category, category))
      .limit(1);

    if (existing.length === 0) {
      const defaultData = defaultSettingsMap[category];
      const encryptedData = encryptSensitiveFields(
        category,
        defaultData as Record<string, unknown>
      );

      await db.insert(settings).values({
        category,
        data: encryptedData,
      });

      console.log(`Initialized default settings for category: ${category}`);
    }
  }
}

/**
 * Resets settings for a specific category to defaults
 * @param category - The category to reset
 * @param userId - The ID of the user making the change (for audit)
 */
export async function resetToDefaults(
  category: SettingsCategory,
  userId: string
): Promise<void> {
  const defaultData = getDefaultSettings(category) as Record<string, unknown>;
  await updateSettings(category, defaultData, userId);
}

// ===========================================
// Message Templates CRUD
// ===========================================

/**
 * List all message templates
 */
export async function listTemplates(): Promise<MessageTemplate[]> {
  return db.select().from(messageTemplate).orderBy(messageTemplate.name);
}

/**
 * Get a template by ID
 */
export async function getTemplate(id: string): Promise<MessageTemplate | null> {
  const result = await db
    .select()
    .from(messageTemplate)
    .where(eq(messageTemplate.id, id))
    .limit(1);

  return result[0] || null;
}

/**
 * Create a new message template
 */
export async function createTemplate(
  data: Omit<NewMessageTemplate, "id" | "createdAt" | "updatedAt">
): Promise<MessageTemplate> {
  const result = await db
    .insert(messageTemplate)
    .values({
      name: data.name,
      eventType: data.eventType,
      content: data.content,
      isActive: data.isActive ?? true,
    })
    .returning();

  return result[0];
}

/**
 * Update an existing message template
 */
export async function updateTemplate(
  id: string,
  data: Partial<Omit<NewMessageTemplate, "id" | "createdAt">>
): Promise<MessageTemplate | null> {
  const result = await db
    .update(messageTemplate)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(messageTemplate.id, id))
    .returning();

  return result[0] || null;
}

/**
 * Delete a message template
 */
export async function deleteTemplate(id: string): Promise<boolean> {
  const result = await db
    .delete(messageTemplate)
    .where(eq(messageTemplate.id, id))
    .returning();

  return result.length > 0;
}

// ===========================================
// Template Variable Validation
// ===========================================

/**
 * Available template variables by event type
 */
export const templateVariables: Record<string, { name: string; description: string }[]> = {
  quotation_created: [
    { name: "cliente_nome", description: "Nome do cliente" },
    { name: "cliente_telefone", description: "Telefone do cliente" },
    { name: "cliente_email", description: "Email do cliente" },
    { name: "veiculo_marca", description: "Marca do veiculo" },
    { name: "veiculo_modelo", description: "Modelo do veiculo" },
    { name: "veiculo_ano", description: "Ano do veiculo" },
    { name: "veiculo_placa", description: "Placa do veiculo" },
    { name: "valor_fipe", description: "Valor FIPE formatado" },
    { name: "mensalidade", description: "Valor da mensalidade" },
    { name: "adesao", description: "Taxa de adesao" },
    { name: "cota_participacao", description: "Cota de participacao" },
    { name: "validade_dias", description: "Dias de validade da cotacao" },
    { name: "empresa_nome", description: "Nome da empresa" },
  ],
  quotation_expiring: [
    { name: "cliente_nome", description: "Nome do cliente" },
    { name: "veiculo_modelo", description: "Modelo do veiculo" },
    { name: "veiculo_placa", description: "Placa do veiculo" },
    { name: "mensalidade", description: "Valor da mensalidade" },
    { name: "dias_restantes", description: "Dias restantes para expirar" },
    { name: "empresa_nome", description: "Nome da empresa" },
  ],
  quotation_accepted: [
    { name: "cliente_nome", description: "Nome do cliente" },
    { name: "veiculo_modelo", description: "Modelo do veiculo" },
    { name: "veiculo_placa", description: "Placa do veiculo" },
    { name: "empresa_nome", description: "Nome da empresa" },
  ],
};

/**
 * Get available variables for an event type
 */
export function getTemplateVariables(eventType: string): { name: string; description: string }[] {
  return templateVariables[eventType] || [];
}

/**
 * Validate template content for valid variables
 * Returns list of invalid variables found
 */
export function validateTemplateVariables(
  content: string,
  eventType: string
): { valid: boolean; invalidVariables: string[] } {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const matches = content.matchAll(variableRegex);
  const validVariableNames = new Set(
    getTemplateVariables(eventType).map((v) => v.name)
  );

  const invalidVariables: string[] = [];

  for (const match of matches) {
    const variableName = match[1];
    if (!validVariableNames.has(variableName)) {
      invalidVariables.push(variableName);
    }
  }

  return {
    valid: invalidVariables.length === 0,
    invalidVariables,
  };
}

/**
 * Replace template variables with actual values
 */
export function renderTemplate(
  content: string,
  variables: Record<string, string | number>
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    const value = variables[variableName];
    return value !== undefined ? String(value) : match;
  });
}

// ===========================================
// Default Templates Seed
// ===========================================

const defaultTemplates: Omit<NewMessageTemplate, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Cotacao Criada",
    eventType: "quotation_created",
    content: `Ola {{cliente_nome}}! Sua cotacao de protecao veicular esta pronta!

🚗 *Veiculo:* {{veiculo_marca}} {{veiculo_modelo}} {{veiculo_ano}}
📋 *Placa:* {{veiculo_placa}}
💰 *Valor FIPE:* R$ {{valor_fipe}}

📊 *Valores:*
• Mensalidade: *R$ {{mensalidade}}*
• Adesao: R$ {{adesao}}
• Cota participacao: R$ {{cota_participacao}}

⏰ Esta cotacao e valida por {{validade_dias}} dias.

{{empresa_nome}}`,
    isActive: true,
  },
  {
    name: "Cotacao Expirando",
    eventType: "quotation_expiring",
    content: `Ola {{cliente_nome}}! Sua cotacao para o *{{veiculo_modelo}}* expira em *{{dias_restantes}} dias*!

💰 Mensalidade: *R$ {{mensalidade}}*

Nao perca essa oportunidade de proteger seu veiculo.

{{empresa_nome}}`,
    isActive: true,
  },
  {
    name: "Cotacao Aceita",
    eventType: "quotation_accepted",
    content: `Parabens {{cliente_nome}}! 🎉

Sua protecao veicular foi ativada com sucesso!

🚗 *Veiculo:* {{veiculo_modelo}}
📋 *Placa:* {{veiculo_placa}}

Bem-vindo a familia {{empresa_nome}}!`,
    isActive: true,
  },
];

/**
 * Initialize default message templates
 * Only creates templates that don't already exist
 */
export async function initializeDefaultTemplates(): Promise<void> {
  for (const template of defaultTemplates) {
    const existing = await db
      .select()
      .from(messageTemplate)
      .where(eq(messageTemplate.eventType, template.eventType))
      .limit(1);

    if (existing.length === 0) {
      await createTemplate(template);
      console.log(`Created default template: ${template.name}`);
    }
  }
}

// ===========================================
// Backup Functions
// ===========================================

export interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  type: "manual" | "automatic";
}

export interface BackupResult {
  success: boolean;
  filename?: string;
  size?: number;
  error?: string;
}

const BACKUP_DIR = "backups";

/**
 * Create a manual backup of all settings and templates
 * Note: This creates a JSON export, not a pg_dump (for simplicity and portability)
 */
export async function createBackup(type: "manual" | "automatic" = "manual"): Promise<BackupResult> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");

    // Ensure backup directory exists
    const backupPath = path.join(process.cwd(), BACKUP_DIR);
    try {
      await fs.access(backupPath);
    } catch {
      await fs.mkdir(backupPath, { recursive: true });
    }

    // Collect all data to backup
    const allSettings = await getAllSettings();
    const templates = await listTemplates();

    const backupData = {
      version: "1.0",
      createdAt: new Date().toISOString(),
      type,
      settings: allSettings,
      templates,
    };

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${type}-${timestamp}.json`;
    const filePath = path.join(backupPath, filename);

    // Write backup file
    const content = JSON.stringify(backupData, null, 2);
    await fs.writeFile(filePath, content, "utf-8");

    const stats = await fs.stat(filePath);

    return {
      success: true,
      filename,
      size: stats.size,
    };
  } catch (error) {
    console.error("Backup failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar backup",
    };
  }
}

/**
 * List all existing backups
 */
export async function listBackups(): Promise<BackupInfo[]> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");

    const backupPath = path.join(process.cwd(), BACKUP_DIR);

    try {
      await fs.access(backupPath);
    } catch {
      // Directory doesn't exist, return empty list
      return [];
    }

    const files = await fs.readdir(backupPath);
    const backups: BackupInfo[] = [];

    for (const file of files) {
      if (file.startsWith("backup-") && file.endsWith(".json")) {
        const filePath = path.join(backupPath, file);
        const stats = await fs.stat(filePath);

        // Parse type from filename (backup-manual-... or backup-automatic-...)
        const type = file.includes("-manual-") ? "manual" : "automatic";

        backups.push({
          id: file.replace(".json", ""),
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
          type: type as "manual" | "automatic",
        });
      }
    }

    // Sort by creation date, newest first
    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("Error listing backups:", error);
    return [];
  }
}

/**
 * Delete a backup file
 */
export async function deleteBackup(filename: string): Promise<boolean> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");

    // Validate filename to prevent directory traversal
    if (!filename.startsWith("backup-") || !filename.endsWith(".json")) {
      return false;
    }

    const filePath = path.join(process.cwd(), BACKUP_DIR, filename);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error("Error deleting backup:", error);
    return false;
  }
}

/**
 * Delete backups older than the retention period
 */
export async function cleanupOldBackups(retentionDays: number): Promise<number> {
  try {
    const backups = await listBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let deletedCount = 0;

    for (const backup of backups) {
      if (backup.createdAt < cutoffDate) {
        const deleted = await deleteBackup(backup.filename);
        if (deleted) {
          deletedCount++;
        }
      }
    }

    return deletedCount;
  } catch (error) {
    console.error("Error cleaning up backups:", error);
    return 0;
  }
}

// ===========================================
// Export Functions
// ===========================================

export type ExportFormat = "json" | "csv";

export interface ExportResult {
  success: boolean;
  data?: string;
  filename?: string;
  mimeType?: string;
  error?: string;
}

/**
 * Export settings to JSON or CSV format
 */
export async function exportSettings(format: ExportFormat = "json"): Promise<ExportResult> {
  try {
    const allSettings = await getAllSettings();

    if (format === "json") {
      return {
        success: true,
        data: JSON.stringify(allSettings, null, 2),
        filename: `settings-export-${Date.now()}.json`,
        mimeType: "application/json",
      };
    }

    // CSV format - flatten settings for each category
    const rows: string[] = ["category,key,value"];

    for (const [category, data] of Object.entries(allSettings)) {
      const flattenObject = (obj: unknown, prefix = ""): void => {
        if (obj && typeof obj === "object") {
          for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (value && typeof value === "object" && !Array.isArray(value)) {
              flattenObject(value, fullKey);
            } else {
              const escapedValue = String(value).replace(/"/g, '""');
              rows.push(`"${category}","${fullKey}","${escapedValue}"`);
            }
          }
        }
      };

      flattenObject(data);
    }

    return {
      success: true,
      data: rows.join("\n"),
      filename: `settings-export-${Date.now()}.csv`,
      mimeType: "text/csv",
    };
  } catch (error) {
    console.error("Export failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao exportar dados",
    };
  }
}

/**
 * Export templates to JSON or CSV format
 */
export async function exportTemplates(format: ExportFormat = "json"): Promise<ExportResult> {
  try {
    const templates = await listTemplates();

    if (format === "json") {
      return {
        success: true,
        data: JSON.stringify(templates, null, 2),
        filename: `templates-export-${Date.now()}.json`,
        mimeType: "application/json",
      };
    }

    // CSV format
    const rows: string[] = ["id,name,eventType,content,isActive,createdAt,updatedAt"];

    for (const template of templates) {
      const escapedContent = template.content.replace(/"/g, '""').replace(/\n/g, "\\n");
      const createdAt = template.createdAt?.toISOString() || new Date().toISOString();
      const updatedAt = template.updatedAt?.toISOString() || new Date().toISOString();
      rows.push(
        `"${template.id}","${template.name}","${template.eventType}","${escapedContent}",${template.isActive},"${createdAt}","${updatedAt}"`
      );
    }

    return {
      success: true,
      data: rows.join("\n"),
      filename: `templates-export-${Date.now()}.csv`,
      mimeType: "text/csv",
    };
  } catch (error) {
    console.error("Export templates failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao exportar templates",
    };
  }
}
