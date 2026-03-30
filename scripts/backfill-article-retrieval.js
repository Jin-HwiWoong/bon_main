const path = require("path");
const { Pool } = require("pg");
const OpenAI = require("openai");

require("dotenv").config({ path: path.join(__dirname, "..", "apps", "backend", ".env") });
require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL;
const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiBaseUrl = process.env.OPENAI_BASE_URL;
const embeddingModel = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
const summaryModel = process.env.RAG_SUMMARY_MODEL || "gpt-5.1";
const summaryMinChars = Number(process.env.RAG_SUMMARY_MIN_CHARS || "2400");
const retrievalVersion = process.env.RAG_RETRIEVAL_VERSION || "v1";

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

if (!openaiApiKey) {
  throw new Error("OPENAI_API_KEY is required.");
}

if (!Number.isInteger(summaryMinChars) || summaryMinChars <= 0) {
  throw new Error("RAG_SUMMARY_MIN_CHARS must be a positive integer.");
}

const pool = new Pool({ connectionString: databaseUrl });
const openai = new OpenAI({
  apiKey: openaiApiKey,
  baseURL: openaiBaseUrl || undefined
});

function normalizeText(text) {
  return text.trim();
}

function toPgVector(values) {
  return `[${values.join(",")}]`;
}

function buildSummaryMessages(article) {
  return [
    {
      role: "system",
      content: `너는 사내 규정 검색 인덱스를 만드는 요약기다.
- 답변용 요약이 아니라 검색용 요약을 만든다.
- 원문에 없는 내용은 절대 추가하지 않는다.
- 금지사항, 허용 조건, 예외, 절차, 대상, 수치가 있으면 우선 보존한다.
- 핵심 명사와 정책 용어를 유지한다.
- 결과는 400~1200자 사이의 한국어 텍스트로 작성한다.
- 장황한 도입/결론 없이 바로 내용만 정리한다.
- 아래 형식을 최대한 유지한다.
제목: ...
카테고리: ...
적용대상: ...
핵심규정: ...
금지사항: ...
예외: ...
절차: ...
주의사항: ...`
    },
    {
      role: "user",
      content: `문서 제목: ${article.title}
카테고리 코드: ${article.category_code}

문서 원문:
${article.content}`
    }
  ];
}

async function buildRetrievalRecord(article) {
  const normalizedContent = normalizeText(article.content);
  const retrievalKind = normalizedContent.length >= summaryMinChars ? "summary" : "raw";
  const retrievalText =
    retrievalKind === "summary" ? await summarizeArticle(article) : normalizedContent;
  const embedding = await openai.embeddings.create({
    model: embeddingModel,
    input: retrievalText
  });

  return {
    retrievalKind,
    retrievalText,
    retrievalEmbedding: toPgVector(embedding.data[0].embedding),
    retrievalModel: retrievalKind === "summary" ? summaryModel : "raw"
  };
}

async function summarizeArticle(article) {
  const response = await openai.chat.completions.create({
    model: summaryModel,
    messages: buildSummaryMessages(article)
  });
  const summaryText = normalizeText(response.choices[0]?.message?.content || "");
  if (!summaryText) {
    throw new Error("요약 결과가 비어 있습니다.");
  }

  return summaryText;
}

async function fetchArticles(client) {
  const { rows } = await client.query(`
    SELECT
      a.id,
      a.title,
      a.content,
      category.code AS category_code
    FROM kb_article a
    JOIN kb_category category ON category.id = a.category_id
    WHERE a.deleted_at IS NULL
    ORDER BY a.id ASC
  `);
  return rows;
}

async function updateArticleRetrieval(client, articleId, record) {
  await client.query(
    `
    UPDATE kb_article
    SET retrieval_kind = $1,
        retrieval_text = $2,
        retrieval_embedding = $3::vector,
        retrieval_model = $4,
        retrieval_version = $5,
        retrieval_indexed_at = now(),
        retrieval_error = null,
        updated_at = now()
    WHERE id = $6
    `,
    [
      record.retrievalKind,
      record.retrievalText,
      record.retrievalEmbedding,
      record.retrievalModel,
      retrievalVersion,
      articleId
    ]
  );
}

async function markError(client, articleId, error) {
  await client.query(
    `
    UPDATE kb_article
    SET retrieval_error = $1,
        updated_at = now()
    WHERE id = $2
    `,
    [String(error instanceof Error ? error.message : error), articleId]
  );
}

async function main() {
  const client = await pool.connect();
  try {
    const articles = await fetchArticles(client);
    console.log(`Found ${articles.length} articles to backfill.`);

    for (const article of articles) {
      process.stdout.write(`Backfilling article ${article.id}... `);
      try {
        const record = await buildRetrievalRecord(article);
        await updateArticleRetrieval(client, article.id, record);
        console.log("ok");
      } catch (error) {
        await markError(client, article.id, error);
        console.log("failed");
        console.error(error);
      }
    }
  } finally {
    client.release();
  }
}

main()
  .then(() => {
    console.log("Article retrieval backfill completed.");
  })
  .catch((error) => {
    console.error("Article retrieval backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    pool.end();
  });
