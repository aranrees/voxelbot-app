import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  preferredDate: text("preferred_date").notNull(),
  preferredTime: text("preferred_time").notNull(),
  message: text("message"),
  status: text("status").default("pending").notNull(), // 'pending' | 'confirmed' | 'cancelled'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'product' | 'instruction' | 'faq' | 'other'
  fileType: text("file_type").default("text").notNull(), // "text", "pdf"
  filePath: text("file_path"), // for uploaded PDF files
  tags: text("tags").array(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiInstructions = pgTable("ai_instructions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  instruction: text("instruction").notNull(),
  category: text("category").default("general").notNull(), // 'general' | 'tone' | 'behavior' | 'knowledge' | 'restrictions'
  priority: integer("priority").default(1).notNull(), // 1-10, higher priority instructions are more important
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quickActions = pgTable("quick_actions", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  message: text("message").notNull(),
  order: integer("order").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "17:00"
  isAvailable: boolean("is_available").default(true).notNull(),
  note: text("note"), // optional note about availability
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const standardResponses = pgTable("standard_responses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  questionType: text("question_type").notNull(), // 'pricing' | 'support' | 'scheduling' | 'general' | 'other'
  response: text("response").notNull(),
  keywords: text("keywords").array(), // keywords that trigger this response
  isActive: boolean("is_active").default(true).notNull(),
  priority: integer("priority").default(1).notNull(), // 1-10, higher priority responses are preferred
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiInstructionSchema = createInsertSchema(aiInstructions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuickActionSchema = createInsertSchema(quickActions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStandardResponseSchema = createInsertSchema(standardResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type AiInstruction = typeof aiInstructions.$inferSelect;
export type InsertAiInstruction = z.infer<typeof insertAiInstructionSchema>;
export type QuickAction = typeof quickActions.$inferSelect;
export type InsertQuickAction = z.infer<typeof insertQuickActionSchema>;
export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type StandardResponse = typeof standardResponses.$inferSelect;
export type InsertStandardResponse = z.infer<typeof insertStandardResponseSchema>;

// File assets for client downloads
export const fileAssets = pgTable("file_assets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(), // pdf, image, etc.
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  downloadCount: integer("download_count").default(0),
  isPublic: boolean("is_public").default(true),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFileAssetSchema = createInsertSchema(fileAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const completedChats = pgTable("completed_chats", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  messageCount: integer("message_count").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  durationMs: integer("duration_ms").notNull(),
  transcript: text("transcript").notNull(), // JSON string of messages
  userEmail: text("user_email"), // if provided during chat
  isNotified: boolean("is_notified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCompletedChatSchema = createInsertSchema(completedChats).omit({
  id: true,
  createdAt: true,
});

export type FileAsset = typeof fileAssets.$inferSelect;
export type InsertFileAsset = z.infer<typeof insertFileAssetSchema>;
export type CompletedChat = typeof completedChats.$inferSelect;
export type InsertCompletedChat = z.infer<typeof insertCompletedChatSchema>;
