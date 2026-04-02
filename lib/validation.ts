import { z } from 'zod'

// User registration validation
export const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
  role: z.enum(['viewer', 'author'])
})

// User login validation
export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(100)
})

// Post creation validation
export const postCreateSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  body: z.string().min(50).max(10000).trim(),
  status: z.enum(['published', 'draft']).default('published'),
  image_url: z.string().url().nullable().optional()
})

// Post update validation
export const postUpdateSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  body: z.string().min(50).max(10000).trim().optional(),
  image_url: z.string().url().nullable().optional(),
  status: z.enum(['published', 'draft']).optional(),
  slug: z.string().optional(),
  updated_at: z.string().optional()
})

// Comment creation validation
export const commentCreateSchema = z.object({
  post_id: z.string().uuid(),
  comment_text: z.string().min(1).max(1000).trim(),
  user_id: z.string().uuid().optional()
})

// Comment moderation validation
export const commentHideSchema = z.object({
  comment_id: z.string().uuid()
})

// Export validation functions
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error: any) {
    throw new Error(`Validation failed: ${error.message}`)
  }
}
