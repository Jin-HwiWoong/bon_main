import { Inject, Injectable } from "@nestjs/common";
import { PG_POOL } from "../database/drizzle.constants";
import type { Pool } from "pg";
import type { RagDocument } from "../../features/chat/types";

@Injectable()
export class KnowledgeBaseVectorRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async saveArticleWithRetrieval(params: {
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
    retrievalKind: string;
    retrievalText: string;
    retrievalEmbedding: string;
    retrievalModel: string;
    retrievalVersion: string;
  }) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      let articleId = params.id;
      if (articleId === null) {
        const result = await client.query<{ id: number }>(
          `INSERT INTO kb_article (
             category_id,
             title,
             content,
             summary,
             priority,
             requires_sm,
             is_published,
             title_embedding,
             retrieval_kind,
             retrieval_text,
             retrieval_embedding,
             retrieval_model,
             retrieval_version,
             retrieval_indexed_at,
             retrieval_error
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector, $9, $10, $11::vector, $12, $13, now(), null)
           RETURNING id`,
          [
            params.input.category_id,
            params.input.title,
            params.input.content,
            params.input.summary ?? null,
            params.input.priority ?? 0,
            params.input.requires_sm ?? false,
            params.input.is_published ?? true,
            params.titleEmbedding,
            params.retrievalKind,
            params.retrievalText,
            params.retrievalEmbedding,
            params.retrievalModel,
            params.retrievalVersion
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
               retrieval_kind = $9,
               retrieval_text = $10,
               retrieval_embedding = $11::vector,
               retrieval_model = $12,
               retrieval_version = $13,
               retrieval_indexed_at = now(),
               retrieval_error = null,
               updated_at = now()
           WHERE id = $14 AND deleted_at IS NULL`,
          [
            params.input.category_id,
            params.input.title,
            params.input.content,
            params.input.summary ?? null,
            params.input.priority ?? 0,
            params.input.requires_sm ?? false,
            params.input.is_published ?? true,
            params.titleEmbedding,
            params.retrievalKind,
            params.retrievalText,
            params.retrievalEmbedding,
            params.retrievalModel,
            params.retrievalVersion,
            articleId
          ]
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

  async findTopArticlesByEmbedding(embeddingParam: string, limit: number): Promise<RagDocument[]> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `
        SELECT
          a.id AS article_id,
          category.code AS category_code,
          a.title,
          a.content,
          a.requires_sm,
          a.retrieval_kind,
          1 - (a.retrieval_embedding <=> $1::vector) AS retrieval_score,
          COALESCE(1 - (a.title_embedding <=> $1::vector), 0) AS title_score,
          ((1 - (a.retrieval_embedding <=> $1::vector)) * 0.7 + COALESCE(1 - (a.title_embedding <=> $1::vector), 0) * 0.3) AS score
        FROM kb_article a
        JOIN kb_category category ON category.id = a.category_id
        WHERE a.is_published = true
          AND a.deleted_at IS NULL
          AND a.retrieval_embedding IS NOT NULL
        ORDER BY ((1 - (a.retrieval_embedding <=> $1::vector)) * 0.7 + COALESCE(1 - (a.title_embedding <=> $1::vector), 0) * 0.3) DESC
        LIMIT $2;
        `,
        [embeddingParam, limit]
      );

      return result.rows.map((row) => ({
        article_id: row.article_id,
        category_code: row.category_code,
        title: row.title,
        requires_sm: row.requires_sm,
        content: row.content,
        retrieval_kind: row.retrieval_kind,
        score: Number(row.score),
        retrieval_score: Number(row.retrieval_score),
        title_score: Number(row.title_score)
      }));
    } finally {
      client.release();
    }
  }
}
