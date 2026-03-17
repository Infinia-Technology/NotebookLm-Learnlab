/**
 * {{APP_NAME}} Zod Validation Schemas
 *
 * These schemas mirror the backend Pydantic models for consistent validation.
 *
 * Generated: {{GENERATED_AT}}
 * Template: {{TEMPLATE_TYPE}}
 */

import { z } from 'zod';

/**
 * Status enum values
 */
export const {{MODEL_NAME}}StatusSchema = z.enum(['active', 'inactive', 'archived']);

/**
 * Schema for creating a new {{MODEL_NAME}} item
 */
export const {{MODEL_NAME}}CreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .nullable()
    .optional(),
  status: {{MODEL_NAME}}StatusSchema.default('active'),
});

/**
 * Schema for updating a {{MODEL_NAME}} item
 */
export const {{MODEL_NAME}}UpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .nullable()
    .optional(),
  status: {{MODEL_NAME}}StatusSchema.optional(),
});

/**
 * Schema for {{MODEL_NAME}} response
 */
export const {{MODEL_NAME}}ResponseSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  status: {{MODEL_NAME}}StatusSchema,
  created_by: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

/**
 * Schema for {{MODEL_NAME}} list response
 */
export const {{MODEL_NAME}}ListResponseSchema = z.object({
  items: z.array({{MODEL_NAME}}ResponseSchema),
  total: z.number(),
  skip: z.number().default(0),
  limit: z.number().default(20),
});

// Type exports inferred from schemas
export type {{MODEL_NAME}}Status = z.infer<typeof {{MODEL_NAME}}StatusSchema>;
export type {{MODEL_NAME}}Create = z.infer<typeof {{MODEL_NAME}}CreateSchema>;
export type {{MODEL_NAME}}Update = z.infer<typeof {{MODEL_NAME}}UpdateSchema>;
export type {{MODEL_NAME}}Response = z.infer<typeof {{MODEL_NAME}}ResponseSchema>;
export type {{MODEL_NAME}}ListResponse = z.infer<typeof {{MODEL_NAME}}ListResponseSchema>;
