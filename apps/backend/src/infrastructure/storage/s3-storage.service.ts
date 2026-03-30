import { randomUUID } from "crypto";
import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { appConfig } from "../../config";
import type { CreatePresignedUploadInput, CreatePresignedUploadResult, FileStorage } from "./storage.types";

const IMAGE_CONTENT_TYPES = new Set([
  "image/apng",
  "image/avif",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/svg+xml",
  "image/webp"
]);

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  "image/apng": "apng",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/webp": "webp"
};

@Injectable()
export class S3StorageService implements FileStorage {
  private client: S3Client | null = null;

  async createPresignedUpload(input: CreatePresignedUploadInput): Promise<CreatePresignedUploadResult> {
    this.assertConfigured();

    const contentType = input.contentType.trim().toLowerCase();
    if (!IMAGE_CONTENT_TYPES.has(contentType)) {
      throw new BadRequestException("지원하지 않는 이미지 형식입니다.");
    }

    const objectKey = this.buildObjectKey(input.keyPrefix, input.fileName, contentType);
    const command = new PutObjectCommand({
      Bucket: appConfig.s3Bucket,
      Key: objectKey,
      ContentType: contentType
    });
    const uploadUrl = await getSignedUrl(this.getClient(), command, {
      expiresIn: appConfig.s3PresignExpiresSeconds
    });

    return {
      objectKey,
      uploadUrl,
      publicUrl: this.buildPublicUrl(objectKey),
      method: "PUT",
      headers: {
        "Content-Type": contentType
      }
    };
  }

  private getClient() {
    if (!this.client) {
      this.client = new S3Client({
        region: appConfig.s3Region,
        endpoint: appConfig.s3Endpoint,
        credentials:
          appConfig.s3AccessKeyId && appConfig.s3SecretAccessKey
            ? {
                accessKeyId: appConfig.s3AccessKeyId,
                secretAccessKey: appConfig.s3SecretAccessKey
              }
            : undefined
      });
    }

    return this.client;
  }

  private assertConfigured() {
    if (!appConfig.s3Bucket || !appConfig.s3Region) {
      throw new InternalServerErrorException("S3 업로드 설정이 완료되지 않았습니다.");
    }
  }

  private buildObjectKey(keyPrefix: string | undefined, fileName: string, contentType: string) {
    const prefix = [appConfig.s3UploadPrefix, keyPrefix]
      .map((value) => value?.trim().replace(/^\/+|\/+$/g, ""))
      .filter((value): value is string => Boolean(value))
      .join("/");
    const extension = this.resolveExtension(fileName, contentType);
    const now = new Date();
    const datePath = [
      now.getUTCFullYear(),
      String(now.getUTCMonth() + 1).padStart(2, "0"),
      String(now.getUTCDate()).padStart(2, "0")
    ].join("/");

    return `${prefix}/${datePath}/${randomUUID()}.${extension}`;
  }

  private resolveExtension(fileName: string, contentType: string) {
    const trimmed = fileName.trim();
    const extension = trimmed.includes(".") ? trimmed.split(".").pop()?.toLowerCase() ?? "" : "";
    const safeExtension = extension.replace(/[^a-z0-9]/g, "");
    if (safeExtension) {
      return safeExtension;
    }

    const fallback = CONTENT_TYPE_EXTENSIONS[contentType];
    if (!fallback) {
      throw new BadRequestException("파일 확장자를 확인할 수 없습니다.");
    }

    return fallback;
  }

  private buildPublicUrl(objectKey: string) {
    const baseUrl = appConfig.s3PublicBaseUrl?.trim();
    if (baseUrl) {
      return this.joinUrl(baseUrl, objectKey);
    }

    if (appConfig.s3Endpoint) {
      return this.joinUrl(`${appConfig.s3Endpoint.replace(/\/+$/g, "")}/${appConfig.s3Bucket}`, objectKey);
    }

    return this.joinUrl(`https://${appConfig.s3Bucket}.s3.${appConfig.s3Region}.amazonaws.com`, objectKey);
  }

  private joinUrl(baseUrl: string, objectKey: string) {
    const encodedPath = objectKey
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    return `${baseUrl.replace(/\/+$/g, "")}/${encodedPath}`;
  }
}
