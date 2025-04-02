/// <reference types="@cloudflare/workers-types" />

interface Env {
  WEMAKE_BUCKET: R2Bucket;
  DB: D1Database;
}
