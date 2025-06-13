import { users, chatMessages, appointments, documents, aiInstructions, type User, type InsertUser, type ChatMessage, type InsertChatMessage, type Appointment, type InsertAppointment, type Document, type InsertDocument, type AiInstruction, type InsertAiInstruction } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
