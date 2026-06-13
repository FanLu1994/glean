// src/db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import * as schema from "./schema";

// Set up global proxy for Node.js fetch (undici) when HTTP_PROXY is present
const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
}

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });
