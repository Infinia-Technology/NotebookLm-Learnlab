/**
 * {{APP_NAME}} TypeScript Types
 *
 * Generated: {{GENERATED_AT}}
 * Template: {{TEMPLATE_TYPE}}
 */

/**
 * {{MODEL_NAME}} item status
 */
export type {{MODEL_NAME}}Status = 'active' | 'inactive' | 'archived';

/**
 * {{MODEL_NAME}} item
 */
export interface {{MODEL_NAME}} {
  uuid: string;
  name: string;
  description?: string | null;
  status: {{MODEL_NAME}}Status;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Request to create a new {{MODEL_NAME}} item
 */
export interface {{MODEL_NAME}}Create {
  name: string;
  description?: string;
  status?: {{MODEL_NAME}}Status;
}

/**
 * Request to update a {{MODEL_NAME}} item
 */
export interface {{MODEL_NAME}}Update {
  name?: string;
  description?: string;
  status?: {{MODEL_NAME}}Status;
}

/**
 * {{MODEL_NAME}} list response
 */
export interface {{MODEL_NAME}}ListResponse {
  items: {{MODEL_NAME}}[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * Generic message response
 */
export interface MessageResponse {
  message: string;
}
