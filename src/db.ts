import { D1Database } from '@cloudflare/workers-types';
import { Prompt, Tag } from './types';

// 数据库操作类
export class Database {
  constructor(private db: D1Database) {}

  // 创建新的 prompt
  async createPrompt(prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>) {
    const { prompt_text, author, category, file_url, file_type, tags } = prompt;
    
    // 开始事务
    return await this.db.prepare(`
      INSERT INTO prompts (prompt_text, author, category, file_url, file_type)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(prompt_text, author, category, file_url, file_type)
    .run()
    .then(async (result) => {
      const promptId = result.meta.last_row_id;
      
      // 如果有标签，添加标签关联
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          // 先查找或创建标签
          const tag = await this.db.prepare(`
            INSERT INTO tags (name)
            VALUES (?)
            ON CONFLICT(name) DO UPDATE SET name = name
            RETURNING id
          `)
          .bind(tagName)
          .first<{ id: number }>();

          if (tag) {
            // 创建 prompt 和 tag 的关联
            await this.db.prepare(`
              INSERT INTO prompt_tags (prompt_id, tag_id)
              VALUES (?, ?)
            `)
            .bind(promptId, tag.id)
            .run();
          }
        }
      }

      return promptId;
    });
  }

  // 获取所有 prompts
  async getPrompts() {
    return await this.db.prepare(`
      SELECT p.*, GROUP_CONCAT(t.name) as tags
      FROM prompts p
      LEFT JOIN prompt_tags pt ON p.id = pt.prompt_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();
  }

  // 获取单个 prompt
  async getPrompt(id: number) {
    return await this.db.prepare(`
      SELECT p.*, GROUP_CONCAT(t.name) as tags
      FROM prompts p
      LEFT JOIN prompt_tags pt ON p.id = pt.prompt_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.id = ?
      GROUP BY p.id
    `)
    .bind(id)
    .first();
  }

  // 更新 prompt
  async updatePrompt(id: number, prompt: Partial<Prompt>) {
    const { prompt_text, author, category, file_url, file_type, tags } = prompt;
    
    // 更新基本信息
    await this.db.prepare(`
      UPDATE prompts
      SET prompt_text = COALESCE(?, prompt_text),
          author = COALESCE(?, author),
          category = COALESCE(?, category),
          file_url = COALESCE(?, file_url),
          file_type = COALESCE(?, file_type),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(prompt_text, author, category, file_url, file_type, id)
    .run();

    // 如果提供了新的标签，更新标签关联
    if (tags) {
      // 删除旧的标签关联
      await this.db.prepare(`
        DELETE FROM prompt_tags
        WHERE prompt_id = ?
      `)
      .bind(id)
      .run();

      // 添加新的标签关联
      for (const tagName of tags) {
        const tag = await this.db.prepare(`
          INSERT INTO tags (name)
          VALUES (?)
          ON CONFLICT(name) DO UPDATE SET name = name
          RETURNING id
        `)
        .bind(tagName)
        .first<{ id: number }>();

        if (tag) {
          await this.db.prepare(`
            INSERT INTO prompt_tags (prompt_id, tag_id)
            VALUES (?, ?)
          `)
          .bind(id, tag.id)
          .run();
        }
      }
    }
  }

  // 删除 prompt
  async deletePrompt(id: number) {
    return await this.db.prepare(`
      DELETE FROM prompts
      WHERE id = ?
    `)
    .bind(id)
    .run();
  }

  // 获取所有标签
  async getTags() {
    return await this.db.prepare(`
      SELECT * FROM tags
      ORDER BY name
    `).all();
  }
} 