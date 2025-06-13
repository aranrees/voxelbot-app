import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatMessageSchema, insertAppointmentSchema, insertDocumentSchema, insertAiInstructionSchema, insertQuickActionSchema, insertAvailabilitySchema, insertStandardResponseSchema } from "@shared/schema";
import { getChatResponse } from "./lib/openai";
import { setupAuth } from "./auth";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup authentication first
  setupAuth(app);
  
  // Secret phrase to reveal admin link
  app.post("/api/reveal-admin", async (req, res) => {
    try {
      const { message } = req.body;
      if (message && message.toLowerCase().trim() === "honey, i'm home") {
        res.json({ adminLink: "/admin" });
      } else {
        res.status(404).json({ message: "Invalid phrase" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

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
      
      // Check for secret phrase first - normalize and check multiple variations
      const normalizedContent = validatedData.content?.toLowerCase()
        .replace(/[.,!?;:]/g, '')
        .replace(/'/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Define all accepted secret phrase patterns
      const secretPatterns = [
        /honey\s+i\s*m\s+home/,
        /honey\s+i\s+am\s+home/,
        /honey\s+im\s+home/,
        /hey\s+honey\s+i\s*m\s+home/,
        /hi\s+honey\s+i\s*m\s+home/,
        /honey\s+i\s*m\s+back/,
        /honey\s+i\s+am\s+back/
      ];
      
      const isSecretPhrase = secretPatterns.some(pattern => pattern.test(normalizedContent));
      
      if (isSecretPhrase) {
        const userMessage = await storage.createChatMessage(validatedData);
        const aiMessage = await storage.createChatMessage({
          content: "Welcome home! Here's your admin access: [Admin Dashboard](/admin)",
          role: "assistant"
        });
        res.json({ userMessage, aiMessage, adminLink: "/admin" });
        return;
      }
      
      const userMessage = await storage.createChatMessage(validatedData);
      
      // Get conversation history for context
      const history = await storage.getChatMessages(20);
      const conversationHistory = history.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Get documents and AI instructions for enhanced context
      const documents = await storage.getDocuments();
      const aiInstructions = await storage.getActiveAiInstructions();
      
      // Get AI response with enhanced context
      const aiResponse = await getChatResponse(validatedData.content, conversationHistory, documents, aiInstructions);
      
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

  // Reset chat messages
  app.delete("/api/messages", async (req, res) => {
    try {
      await storage.resetChatMessages();
      res.json({ message: "Chat history cleared" });
    } catch (error) {
      console.error("Reset chat error:", error);
      res.status(500).json({ message: "Failed to reset chat" });
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

  // Admin middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Document management endpoints (admin only)
  app.get("/api/admin/documents", requireAuth, async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/admin/documents/:id", requireAuth, async (req, res) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.post("/api/admin/documents", requireAuth, async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(validatedData);
      res.json(document);
    } catch (error) {
      console.error("Document creation error:", error);
      res.status(400).json({ message: "Failed to create document" });
    }
  });

  app.put("/api/admin/documents/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.partial().parse(req.body);
      const document = await storage.updateDocument(parseInt(req.params.id), validatedData);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(400).json({ message: "Failed to update document" });
    }
  });

  app.delete("/api/admin/documents/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteDocument(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // AI Instructions management endpoints (admin only)
  app.get("/api/admin/ai-instructions", requireAuth, async (req, res) => {
    try {
      const instructions = await storage.getAiInstructions();
      res.json(instructions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI instructions" });
    }
  });

  app.get("/api/admin/ai-instructions/:id", requireAuth, async (req, res) => {
    try {
      const instruction = await storage.getAiInstruction(parseInt(req.params.id));
      if (!instruction) {
        return res.status(404).json({ message: "AI instruction not found" });
      }
      res.json(instruction);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI instruction" });
    }
  });

  app.post("/api/admin/ai-instructions", requireAuth, async (req, res) => {
    try {
      const validatedData = insertAiInstructionSchema.parse(req.body);
      const instruction = await storage.createAiInstruction(validatedData);
      res.json(instruction);
    } catch (error) {
      console.error("AI instruction creation error:", error);
      res.status(400).json({ message: "Failed to create AI instruction" });
    }
  });

  app.put("/api/admin/ai-instructions/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertAiInstructionSchema.partial().parse(req.body);
      const instruction = await storage.updateAiInstruction(parseInt(req.params.id), validatedData);
      if (!instruction) {
        return res.status(404).json({ message: "AI instruction not found" });
      }
      res.json(instruction);
    } catch (error) {
      res.status(400).json({ message: "Failed to update AI instruction" });
    }
  });

  app.delete("/api/admin/ai-instructions/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteAiInstruction(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "AI instruction not found" });
      }
      res.json({ message: "AI instruction deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete AI instruction" });
    }
  });

  // Quick Actions management (admin only)
  app.get("/api/admin/quick-actions", requireAuth, async (req, res) => {
    try {
      const actions = await storage.getQuickActions();
      res.json(actions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quick actions" });
    }
  });

  app.post("/api/admin/quick-actions", requireAuth, async (req, res) => {
    try {
      const validatedData = insertQuickActionSchema.parse(req.body);
      const action = await storage.createQuickAction(validatedData);
      res.json(action);
    } catch (error) {
      console.error("Quick action creation error:", error);
      res.status(400).json({ message: "Failed to create quick action" });
    }
  });

  app.put("/api/admin/quick-actions/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertQuickActionSchema.partial().parse(req.body);
      const action = await storage.updateQuickAction(parseInt(req.params.id), validatedData);
      if (!action) {
        return res.status(404).json({ message: "Quick action not found" });
      }
      res.json(action);
    } catch (error) {
      res.status(400).json({ message: "Failed to update quick action" });
    }
  });

  app.delete("/api/admin/quick-actions/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteQuickAction(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Quick action not found" });
      }
      res.json({ message: "Quick action deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quick action" });
    }
  });

  // Public endpoint for getting active quick actions
  app.get("/api/quick-actions", async (req, res) => {
    try {
      const actions = await storage.getActiveQuickActions();
      res.json(actions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quick actions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
