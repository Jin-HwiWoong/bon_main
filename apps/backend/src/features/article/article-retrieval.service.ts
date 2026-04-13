import { Inject, Injectable } from "@nestjs/common";
import { appConfig } from "../../config";
import { ChatCompletionProvider } from "../../llm/chat-completion.provider";
import { EmbeddingsProvider } from "../../llm/embeddings.provider";
import { toPgVector } from "../../utils/pgvector";
import {
  buildArticleRetrievalSummaryMessages,
  normalizeRetrievalText,
  type RetrievalKind
} from "./retrieval-text";

@Injectable()
export class ArticleRetrievalService {
  constructor(
    @Inject(ChatCompletionProvider) private readonly chatCompletionProvider: ChatCompletionProvider,
    @Inject(EmbeddingsProvider) private readonly embeddingsProvider: EmbeddingsProvider
  ) {}

  async build(params: {
    title: string;
    content: string;
    categoryCode: string;
  }): Promise<{
    retrievalKind: RetrievalKind;
    retrievalText: string;
    retrievalEmbedding: string;
    retrievalModel: string;
    retrievalVersion: string;
  }> {
    const normalizedContent = normalizeRetrievalText(params.content);
    const retrievalKind: RetrievalKind =
      normalizedContent.length >= appConfig.ragSummaryMinChars ? "summary" : "raw";

    const retrievalText =
      retrievalKind === "summary" ? await this.buildSummaryText(params) : normalizedContent;

    const retrievalEmbedding = toPgVector(await this.embeddingsProvider.embedText(retrievalText));

    return {
      retrievalKind,
      retrievalText,
      retrievalEmbedding,
      retrievalModel: retrievalKind === "summary" ? appConfig.summaryModel : "raw",
      retrievalVersion: appConfig.ragRetrievalVersion
    };
  }

  private async buildSummaryText(params: {
    title: string;
    content: string;
    categoryCode: string;
  }) {
    const { text } = await this.chatCompletionProvider.complete(
      buildArticleRetrievalSummaryMessages(params),
      { model: appConfig.summaryModel }
    );
    const summaryText = normalizeRetrievalText(text);
    if (!summaryText) {
      throw new Error("요약 결과가 비어 있습니다.");
    }

    return summaryText;
  }
}
