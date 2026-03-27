export type {
    ArticleSummary as Article,
    BranchSummary as Branch,
    CategorySummary as Category,
    UiMessage as Message
} from "@bon/contracts";

// Current frontend still uses legacy role names until Nest/session auth migration lands.
export type UserRole = "admin" | "user";
