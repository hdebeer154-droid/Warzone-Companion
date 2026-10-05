export interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  databaseUrl: string;
  redis: { host: string; port: number; prefix: string };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  storage: {
    driver: 'local' | 's3';
    localDir: string;
    s3: {
      endpoint?: string;
      region: string;
      bucket: string;
      accessKeyId?: string;
      secretAccessKey?: string;
      publicBaseUrl?: string;
    };
  };
  providers: {
    default: string;
    enableActivision: boolean;
  };
  ocr: { confidenceThreshold: number };
  seed: { demo: boolean; email: string; password: string };
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  databaseUrl: process.env.DATABASE_URL ?? '',
  redis: {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    prefix: process.env.QUEUE_PREFIX ?? 'wz',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '900s',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },
  storage: {
    driver: (process.env.STORAGE_DRIVER as 'local' | 's3') ?? 'local',
    localDir: process.env.STORAGE_LOCAL_DIR ?? './storage',
    s3: {
      endpoint: process.env.S3_ENDPOINT || undefined,
      region: process.env.S3_REGION ?? 'us-east-1',
      bucket: process.env.S3_BUCKET ?? 'warzone-companion',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || undefined,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || undefined,
      publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || undefined,
    },
  },
  providers: {
    default: process.env.DEFAULT_PROVIDER ?? 'mock',
    enableActivision: process.env.ENABLE_ACTIVISION_PROVIDER === 'true',
  },
  ocr: {
    confidenceThreshold: parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD ?? '0.95'),
  },
  seed: {
    demo: process.env.SEED_DEMO === 'true',
    email: process.env.DEMO_EMAIL ?? 'fenrir@warzone.gg',
    password: process.env.DEMO_PASSWORD ?? 'Fenrir#2025',
  },
});
