import dotenv from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

type EnvSource = Record<string, string | undefined>;

type NodeEnv = "development" | "test" | "production";

export type AppConfig = {
  nodeEnv: NodeEnv;
  isProduction: boolean;
  port: number;
  sessionSecret: string;
  sessionTableName: string;
  databaseUrl: string;
  openaiApiKey: string;
  openaiBaseUrl?: string;
  llmModel: string;
  summaryModel: string;
  embeddingModel: string;
  embeddingDim: number;
  ragTopK: number;
  ragMinScore: number;
  ragSummaryMinChars: number;
  ragRetrievalVersion: string;
  llmPromptCostPer1k: number;
  llmCompletionCostPer1k: number;
  s3Region?: string;
  s3Bucket?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  s3Endpoint?: string;
  s3PublicBaseUrl?: string;
  s3UploadPrefix: string;
  s3PresignExpiresSeconds: number;
  adminUsername: string;
  adminDisplayName: string;
  adminPassword?: string;
};

const DEFAULT_PORT = 4000;
const DEFAULT_EMBEDDING_DIM = 1536;
const DEFAULT_RAG_TOP_K = 5;
const DEFAULT_RAG_MIN_SCORE = 0.4;
const DEFAULT_LLM_MODEL = "gpt-5.1";
const DEFAULT_SUMMARY_MODEL = "gpt-5.1";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_RAG_SUMMARY_MIN_CHARS = 2400;
const DEFAULT_RAG_RETRIEVAL_VERSION = "v1";
const DEFAULT_SESSION_TABLE = "user_sessions";
const DEFAULT_S3_UPLOAD_PREFIX = "articles";
const DEFAULT_S3_PRESIGN_EXPIRES_SECONDS = 900;
const FORBIDDEN_SESSION_SECRETS = new Set(["", "change-me", "dev-session-secret"]);

const envCandidates = [
  resolve(__dirname, "..", "..", ".env"),
  resolve(process.cwd(), "apps/backend/.env"),
  resolve(process.cwd(), ".env")
];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

function requireNonEmptyString(value: string | undefined, key: string) {
  const normalized = value?.trim() ?? "";
  if (!normalized) {
    throw new Error(`필수 환경변수가 설정되지 않았습니다: ${key}`);
  }

  return normalized;
}

function parseNumber(value: string | undefined, key: string, fallback: number) {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`숫자 환경변수 형식이 올바르지 않습니다: ${key}`);
  }

  return parsed;
}

function parsePositiveInteger(value: string | undefined, key: string, fallback: number) {
  const parsed = parseNumber(value, key, fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`양의 정수 환경변수가 필요합니다: ${key}`);
  }

  return parsed;
}

function parseFloatInRange(
  value: string | undefined,
  key: string,
  fallback: number,
  { min, max }: { min?: number; max?: number } = {}
) {
  const parsed = parseNumber(value, key, fallback);

  if (min !== undefined && parsed < min) {
    throw new Error(`${key}는 ${min} 이상이어야 합니다.`);
  }

  if (max !== undefined && parsed > max) {
    throw new Error(`${key}는 ${max} 이하여야 합니다.`);
  }

  return parsed;
}

function parseNodeEnv(value: string | undefined): NodeEnv {
  const normalized = (value?.trim() || "development") as NodeEnv;
  if (normalized === "development" || normalized === "test" || normalized === "production") {
    return normalized;
  }

  throw new Error("NODE_ENV는 development, test, production 중 하나여야 합니다.");
}

function normalizeConfig(source: EnvSource): AppConfig {
  const nodeEnv = parseNodeEnv(source.NODE_ENV);
  const sessionSecret = requireNonEmptyString(source.SESSION_SECRET, "SESSION_SECRET");

  if (FORBIDDEN_SESSION_SECRETS.has(sessionSecret)) {
    throw new Error("SESSION_SECRET는 예시값이나 기본값이 아닌 실제 비밀값이어야 합니다.");
  }

  return {
    nodeEnv,
    isProduction: nodeEnv === "production",
    port: parsePositiveInteger(source.API_PORT ?? source.PORT, "PORT", DEFAULT_PORT),
    sessionSecret,
    sessionTableName: source.SESSION_TABLE_NAME?.trim() || DEFAULT_SESSION_TABLE,
    databaseUrl: requireNonEmptyString(source.DATABASE_URL, "DATABASE_URL"),
    openaiApiKey: requireNonEmptyString(source.OPENAI_API_KEY, "OPENAI_API_KEY"),
    openaiBaseUrl: source.OPENAI_BASE_URL?.trim() || undefined,
    llmModel: source.LLM_MODEL?.trim() || DEFAULT_LLM_MODEL,
    summaryModel: source.RAG_SUMMARY_MODEL?.trim() || DEFAULT_SUMMARY_MODEL,
    embeddingModel: source.EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL,
    embeddingDim: parsePositiveInteger(source.EMBEDDING_DIM, "EMBEDDING_DIM", DEFAULT_EMBEDDING_DIM),
    ragTopK: parsePositiveInteger(source.RAG_TOP_K, "RAG_TOP_K", DEFAULT_RAG_TOP_K),
    ragMinScore: parseFloatInRange(source.RAG_MIN_SCORE, "RAG_MIN_SCORE", DEFAULT_RAG_MIN_SCORE, {
      min: 0,
      max: 1
    }),
    ragSummaryMinChars: parsePositiveInteger(
      source.RAG_SUMMARY_MIN_CHARS,
      "RAG_SUMMARY_MIN_CHARS",
      DEFAULT_RAG_SUMMARY_MIN_CHARS
    ),
    ragRetrievalVersion: source.RAG_RETRIEVAL_VERSION?.trim() || DEFAULT_RAG_RETRIEVAL_VERSION,
    llmPromptCostPer1k: parseFloatInRange(
      source.LLM_PROMPT_COST_PER_1K,
      "LLM_PROMPT_COST_PER_1K",
      0,
      { min: 0 }
    ),
    llmCompletionCostPer1k: parseFloatInRange(
      source.LLM_COMPLETION_COST_PER_1K,
      "LLM_COMPLETION_COST_PER_1K",
      0,
      { min: 0 }
    ),
    s3Region: source.S3_REGION?.trim() || undefined,
    s3Bucket: source.S3_BUCKET?.trim() || undefined,
    s3AccessKeyId: source.S3_ACCESS_KEY_ID?.trim() || undefined,
    s3SecretAccessKey: source.S3_SECRET_ACCESS_KEY?.trim() || undefined,
    s3Endpoint: source.S3_ENDPOINT?.trim() || undefined,
    s3PublicBaseUrl: source.S3_PUBLIC_BASE_URL?.trim() || undefined,
    s3UploadPrefix: source.S3_UPLOAD_PREFIX?.trim() || DEFAULT_S3_UPLOAD_PREFIX,
    s3PresignExpiresSeconds: parsePositiveInteger(
      source.S3_PRESIGN_EXPIRES_SECONDS,
      "S3_PRESIGN_EXPIRES_SECONDS",
      DEFAULT_S3_PRESIGN_EXPIRES_SECONDS
    ),
    adminUsername: source.ADMIN_USERNAME?.trim() || "admin",
    adminDisplayName: source.ADMIN_DISPLAY_NAME?.trim() || "관리자",
    adminPassword: source.ADMIN_PASSWORD?.trim() || undefined
  };
}

export function validateEnv(config: Record<string, unknown>) {
  const source = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, value === undefined ? undefined : String(value)])
  ) as EnvSource;

  return normalizeConfig(source) as Record<string, unknown>;
}

export const appConfig = Object.freeze(normalizeConfig(process.env as EnvSource));
