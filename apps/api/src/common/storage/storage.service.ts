import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { writeFile, unlink, mkdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export type StorageFolder = "images" | "videos" | "documents";

@Injectable()
export class StorageService {
  private s3: S3Client | null = null;
  private bucket: string;
  private publicUrl: string;
  private useR2: boolean;

  constructor(private config: ConfigService) {
    const accountId = this.config.get<string>("R2_ACCOUNT_ID");
    const accessKey = this.config.get<string>("R2_ACCESS_KEY_ID");
    const secretKey = this.config.get<string>("R2_SECRET_ACCESS_KEY");
    this.bucket = this.config.get<string>("R2_BUCKET_NAME", "");
    this.publicUrl = (this.config.get<string>("R2_PUBLIC_URL", "") || "").replace(
      /\/$/,
      "",
    );

    this.useR2 = !!(accountId && accessKey && secretKey && this.bucket);

    if (this.useR2) {
      this.s3 = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: accessKey!,
          secretAccessKey: secretKey!,
        },
      });
    }
  }

  isR2Enabled(): boolean {
    return this.useR2;
  }

  /**
   * Upload a file. Returns the public URL.
   * If R2 is configured, uploads to R2. Otherwise saves to local disk and returns /uploads/...
   */
  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: StorageFolder,
  ): Promise<string> {
    const ext = (originalName.split(".").pop() || "bin").toLowerCase();
    const filename = `${uuidv4()}-${Date.now()}.${ext}`;
    const key = `${folder}/${filename}`;

    if (this.useR2 && this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        }),
      );
      return `${this.publicUrl}/${key}`;
    }

    // Local storage fallback
    const uploadsDir = join(process.cwd(), "uploads", folder);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);
    return `/uploads/${folder}/${filename}`;
  }

  /**
   * Upload from a multer file. Handles both memoryStorage (buffer) and
   * diskStorage (path) transparently.
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: StorageFolder,
  ): Promise<string> {
    if (file.buffer) {
      return this.upload(file.buffer, file.originalname, file.mimetype, folder);
    }

    // File is on disk (diskStorage) - read it first
    const buffer = await readFile(file.path);
    const url = await this.upload(
      buffer,
      file.originalname,
      file.mimetype,
      folder,
    );
    // Clean up local file if we uploaded to R2 (otherwise keep it as that IS the storage)
    if (this.useR2) {
      try {
        await unlink(file.path);
      } catch {
        // ignore
      }
    }
    return url;
  }

  /**
   * Delete a file. Works for both R2 and local URLs.
   */
  async delete(url: string): Promise<void> {
    if (!url) return;

    // R2 URL
    if (this.useR2 && this.s3 && this.publicUrl && url.startsWith(this.publicUrl)) {
      const key = url.slice(this.publicUrl.length + 1); // strip prefix + leading "/"
      try {
        await this.s3.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
          }),
        );
      } catch {
        // ignore - file may already be gone
      }
      return;
    }

    // Local URL like /uploads/images/xxx.jpg
    if (url.startsWith("/uploads/")) {
      const filepath = join(process.cwd(), url);
      try {
        await unlink(filepath);
      } catch {
        // ignore - file may already be gone
      }
    }
  }
}
