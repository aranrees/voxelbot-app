import { db } from "../db";
import { botConfig } from "@shared/schema";
import { eq } from "drizzle-orm";

let cachedConfig: any = null;
let lastLoaded: number | null = null;

export async function loadBotConfig() {
  try {
    const results = await db
      .select()
      .from(botConfig)
      .where(eq(botConfig.isActive, true))
      .limit(1);
    
    if (results.length > 0) {
      cachedConfig = results[0].configJson;
      lastLoaded = Date.now();
      console.log(`Bot config loaded (version: ${cachedConfig.version})`);
    } else {
      console.warn("No active bot config found in database");
      cachedConfig = null;
    }
    
    return cachedConfig;
  } catch (error) {
    console.error("Error loading bot config:", error);
    return null;
  }
}

export function getBotConfig() {
  return cachedConfig;
}

export async function refreshConfig() {
  console.log("Refreshing bot config...");
  return loadBotConfig();
}

loadBotConfig();
