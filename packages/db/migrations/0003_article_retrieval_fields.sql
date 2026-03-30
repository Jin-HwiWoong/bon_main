ALTER TABLE kb_article
ADD COLUMN IF NOT EXISTS retrieval_kind VARCHAR(16),
ADD COLUMN IF NOT EXISTS retrieval_text TEXT,
ADD COLUMN IF NOT EXISTS retrieval_embedding vector({{EMBEDDING_DIM}}),
ADD COLUMN IF NOT EXISTS retrieval_model VARCHAR(120),
ADD COLUMN IF NOT EXISTS retrieval_version VARCHAR(32),
ADD COLUMN IF NOT EXISTS retrieval_indexed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS retrieval_error TEXT;

CREATE INDEX IF NOT EXISTS idx_kb_article_retrieval_kind ON kb_article (retrieval_kind);
