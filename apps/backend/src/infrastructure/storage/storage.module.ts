import { Module } from "@nestjs/common";
import { FILE_STORAGE } from "./storage.constants";
import { S3StorageService } from "./s3-storage.service";

@Module({
  providers: [
    S3StorageService,
    {
      provide: FILE_STORAGE,
      useExisting: S3StorageService
    }
  ],
  exports: [FILE_STORAGE, S3StorageService]
})
export class StorageModule {}
