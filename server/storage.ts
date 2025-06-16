import { users, chatMessages, appointments, documents, aiInstructions, quickActions, availability, standardResponses, fileAssets, type User, type InsertUser, type ChatMessage, type InsertChatMessage, type Appointment, type InsertAppointment, type Document, type InsertDocument, type AiInstruction, type InsertAiInstruction, type QuickAction, type InsertQuickAction, type Availability, type InsertAvailability, type StandardResponse, type InsertStandardResponse, type FileAsset, type InsertFileAsset } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chat messages
  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  resetChatMessages(): Promise<void>;
  
  // Appointments
  getAppointments(): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined>;
  
  // Documents
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // AI Instructions
  getAiInstructions(): Promise<AiInstruction[]>;
  getActiveAiInstructions(): Promise<AiInstruction[]>;
  getAiInstruction(id: number): Promise<AiInstruction | undefined>;
  createAiInstruction(instruction: InsertAiInstruction): Promise<AiInstruction>;
  updateAiInstruction(id: number, instruction: Partial<InsertAiInstruction>): Promise<AiInstruction | undefined>;
  deleteAiInstruction(id: number): Promise<boolean>;
  
  // Quick Actions
  getQuickActions(): Promise<QuickAction[]>;
  getActiveQuickActions(): Promise<QuickAction[]>;
  getQuickAction(id: number): Promise<QuickAction | undefined>;
  createQuickAction(action: InsertQuickAction): Promise<QuickAction>;
  updateQuickAction(id: number, action: Partial<InsertQuickAction>): Promise<QuickAction | undefined>;
  deleteQuickAction(id: number): Promise<boolean>;
  
  // Availability
  getAvailability(): Promise<Availability[]>;
  getAvailabilityByDate(date: string): Promise<Availability | undefined>;
  createAvailability(availability: InsertAvailability): Promise<Availability>;
  updateAvailability(id: number, availability: Partial<InsertAvailability>): Promise<Availability | undefined>;
  deleteAvailability(id: number): Promise<boolean>;
  
  // Standard Responses
  getStandardResponses(): Promise<StandardResponse[]>;
  getActiveStandardResponses(): Promise<StandardResponse[]>;
  getStandardResponse(id: number): Promise<StandardResponse | undefined>;
  createStandardResponse(response: InsertStandardResponse): Promise<StandardResponse>;
  updateStandardResponse(id: number, response: Partial<InsertStandardResponse>): Promise<StandardResponse | undefined>;
  deleteStandardResponse(id: number): Promise<boolean>;
  
  // File Assets
  getFileAssets(): Promise<FileAsset[]>;
  getPublicFileAssets(): Promise<FileAsset[]>;
  getFileAsset(id: number): Promise<FileAsset | undefined>;
  createFileAsset(asset: InsertFileAsset): Promise<FileAsset>;
  updateFileAsset(id: number, asset: Partial<InsertFileAsset>): Promise<FileAsset | undefined>;
  deleteFileAsset(id: number): Promise<boolean>;
  incrementDownloadCount(id: number): Promise<void>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .orderBy(chatMessages.timestamp)
      .limit(limit);
    return messages;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async resetChatMessages(): Promise<void> {
    await db.delete(chatMessages);
  }

  async getAppointments(): Promise<Appointment[]> {
    const results = await db
      .select()
      .from(appointments)
      .orderBy(appointments.createdAt);
    return results;
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(insertAppointment)
      .returning();
    return appointment;
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    return appointment || undefined;
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined> {
    const [updated] = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, id))
      .returning();
    return updated || undefined;
  }

  async getDocuments(): Promise<Document[]> {
    const results = await db
      .select()
      .from(documents)
      .orderBy(documents.createdAt);
    return results;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document || undefined;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateDocument(id: number, updateData: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updated] = await db
      .update(documents)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db
      .delete(documents)
      .where(eq(documents.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAiInstructions(): Promise<AiInstruction[]> {
    const results = await db
      .select()
      .from(aiInstructions)
      .orderBy(aiInstructions.priority);
    return results;
  }

  async getActiveAiInstructions(): Promise<AiInstruction[]> {
    const results = await db
      .select()
      .from(aiInstructions)
      .where(eq(aiInstructions.isActive, true))
      .orderBy(aiInstructions.priority);
    return results;
  }

  async getAiInstruction(id: number): Promise<AiInstruction | undefined> {
    const [instruction] = await db
      .select()
      .from(aiInstructions)
      .where(eq(aiInstructions.id, id));
    return instruction || undefined;
  }

  async createAiInstruction(insertInstruction: InsertAiInstruction): Promise<AiInstruction> {
    const [instruction] = await db
      .insert(aiInstructions)
      .values(insertInstruction)
      .returning();
    return instruction;
  }

  async updateAiInstruction(id: number, updateData: Partial<InsertAiInstruction>): Promise<AiInstruction | undefined> {
    const [updated] = await db
      .update(aiInstructions)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(aiInstructions.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAiInstruction(id: number): Promise<boolean> {
    const result = await db
      .delete(aiInstructions)
      .where(eq(aiInstructions.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getQuickActions(): Promise<QuickAction[]> {
    const results = await db
      .select()
      .from(quickActions)
      .orderBy(quickActions.order);
    return results;
  }

  async getActiveQuickActions(): Promise<QuickAction[]> {
    const results = await db
      .select()
      .from(quickActions)
      .where(eq(quickActions.isActive, true))
      .orderBy(quickActions.order);
    return results;
  }

  async getQuickAction(id: number): Promise<QuickAction | undefined> {
    const [result] = await db
      .select()
      .from(quickActions)
      .where(eq(quickActions.id, id));
    return result || undefined;
  }

  async createQuickAction(insertAction: InsertQuickAction): Promise<QuickAction> {
    const [action] = await db
      .insert(quickActions)
      .values(insertAction)
      .returning();
    return action;
  }

  async updateQuickAction(id: number, updateData: Partial<InsertQuickAction>): Promise<QuickAction | undefined> {
    const [action] = await db
      .update(quickActions)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(quickActions.id, id))
      .returning();
    return action || undefined;
  }

  async deleteQuickAction(id: number): Promise<boolean> {
    const result = await db.delete(quickActions).where(eq(quickActions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Availability methods
  async getAvailability(): Promise<Availability[]> {
    const results = await db
      .select()
      .from(availability)
      .orderBy(availability.date, availability.startTime);
    return results;
  }

  async getAvailabilityByDate(date: string): Promise<Availability | undefined> {
    const [result] = await db
      .select()
      .from(availability)
      .where(eq(availability.date, date));
    return result || undefined;
  }

  async createAvailability(insertAvailability: InsertAvailability): Promise<Availability> {
    const [result] = await db
      .insert(availability)
      .values(insertAvailability)
      .returning();
    return result;
  }

  async updateAvailability(id: number, updateData: Partial<InsertAvailability>): Promise<Availability | undefined> {
    const [result] = await db
      .update(availability)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(availability.id, id))
      .returning();
    return result || undefined;
  }

  async deleteAvailability(id: number): Promise<boolean> {
    const result = await db.delete(availability).where(eq(availability.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Standard Responses methods
  async getStandardResponses(): Promise<StandardResponse[]> {
    const results = await db
      .select()
      .from(standardResponses)
      .orderBy(standardResponses.priority, standardResponses.title);
    return results;
  }

  async getActiveStandardResponses(): Promise<StandardResponse[]> {
    const results = await db
      .select()
      .from(standardResponses)
      .where(eq(standardResponses.isActive, true))
      .orderBy(standardResponses.priority, standardResponses.title);
    return results;
  }

  async getStandardResponse(id: number): Promise<StandardResponse | undefined> {
    const [result] = await db
      .select()
      .from(standardResponses)
      .where(eq(standardResponses.id, id));
    return result || undefined;
  }

  async createStandardResponse(insertResponse: InsertStandardResponse): Promise<StandardResponse> {
    const [response] = await db
      .insert(standardResponses)
      .values(insertResponse)
      .returning();
    return response;
  }

  async updateStandardResponse(id: number, updateData: Partial<InsertStandardResponse>): Promise<StandardResponse | undefined> {
    const [response] = await db
      .update(standardResponses)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(standardResponses.id, id))
      .returning();
    return response || undefined;
  }

  async deleteStandardResponse(id: number): Promise<boolean> {
    const result = await db.delete(standardResponses).where(eq(standardResponses.id, id));
    return (result.rowCount || 0) > 0;
  }

  // File Assets methods
  async getFileAssets(): Promise<FileAsset[]> {
    return await db.select().from(fileAssets).orderBy(fileAssets.createdAt);
  }

  async getPublicFileAssets(): Promise<FileAsset[]> {
    return await db.select().from(fileAssets).where(eq(fileAssets.isPublic, true)).orderBy(fileAssets.createdAt);
  }

  async getFileAsset(id: number): Promise<FileAsset | undefined> {
    const [asset] = await db.select().from(fileAssets).where(eq(fileAssets.id, id));
    return asset || undefined;
  }

  async createFileAsset(insertAsset: InsertFileAsset): Promise<FileAsset> {
    const [asset] = await db
      .insert(fileAssets)
      .values(insertAsset)
      .returning();
    return asset;
  }

  async updateFileAsset(id: number, updateData: Partial<InsertFileAsset>): Promise<FileAsset | undefined> {
    const [asset] = await db
      .update(fileAssets)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(fileAssets.id, id))
      .returning();
    return asset || undefined;
  }

  async deleteFileAsset(id: number): Promise<boolean> {
    try {
      const result = await db.delete(fileAssets).where(eq(fileAssets.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting file asset:', error);
      return false;
    }
  }

  async incrementDownloadCount(id: number): Promise<void> {
    await db
      .update(fileAssets)
      .set({ downloadCount: sql`${fileAssets.downloadCount} + 1` })
      .where(eq(fileAssets.id, id));
  }
}

export const storage = new DatabaseStorage();
