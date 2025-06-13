import { users, chatMessages, appointments, type User, type InsertUser, type ChatMessage, type InsertChatMessage, type Appointment, type InsertAppointment } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chatMessages: Map<number, ChatMessage>;
  private appointments: Map<number, Appointment>;
  private currentUserId: number;
  private currentMessageId: number;
  private currentAppointmentId: number;

  constructor() {
    this.users = new Map();
    this.chatMessages = new Map();
    this.appointments = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
    this.currentAppointmentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    const messages = Array.from(this.chatMessages.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return limit ? messages.slice(-limit) : messages;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentMessageId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    const appointment: Appointment = {
      ...insertAppointment,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (appointment) {
      const updated = { ...appointment, status };
      this.appointments.set(id, updated);
      return updated;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
