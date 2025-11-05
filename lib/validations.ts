/**
 * Schemas de validación con Zod
 * Validaciones reutilizables para formularios y datos
 */

import { z } from 'zod';

/**
 * Validación para nombres de servicio (Suite/N8N)
 */
export const serviceNameSchema = z
  .string()
  .min(3, 'El nombre debe tener al menos 3 caracteres')
  .max(50, 'El nombre no puede exceder 50 caracteres')
  .regex(
    /^[a-z0-9-]+$/,
    'Solo se permiten letras minúsculas, números y guiones'
  )
  .refine(
    (val) => !val.startsWith('-') && !val.endsWith('-'),
    'No puede empezar ni terminar con guión'
  );

/**
 * Validación para crear instancia de Suite
 */
export const createSuiteInstanceSchema = z.object({
  service_name: serviceNameSchema,
  plan: z.enum(['free', 'basic', 'premium', 'pro'], {
    errorMap: () => ({ message: 'Debes seleccionar un plan válido' }),
  }),
});

export type CreateSuiteInstanceInput = z.infer<typeof createSuiteInstanceSchema>;

/**
 * Validación para webhook URL
 */
export const webhookUrlSchema = z
  .string()
  .url('Debe ser una URL válida')
  .startsWith('http', 'La URL debe comenzar con http:// o https://')
  .optional()
  .or(z.literal(''));

/**
 * Validación para configuración de instancia WhatsApp
 */
export const whatsappInstanceConfigSchema = z.object({
  webhook_url: webhookUrlSchema,
  is_active: z.boolean().default(true),
});

export type WhatsAppInstanceConfigInput = z.infer<typeof whatsappInstanceConfigSchema>;

/**
 * Validación para envío de mensajes
 */
export const sendMessageSchema = z.object({
  to: z
    .string()
    .min(10, 'Número de teléfono inválido')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de número inválido (E.164)'),
  message: z
    .string()
    .min(1, 'El mensaje no puede estar vacío')
    .max(4096, 'El mensaje no puede exceder 4096 caracteres'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

/**
 * Validación para respuestas rápidas
 */
export const quickReplySchema = z.object({
  shortcut: z
    .string()
    .min(2, 'El atajo debe tener al menos 2 caracteres')
    .max(20, 'El atajo no puede exceder 20 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Solo letras minúsculas, números y guiones bajos'),
  message: z
    .string()
    .min(1, 'El mensaje no puede estar vacío')
    .max(1000, 'El mensaje no puede exceder 1000 caracteres'),
});

export type QuickReplyInput = z.infer<typeof quickReplySchema>;

/**
 * Validación para etiquetas de chat
 */
export const chatLabelSchema = z.object({
  label: z
    .string()
    .min(2, 'La etiqueta debe tener al menos 2 caracteres')
    .max(30, 'La etiqueta no puede exceder 30 caracteres'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (formato: #RRGGBB)'),
});

export type ChatLabelInput = z.infer<typeof chatLabelSchema>;

/**
 * Validación para búsqueda de mensajes
 */
export const messageSearchSchema = z.object({
  query: z.string().optional(),
  type: z
    .enum(['all', 'text', 'sticker', 'audio', 'video', 'image', 'document'])
    .default('all'),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  instanceId: z.string().optional(),
});

export type MessageSearchInput = z.infer<typeof messageSearchSchema>;

/**
 * Helper para validar datos y mostrar errores
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });

  return { success: false, errors };
}

/**
 * Hook para validación en tiempo real
 */
export function useValidation<T>(schema: z.ZodSchema<T>) {
  return {
    validate: (data: unknown) => validateData(schema, data),
    validateField: (fieldName: string, value: unknown) => {
      try {
        // @ts-ignore
        const fieldSchema = schema.shape[fieldName];
        if (!fieldSchema) return { success: true };

        const result = fieldSchema.safeParse(value);
        if (result.success) {
          return { success: true };
        }

        return {
          success: false,
          error: result.error.errors[0]?.message || 'Error de validación',
        };
      } catch {
        return { success: true };
      }
    },
  };
}
