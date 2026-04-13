import { Inject, Injectable } from "@nestjs/common";
import type { CreateArticleImageUploadUrlResponse } from "@bon/contracts";
import { FILE_STORAGE } from "../../infrastructure/storage/storage.constants";
import type { FileStorage } from "../../infrastructure/storage/storage.types";

@Injectable()
export class ArticleAssetService {
  constructor(@Inject(FILE_STORAGE) private readonly fileStorage: FileStorage) {}

  async createImageUploadUrl(input: {
    fileName: string;
    contentType: string;
  }): Promise<CreateArticleImageUploadUrlResponse> {
    const upload = await this.fileStorage.createPresignedUpload({
      keyPrefix: "images",
      fileName: input.fileName,
      contentType: input.contentType
    });

    return {
      object_key: upload.objectKey,
      upload_url: upload.uploadUrl,
      public_url: upload.publicUrl,
      method: upload.method,
      headers: upload.headers
    };
  }
}
