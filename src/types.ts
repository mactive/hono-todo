import { z } from 'zod';
import { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { Database } from './db';

// Prompt 相关的类型定义
export const PromptSchema = z.object({
  prompt_text: z.string().min(1),
  author: z.string().min(1),
  category: z.string().min(1),
  file_url: z.string().optional(),
  file_type: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type Prompt = z.infer<typeof PromptSchema> & {
  id: number;
  created_at: string;
  updated_at: string;
};

// Tag 相关的类型定义
export const TagSchema = z.object({
  name: z.string().min(1),
});

export type Tag = z.infer<typeof TagSchema> & {
  id: number;
};

// Hono 环境变量类型
export type Bindings = {
  MY_NAME: string;
  MY_VAR: string;
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
};

// Hono 变量类型
export type Variables = {
  db: Database;
}; 