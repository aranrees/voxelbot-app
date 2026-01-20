import { db } from "../db";
import { botConfig } from "@shared/schema";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadInitialConfig() {
  try {
    const configPath = path.resolve(__dirname, "../../voxelbot-config-v1.json");
    const configFile = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(configFile);
    
    await db.insert(botConfig).values({
      version: config.version,
      configJson: config,
      uploadedBy: config.updatedBy,
      isActive: true
    });
    
    console.log("Initial config loaded successfully!");
    console.log(`Version: ${config.version}`);
    console.log(`Uploaded by: ${config.updatedBy}`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to load config:", error);
    process.exit(1);
  }
}

loadInitialConfig();
