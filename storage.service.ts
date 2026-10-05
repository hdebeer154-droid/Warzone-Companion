import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface StoredObject {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

/**
 * Storage abstraction. Uses S3-compatible object storage when configured,
 * otherwise transparently falls back to local disk so the app is always runnable.
 * The mobile client only ever receives URLs — never credentials.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly driver: 'local' | 's3';
  private readonly localDir: string;
  private readonly s3?: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl?: string;

  constructor(private readonly config: ConfigService) {
    this.driver = this.config.get<'local' | 's3'>('storage.driver') ?? 'local';
    this.localDir = path.resolve(process.cwd(), this.config.get<string>('storage.localDir') ?? './storage');
    this.bucket = this.config.get<string>('storage.s3.bucket') ?? 'warzone-companion';
    this.publicBaseUrl = this.config.get<string>('storage.s3.publicBaseUrl') || undefined;

    if (this.driver === 's3') {
      const endpoint = this.config.get<string>('storage.s3.endpoint');
      const region = this.config.get<string>('storage.s3.region');
      const accessKeyId = this.config.get<string>('storage.s3.accessKeyId');
      const secretAccessKey = this.config.get<string>('storage.s3.secretAccessKey');
      this.s3 = new S3Client({
        region,
        endpoint: endpoint || undefined,
        forcePathStyle: !!endpoint,
        credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
      });
      this.logger.log(`Storage driver: S3 (bucket=${this.bucket})`);
    } else {
      this.logger.log(`Storage driver: local (${this.localDir})`);
    }
  }

  private buildKey(prefix: string, filename: string): string {
    const ext = path.extname(filename) || '.bin';
    const date = new Date().toISOString().slice(0, 10);
    return `${prefix}/${date}/${randomUUID()}${ext}`;
  }

  async put(prefix: string, filename: string, data: Buffer, contentType = 'application/octet-stream'): Promise<StoredObject> {
    const key = this.buildKey(prefix, filename);
    if (this.driver === 's3' && this.s3) {
      await this.s3.send(
        new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: data, ContentType: contentType }),
      );
      return { key, url: this.publicUrl(key), size: data.length, contentType };
    }
    const dest = path.join(this.localDir, key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, data);
    return { key, url: this.publicUrl(key), size: data.length, contentType };
  }

  async get(key: string): Promise<Buffer | null> {
    if (this.driver === 's3' && this.s3) {
      try {
        const res = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
        const bytes = await res.Body!.transformToByteArray();
        return Buffer.from(bytes);
      } catch {
        return null;
      }
    }
    try {
      return await fs.readFile(path.join(this.localDir, key));
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    if (this.driver === 's3' && this.s3) {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      return;
    }
    await fs.rm(path.join(this.localDir, key), { force: true });
  }

  /** Time-limited signed URL for private objects. */
  async signedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (this.driver === 's3' && this.s3) {
      return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn });
    }
    return this.publicUrl(key);
  }

  private publicUrl(key: string): string {
    if (this.publicBaseUrl) return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    // Local driver: served by the backend static handler at /storage.
    return `/storage/${key}`;
  }
}
