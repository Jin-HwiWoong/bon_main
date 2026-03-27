import { Injectable } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type OpenAI from "openai";
import { appConfig } from "../config";
import { OPENAI_CLIENT } from "./llm.constants";

@Injectable()
export class EmbeddingsProvider {
  constructor(@Inject(OPENAI_CLIENT) private readonly client: OpenAI) {}

  async embedText(text: string): Promise<number[]> {
    const result = await this.client.embeddings.create({
      model: appConfig.embeddingModel,
      input: text
    });

    return result.data[0].embedding as unknown as number[];
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    const result = await this.client.embeddings.create({
      model: appConfig.embeddingModel,
      input: texts
    });

    return result.data.map((item) => item.embedding as unknown as number[]);
  }
}
