export type CreatePresignedUploadInput = {
  fileName: string;
  contentType: string;
  keyPrefix?: string;
};

export type CreatePresignedUploadResult = {
  objectKey: string;
  uploadUrl: string;
  publicUrl: string;
  method: "PUT";
  headers: Record<string, string>;
};

export interface FileStorage {
  createPresignedUpload(input: CreatePresignedUploadInput): Promise<CreatePresignedUploadResult>;
}
