"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = exports.chunksRelations = exports.articlesRelations = exports.categoriesRelations = exports.chatMessagesRelations = exports.chatSessionsRelations = exports.branchesRelations = exports.chunks = exports.articles = exports.categories = exports.chatMessages = exports.chatSessions = exports.branches = exports.admins = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const VECTOR_DIMENSION = 1536;
const vector = (0, pg_core_1.customType)({
    dataType(config) {
        const dimensions = config?.dimensions ?? VECTOR_DIMENSION;
        return `vector(${dimensions})`;
    }
});
const createdAt = (0, pg_core_1.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = (0, pg_core_1.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow();
exports.admins = (0, pg_core_1.pgTable)("admins", {
    id: (0, pg_core_1.bigint)("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    username: (0, pg_core_1.varchar)("username", { length: 120 }).notNull(),
    displayName: (0, pg_core_1.varchar)("display_name", { length: 120 }).notNull(),
    passwordHash: (0, pg_core_1.text)("password_hash").notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").notNull().default(true),
    createdAt,
    updatedAt
}, (table) => ({
    usernameUniqueIdx: (0, pg_core_1.uniqueIndex)("admins_username_unique").on(table.username)
}));
exports.branches = (0, pg_core_1.pgTable)("branches", {
    id: (0, pg_core_1.bigint)("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    code: (0, pg_core_1.varchar)("code", { length: 64 }).notNull(),
    name: (0, pg_core_1.varchar)("name", { length: 120 }).notNull(),
    passwordHash: (0, pg_core_1.text)("password_hash").notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").notNull().default(true),
    lastLoginAt: (0, pg_core_1.timestamp)("last_login_at", { withTimezone: true }),
    createdAt,
    updatedAt
}, (table) => ({
    codeUniqueIdx: (0, pg_core_1.uniqueIndex)("branches_code_unique").on(table.code),
    nameIdx: (0, pg_core_1.index)("branches_name_idx").on(table.name)
}));
exports.chatSessions = (0, pg_core_1.pgTable)("chat_sessions", {
    id: (0, pg_core_1.bigint)("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    branchId: (0, pg_core_1.bigint)("branch_id", { mode: "number" })
        .notNull()
        .references(() => exports.branches.id, { onDelete: "cascade" }),
    title: (0, pg_core_1.varchar)("title", { length: 200 }),
    status: (0, pg_core_1.varchar)("status", { length: 32 }).notNull().default("active"),
    lastMessageAt: (0, pg_core_1.timestamp)("last_message_at", { withTimezone: true }),
    createdAt,
    updatedAt
}, (table) => ({
    branchIdIdx: (0, pg_core_1.index)("chat_sessions_branch_id_idx").on(table.branchId),
    lastMessageAtIdx: (0, pg_core_1.index)("chat_sessions_last_message_at_idx").on(table.lastMessageAt)
}));
exports.chatMessages = (0, pg_core_1.pgTable)("chat_messages", {
    id: (0, pg_core_1.bigint)("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    sessionId: (0, pg_core_1.bigint)("session_id", { mode: "number" })
        .notNull()
        .references(() => exports.chatSessions.id, { onDelete: "cascade" }),
    role: (0, pg_core_1.varchar)("role", { length: 16 }).notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    references: (0, pg_core_1.jsonb)("references").$type(),
    fallbackToSm: (0, pg_core_1.boolean)("fallback_to_sm"),
    createdAt
}, (table) => ({
    sessionIdIdx: (0, pg_core_1.index)("chat_messages_session_id_idx").on(table.sessionId),
    roleIdx: (0, pg_core_1.index)("chat_messages_role_idx").on(table.role)
}));
exports.categories = (0, pg_core_1.pgTable)("kb_category", {
    id: (0, pg_core_1.bigint)("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    code: (0, pg_core_1.varchar)("code", { length: 64 }).notNull(),
    name: (0, pg_core_1.varchar)("name", { length: 120 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    sortOrder: (0, pg_core_1.integer)("sort_order").notNull().default(0),
    isActive: (0, pg_core_1.boolean)("is_active").notNull().default(true),
    deletedAt: (0, pg_core_1.timestamp)("deleted_at", { withTimezone: true }),
    createdAt,
    updatedAt
}, (table) => ({
    codeUniqueIdx: (0, pg_core_1.uniqueIndex)("kb_category_code_unique").on(table.code),
    deletedAtIdx: (0, pg_core_1.index)("idx_kb_category_deleted_at").on(table.deletedAt)
}));
exports.articles = (0, pg_core_1.pgTable)("kb_article", {
    id: (0, pg_core_1.bigint)("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    categoryId: (0, pg_core_1.bigint)("category_id", { mode: "number" })
        .notNull()
        .references(() => exports.categories.id, { onDelete: "restrict" }),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    summary: (0, pg_core_1.text)("summary"),
    priority: (0, pg_core_1.integer)("priority").notNull().default(0),
    requiresSm: (0, pg_core_1.boolean)("requires_sm").notNull().default(false),
    isPublished: (0, pg_core_1.boolean)("is_published").notNull().default(true),
    titleEmbedding: vector("title_embedding", { dimensions: VECTOR_DIMENSION }),
    deletedAt: (0, pg_core_1.timestamp)("deleted_at", { withTimezone: true }),
    createdAt,
    updatedAt
}, (table) => ({
    categoryIdIdx: (0, pg_core_1.index)("idx_kb_article_category").on(table.categoryId),
    publishedIdx: (0, pg_core_1.index)("idx_kb_article_published").on(table.isPublished),
    deletedAtIdx: (0, pg_core_1.index)("idx_kb_article_deleted_at").on(table.deletedAt)
}));
exports.chunks = (0, pg_core_1.pgTable)("kb_chunk", {
    id: (0, pg_core_1.bigint)("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    articleId: (0, pg_core_1.bigint)("article_id", { mode: "number" })
        .notNull()
        .references(() => exports.articles.id, { onDelete: "cascade" }),
    content: (0, pg_core_1.text)("content").notNull(),
    chunkIndex: (0, pg_core_1.integer)("chunk_index").notNull(),
    categoryCode: (0, pg_core_1.varchar)("category_code", { length: 64 }).notNull(),
    embedding: vector("embedding", { dimensions: VECTOR_DIMENSION }).notNull(),
    createdAt
}, (table) => ({
    articleIdIdx: (0, pg_core_1.index)("idx_kb_chunk_article").on(table.articleId),
    categoryCodeIdx: (0, pg_core_1.index)("idx_kb_chunk_category").on(table.categoryCode)
}));
exports.branchesRelations = (0, drizzle_orm_1.relations)(exports.branches, ({ many }) => ({
    chatSessions: many(exports.chatSessions)
}));
exports.chatSessionsRelations = (0, drizzle_orm_1.relations)(exports.chatSessions, ({ one, many }) => ({
    branch: one(exports.branches, {
        fields: [exports.chatSessions.branchId],
        references: [exports.branches.id]
    }),
    messages: many(exports.chatMessages)
}));
exports.chatMessagesRelations = (0, drizzle_orm_1.relations)(exports.chatMessages, ({ one }) => ({
    session: one(exports.chatSessions, {
        fields: [exports.chatMessages.sessionId],
        references: [exports.chatSessions.id]
    })
}));
exports.categoriesRelations = (0, drizzle_orm_1.relations)(exports.categories, ({ many }) => ({
    articles: many(exports.articles)
}));
exports.articlesRelations = (0, drizzle_orm_1.relations)(exports.articles, ({ one, many }) => ({
    category: one(exports.categories, {
        fields: [exports.articles.categoryId],
        references: [exports.categories.id]
    }),
    chunks: many(exports.chunks)
}));
exports.chunksRelations = (0, drizzle_orm_1.relations)(exports.chunks, ({ one }) => ({
    article: one(exports.articles, {
        fields: [exports.chunks.articleId],
        references: [exports.articles.id]
    })
}));
exports.schema = {
    admins: exports.admins,
    branches: exports.branches,
    chatSessions: exports.chatSessions,
    chatMessages: exports.chatMessages,
    categories: exports.categories,
    articles: exports.articles,
    chunks: exports.chunks
};
