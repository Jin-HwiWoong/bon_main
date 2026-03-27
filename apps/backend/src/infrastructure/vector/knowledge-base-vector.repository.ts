import { Inject, Injectable } from "@nestjs/common";
import { PG_POOL } from "../database/drizzle.constants";
import type { Pool } from "pg";
import type { RagChunk } from "../../features/chat/types";

@Injectable()
export class KnowledgeBaseVectorRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async saveArticleWithChunks(params: {
    id: number | null;
    input: {
      category_id: number;
      title: string;
      content: string;
      summary?: string | null;
      priority?: number;
      requires_sm?: boolean;
      is_published?: boolean;
    };
    titleEmbedding: string;
    chunks: string[];
    chunkVectors: string[];
    categoryCode: string;
  }) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      let articleId = params.id;
      if (articleId === null) {
        const result = await client.query<{ id: number }>(
          `INSERT INTO kb_article (category_id, title, content, summary, priority, requires_sm, is_published, title_embedding)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector)
           RETURNING id`,
          [
            params.input.category_id,
            params.input.title,
            params.input.content,
            params.input.summary ?? null,
            params.input.priority ?? 0,
            params.input.requires_sm ?? false,
            params.input.is_published ?? true,
            params.titleEmbedding
          ]
        );
        articleId = result.rows[0].id;
      } else {
        await client.query(
          `UPDATE kb_article
           SET category_id = $1,
               title = $2,
               content = $3,
               summary = $4,
               priority = $5,
               requires_sm = $6,
               is_published = $7,
               title_embedding = $8::vector,
               updated_at = now()
           WHERE id = $9 AND deleted_at IS NULL`,
          [
            params.input.category_id,
            params.input.title,
            params.input.content,
            params.input.summary ?? null,
            params.input.priority ?? 0,
            params.input.requires_sm ?? false,
            params.input.is_published ?? true,
            params.titleEmbedding,
            articleId
          ]
        );
        await client.query("DELETE FROM kb_chunk WHERE article_id = $1", [articleId]);
      }

      if (params.chunks.length > 0) {
        const values: Array<number | string> = [];
        const placeholders: string[] = [];

        params.chunks.forEach((content, index) => {
          const vectorIndex = values.length;
          values.push(articleId!, content, params.chunkVectors[index], index, params.categoryCode);
          placeholders.push(
            `($${vectorIndex + 1}, $${vectorIndex + 2}, $${vectorIndex + 3}::vector, $${vectorIndex + 4}, $${
              vectorIndex + 5
            })`
          );
        });

        await client.query(
          `INSERT INTO kb_chunk (article_id, content, embedding, chunk_index, category_code)
           VALUES ${placeholders.join(", ")}`,
          values
        );
      }

      await client.query("COMMIT");

      return { id: articleId! };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findTopChunksByEmbedding(embeddingParam: string, limit: number): Promise<RagChunk[]> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `
        SELECT
          c.id AS chunk_id,
          c.article_id,
          c.category_code,
          c.content,
          a.title,
          a.requires_sm,
          1 - (c.embedding <=> $1::vector) AS chunk_score,
          COALESCE(1 - (a.title_embedding <=> $1::vector), 0) AS title_score,
          ((1 - (c.embedding <=> $1::vector)) * 0.4 + COALESCE(1 - (a.title_embedding <=> $1::vector), 0) * 0.6) AS score
        FROM kb_chunk c
        JOIN kb_article a ON a.id = c.article_id
        WHERE a.is_published = true
          AND a.deleted_at IS NULL
        ORDER BY ((1 - (c.embedding <=> $1::vector)) * 0.4 + COALESCE(1 - (a.title_embedding <=> $1::vector), 0) * 0.6) DESC
        LIMIT $2;
        `,
        [embeddingParam, limit]
      );

      return result.rows.map((row) => ({
        chunk_id: row.chunk_id,
        article_id: row.article_id,
        category_code: row.category_code,
        title: row.title,
        requires_sm: row.requires_sm,
        content: row.content,
        score: Number(row.score),
        chunk_score: Number(row.chunk_score),
        title_score: Number(row.title_score)
      }));
    } finally {
      client.release();
    }
  }
}
