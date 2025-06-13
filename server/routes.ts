import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatMessageSchema, insertAppointmentSchema } from "@shared/schema";
import { getChatResponse } from "./lib/openai";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Chat endpoints
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(50);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      const userMessage = await storage.createChatMessage(validatedData);
      
      // Get conversation history for context
      const history = await storage.getChatMessages(20);
      const conversationHistory = history.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Get AI response
      const aiResponse = await getChatResponse(validatedData.content, conversationHistory);
      
      // Save AI response
      const aiMessage = await storage.createChatMessage({
        content: aiResponse,
        role: "assistant"
      });
      
      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Appointment endpoints
  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      res.json(appointment);
    } catch (error) {
      console.error("Appointment error:", error);
      res.status(400).json({ message: "Failed to create appointment" });
    }
  });

  // PDF download endpoint
  app.get("/api/download/service-guide", (req, res) => {
    try {
      const filePath = path.join(__dirname, "sample-service-guide.pdf");
      res.download(filePath, "service-guide.pdf", (err) => {
        if (err) {
          console.error("Download error:", err);
          res.status(404).json({ message: "File not found" });
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Download failed" });
    }
  });

  // Contact information endpoint
  app.get("/api/contact", (req, res) => {
    res.json({
      phone: "(555) 123-4567",
      email: "info@company.com",
      address: "123 Business St, Suite 100\nCity, State 12345",
      businessHours: "Mon-Fri: 9:00 AM - 6:00 PM\nSat: 10:00 AM - 4:00 PM"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
