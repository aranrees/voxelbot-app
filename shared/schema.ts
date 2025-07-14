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
  sessionId: text("session_id").notNull().default("global"),
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

export const archivedDocuments = pgTable("archived_documents", {
  id: serial("id").primaryKey(),
  originalId: integer("original_id").notNull(), // ID from the original documents table
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(),
  fileType: text("file_type").default("text").notNull(),
  filePath: text("file_path"),
  tags: text("tags").array(),
  originalCreatedAt: timestamp("original_created_at").notNull(),
  originalUpdatedAt: timestamp("original_updated_at").notNull(),
  archivedAt: timestamp("archived_at").defaultNow().notNull(),
  archivedBy: text("archived_by"), // username or system identifier
  reason: text("reason").default("deleted").notNull(), // reason for archiving
});

export const aiInstructions = pgTable("ai_instructions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  instruction: text("instruction").notNull(),
  category: text("category").default("general").notNull(), // 'general' | 'tone' | 'behavior' | 'knowledge' | 'restrictions' | 'welcome' | 'greeting'
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
  contextKeywords: text("context_keywords").array(), // Keywords that trigger this suggestion
  contextType: text("context_type").default("general").notNull(), // 'general' | 'question' | 'request' | 'problem' | 'pricing' | 'scheduling'
  suggestionWeight: integer("suggestion_weight").default(1).notNull(), // Higher weight = more likely to be suggested
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("specific"), // "specific" | "recurring"
  date: text("date"), // YYYY-MM-DD format for specific dates
  dayOfWeek: text("day_of_week"), // "monday" | "tuesday" | etc. for recurring
  daysOfWeek: text("days_of_week").array(), // ["monday", "tuesday"] for multi-day recurring
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
}).extend({
  sessionId: z.string().optional(),
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

export const insertArchivedDocumentSchema = createInsertSchema(archivedDocuments).omit({
  id: true,
  archivedAt: true,
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
}).extend({
  type: z.enum(["specific", "recurring"]).default("specific"),
  dayOfWeek: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]).optional(),
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
export type ArchivedDocument = typeof archivedDocuments.$inferSelect;
export type InsertArchivedDocument = z.infer<typeof insertArchivedDocumentSchema>;
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

export const meetingRequests = pgTable("meeting_requests", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(), // chat session that generated this request
  requestorName: text("requestor_name"),
  requestorEmail: text("requestor_email"),
  requestorPhone: text("requestor_phone"),
  meetingType: text("meeting_type").notNull(), // 'call' | 'video' | 'in-person' | 'consultation'
  preferredDates: text("preferred_dates").array(), // ["2025-06-17", "2025-06-18"]
  preferredTimes: text("preferred_times").array(), // ["14:00", "15:00"]
  duration: integer("duration").default(30), // minutes
  purpose: text("purpose"), // meeting purpose/agenda
  status: text("status").default("requested").notNull(), // 'requested' | 'scheduled' | 'confirmed' | 'cancelled'
  scheduledDate: text("scheduled_date"), // confirmed date
  scheduledTime: text("scheduled_time"), // confirmed time
  notes: text("notes"), // admin notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMeetingRequestSchema = createInsertSchema(meetingRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Contact information for the business
export const contactInfo = pgTable("contact_info", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  businessHours: text("business_hours").notNull(),
  showDownloadButton: boolean("show_download_button").default(true).notNull(),
  showContactButton: boolean("show_contact_button").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContactInfoSchema = createInsertSchema(contactInfo).omit({
  id: true,
  updatedAt: true,
});

export type FileAsset = typeof fileAssets.$inferSelect;
export type InsertFileAsset = z.infer<typeof insertFileAssetSchema>;
export type CompletedChat = typeof completedChats.$inferSelect;
export type InsertCompletedChat = z.infer<typeof insertCompletedChatSchema>;
export type MeetingRequest = typeof meetingRequests.$inferSelect;
export type InsertMeetingRequest = z.infer<typeof insertMeetingRequestSchema>;
export type ContactInfo = typeof contactInfo.$inferSelect;
export type InsertContactInfo = z.infer<typeof insertContactInfoSchema>;
