import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar
} from "drizzle-orm/pg-core";

const VECTOR_DIMENSION = 1536;

const vector = customType<{ data: string; config: { dimensions: number } }>({
  dataType(config) {
    const dimensions = config?.dimensions ?? VECTOR_DIMENSION;
    return `vector(${dimensions})`;
  }
});

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const admins = pgTable(
  "admins",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    username: varchar("username", { length: 120 }).notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt,
    updatedAt
  },
  (table) => ({
    usernameUniqueIdx: uniqueIndex("admins_username_unique").on(table.username)
  })
);

export const branches = pgTable(
  "branches",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    code: varchar("code", { length: 64 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt,
    updatedAt
  },
  (table) => ({
    codeUniqueIdx: uniqueIndex("branches_code_unique").on(table.code),
    nameUniqueIdx: uniqueIndex("branches_name_unique").on(table.name)
  })
);

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    branchId: bigint("branch_id", { mode: "number" })
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt,
    updatedAt
  },
  (table) => ({
    branchIdIdx: index("chat_sessions_branch_id_idx").on(table.branchId),
    lastMessageAtIdx: index("chat_sessions_last_message_at_idx").on(table.lastMessageAt)
  })
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    sessionId: bigint("session_id", { mode: "number" })
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 16 }).notNull(),
    content: text("content").notNull(),
    references: jsonb("references").$type<
      Array<{
        articleId: number;
        categoryCode: string;
        title?: string;
      }>
    >(),
    fallbackToSm: boolean("fallback_to_sm"),
    createdAt
  },
  (table) => ({
    sessionIdIdx: index("chat_messages_session_id_idx").on(table.sessionId),
    roleIdx: index("chat_messages_role_idx").on(table.role)
  })
);

export const categories = pgTable(
  "kb_category",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    code: varchar("code", { length: 64 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt,
    updatedAt
  },
  (table) => ({
    codeUniqueIdx: uniqueIndex("kb_category_code_unique").on(table.code),
    deletedAtIdx: index("idx_kb_category_deleted_at").on(table.deletedAt)
  })
);

export const articles = pgTable(
  "kb_article",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    categoryId: bigint("category_id", { mode: "number" })
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    summary: text("summary"),
    priority: integer("priority").notNull().default(0),
    requiresSm: boolean("requires_sm").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(true),
    titleEmbedding: vector("title_embedding", { dimensions: VECTOR_DIMENSION }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt,
    updatedAt
  },
  (table) => ({
    categoryIdIdx: index("idx_kb_article_category").on(table.categoryId),
    publishedIdx: index("idx_kb_article_published").on(table.isPublished),
    deletedAtIdx: index("idx_kb_article_deleted_at").on(table.deletedAt)
  })
);

export const chunks = pgTable(
  "kb_chunk",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    articleId: bigint("article_id", { mode: "number" })
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    categoryCode: varchar("category_code", { length: 64 }).notNull(),
    embedding: vector("embedding", { dimensions: VECTOR_DIMENSION }).notNull(),
    createdAt
  },
  (table) => ({
    articleIdIdx: index("idx_kb_chunk_article").on(table.articleId),
    categoryCodeIdx: index("idx_kb_chunk_category").on(table.categoryCode)
  })
);

export const branchesRelations = relations(branches, ({ many }) => ({
  chatSessions: many(chatSessions)
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  branch: one(branches, {
    fields: [chatSessions.branchId],
    references: [branches.id]
  }),
  messages: many(chatMessages)
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id]
  })
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articles)
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id]
  }),
  chunks: many(chunks)
}));

export const chunksRelations = relations(chunks, ({ one }) => ({
  article: one(articles, {
    fields: [chunks.articleId],
    references: [articles.id]
  })
}));

export const schema = {
  admins,
  branches,
  chatSessions,
  chatMessages,
  categories,
  articles,
  chunks
};
