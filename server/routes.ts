import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatMessageSchema, insertAppointmentSchema, insertDocumentSchema, insertAiInstructionSchema, insertQuickActionSchema, insertAvailabilitySchema, insertStandardResponseSchema } from "@shared/schema";
import { getChatResponse } from "./lib/openai";
import { setupAuth } from "./auth";
import path from "path";
import { fileURLToPath } from 'url';
import multer from "multer";
import fs from "fs";
// PDF text extraction will be implemented with a different approach

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create notification files for completed chats
async function createChatNotificationFiles(completedChat: any, messages: any[]) {
  try {
    const notificationsDir = path.join(process.cwd(), 'chat-notifications');
    if (!fs.existsSync(notificationsDir)) {
      fs.mkdirSync(notificationsDir, { recursive: true });
    }

    // Create detailed transcript file
    const transcript = {
      sessionId: completedChat.sessionId,
      startTime: completedChat.startTime,
      endTime: completedChat.endTime,
      duration: `${Math.round(completedChat.durationMs / 1000 / 60)} minutes`,
      messageCount: completedChat.messageCount,
      messages: messages.map(msg => ({
        timestamp: msg.timestamp,
        role: msg.role,
        content: msg.content
      }))
    };

    const filename = `chat-${completedChat.sessionId}-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(notificationsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(transcript, null, 2));
    
    // Create simple notification summary
    const summary = `New chat completed at ${new Date().toISOString()}
Session: ${completedChat.sessionId}
Messages: ${completedChat.messageCount}
Duration: ${Math.round(completedChat.durationMs / 1000 / 60)} minutes
File: ${filename}
`;
    
    const summaryFile = path.join(notificationsDir, 'latest-chat.txt');
    fs.writeFileSync(summaryFile, summary);
    
    console.log(`Chat notification created: ${filename}`);
  } catch (error) {
    console.error('Failed to create notification files:', error);
  }
}

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

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
      
      // Get documents, AI instructions, and file assets for enhanced context
      const documents = await storage.getDocuments();
      const aiInstructions = await storage.getActiveAiInstructions();
      const fileAssets = await storage.getPublicFileAssets();
      
      // Get AI response with enhanced context including downloadable files
      const aiResponse = await getChatResponse(validatedData.content, conversationHistory, documents, aiInstructions, fileAssets);
      
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

  // Chat completion endpoint
  app.post("/api/chat/complete", async (req, res) => {
    try {
      const { sessionId, messages, startTime, endTime, duration } = req.body;
      
      if (!sessionId || !messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid chat completion data" });
      }

      // Save completed chat to database
      const completedChat = await storage.createCompletedChat({
        sessionId,
        messageCount: messages.length,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        durationMs: duration,
        transcript: JSON.stringify(messages),
        userEmail: null,
        isNotified: false
      });

      // Create notification files for monitoring
      await import("./lib/chat-notifications.js").then(module => 
        module.createChatNotificationFiles(completedChat, messages)
      );

      res.json({ success: true, chatId: completedChat.id });
    } catch (error) {
      console.error("Error saving completed chat:", error);
      res.status(500).json({ error: "Failed to save chat completion" });
    }
  });

  // Get completed chats for admin review
  app.get("/api/admin/completed-chats", async (req, res) => {
    try {
      const completedChats = await storage.getCompletedChats();
      res.json(completedChats);
    } catch (error) {
      console.error("Error fetching completed chats:", error);
      res.status(500).json({ error: "Failed to fetch completed chats" });
    }
  });

  // Mark chat as reviewed/notified
  app.post("/api/admin/completed-chats/:sessionId/notify", async (req, res) => {
    try {
      await storage.markChatAsNotified(req.params.sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking chat as notified:", error);
      res.status(500).json({ error: "Failed to mark chat as notified" });
    }
  });

  // Quick Actions endpoints
  app.get("/api/admin/quick-actions", async (req, res) => {
    try {
      const quickActions = await storage.getQuickActions();
      res.json(quickActions);
    } catch (error) {
      console.error("Error fetching quick actions:", error);
      res.status(500).json({ error: "Failed to fetch quick actions" });
    }
  });

  app.post("/api/admin/quick-actions", async (req, res) => {
    try {
      const validatedData = insertQuickActionSchema.parse(req.body);
      const quickAction = await storage.createQuickAction(validatedData);
      res.json(quickAction);
    } catch (error) {
      console.error("Error creating quick action:", error);
      res.status(400).json({ error: "Failed to create quick action" });
    }
  });

  app.put("/api/admin/quick-actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertQuickActionSchema.partial().parse(req.body);
      const quickAction = await storage.updateQuickAction(id, validatedData);
      if (!quickAction) {
        return res.status(404).json({ error: "Quick action not found" });
      }
      res.json(quickAction);
    } catch (error) {
      console.error("Error updating quick action:", error);
      res.status(400).json({ error: "Failed to update quick action" });
    }
  });

  app.delete("/api/admin/quick-actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteQuickAction(id);
      if (!deleted) {
        return res.status(404).json({ error: "Quick action not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting quick action:", error);
      res.status(500).json({ error: "Failed to delete quick action" });
    }
  });

  // Availability endpoints
  app.get("/api/admin/availability", async (req, res) => {
    try {
      const availability = await storage.getAvailability();
      res.json(availability);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ error: "Failed to fetch availability" });
    }
  });

  app.post("/api/admin/availability", async (req, res) => {
    try {
      const validatedData = insertAvailabilitySchema.parse(req.body);
      const availability = await storage.createAvailability(validatedData);
      res.json(availability);
    } catch (error) {
      console.error("Error creating availability:", error);
      res.status(400).json({ error: "Failed to create availability" });
    }
  });

  app.put("/api/admin/availability/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAvailabilitySchema.partial().parse(req.body);
      const availability = await storage.updateAvailability(id, validatedData);
      if (!availability) {
        return res.status(404).json({ error: "Availability not found" });
      }
      res.json(availability);
    } catch (error) {
      console.error("Error updating availability:", error);
      res.status(400).json({ error: "Failed to update availability" });
    }
  });

  app.delete("/api/admin/availability/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAvailability(id);
      if (!deleted) {
        return res.status(404).json({ error: "Availability not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting availability:", error);
      res.status(500).json({ error: "Failed to delete availability" });
    }
  });

  // Standard Responses endpoints
  app.get("/api/admin/standard-responses", async (req, res) => {
    try {
      const standardResponses = await storage.getStandardResponses();
      res.json(standardResponses);
    } catch (error) {
      console.error("Error fetching standard responses:", error);
      res.status(500).json({ error: "Failed to fetch standard responses" });
    }
  });

  app.post("/api/admin/standard-responses", async (req, res) => {
    try {
      const data = req.body;
      // Convert keywords string to array
      if (data.keywords && typeof data.keywords === 'string') {
        data.keywords = data.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
      }
      const validatedData = insertStandardResponseSchema.parse(data);
      const standardResponse = await storage.createStandardResponse(validatedData);
      res.json(standardResponse);
    } catch (error) {
      console.error("Error creating standard response:", error);
      res.status(400).json({ error: "Failed to create standard response" });
    }
  });

  app.put("/api/admin/standard-responses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      // Convert keywords string to array
      if (data.keywords && typeof data.keywords === 'string') {
        data.keywords = data.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
      }
      const validatedData = insertStandardResponseSchema.partial().parse(data);
      const standardResponse = await storage.updateStandardResponse(id, validatedData);
      if (!standardResponse) {
        return res.status(404).json({ error: "Standard response not found" });
      }
      res.json(standardResponse);
    } catch (error) {
      console.error("Error updating standard response:", error);
      res.status(400).json({ error: "Failed to update standard response" });
    }
  });

  app.delete("/api/admin/standard-responses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteStandardResponse(id);
      if (!deleted) {
        return res.status(404).json({ error: "Standard response not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting standard response:", error);
      res.status(500).json({ error: "Failed to delete standard response" });
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

  // File asset routes - public download access
  app.get("/api/files", async (req, res) => {
    try {
      const files = await storage.getPublicFileAssets();
      res.json(files);
    } catch (error) {
      console.error("Error fetching public files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get("/api/files/:id/download", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFileAsset(fileId);
      
      if (!file || (!file.isPublic && !req.isAuthenticated())) {
        return res.status(404).json({ message: "File not found" });
      }

      // Increment download count
      await storage.incrementDownloadCount(fileId);

      // Set appropriate headers
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      
      // Send file
      const filePath = path.join(__dirname, '..', file.filePath);
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Admin file management routes
  app.get("/api/admin/files", requireAuth, async (req, res) => {
    try {
      const files = await storage.getFileAssets();
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post("/api/admin/files/upload", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { title, description, tags, isPublic } = req.body;

      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      // Determine file type
      let fileType = 'other';
      if (req.file.mimetype.startsWith('image/')) {
        fileType = 'image';
      } else if (req.file.mimetype === 'application/pdf') {
        fileType = 'pdf';
      }

      const fileData = {
        title,
        description: description || null,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileType,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        downloadCount: 0,
        isPublic: isPublic === 'true' || isPublic === true,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      };

      const file = await storage.createFileAsset(fileData);
      res.json(file);
    } catch (error) {
      console.error("File upload error:", error);
      // Clean up uploaded file if processing failed
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.delete("/api/admin/files/:id", requireAuth, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFileAsset(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Delete file from filesystem
      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }

      // Delete from database
      const deleted = await storage.deleteFileAsset(fileId);
      
      if (deleted) {
        res.json({ message: "File deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete file from database" });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // PDF upload endpoint
  app.post("/api/admin/documents/upload-pdf", requireAuth, upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded" });
      }

      const { title, type, tags } = req.body;
      
      if (!title || !type) {
        return res.status(400).json({ message: "Title and type are required" });
      }

      // Store PDF file information for now
      // Text extraction can be enhanced later with proper PDF processing
      const extractedText = `[PDF Document: ${title}]\n\nFile: ${req.file.originalname}\nSize: ${Math.round(req.file.size / 1024)}KB\nType: ${type}\n\nThis PDF document has been uploaded and stored. To enable full text search and AI access to the content, please provide the document details or key information manually in the admin dashboard.`;
      const pageCount = 1; // Placeholder until text extraction is implemented

      const documentData = {
        title,
        content: extractedText,
        type,
        fileType: 'pdf' as const,
        filePath: req.file.path,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
        isActive: true
      };

      const document = await storage.createDocument(documentData);
      
      res.json({
        ...document,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        pageCount,
        extractedTextLength: extractedText.length,
        extractionSuccessful: !extractedText.includes('extraction failed')
      });
    } catch (error) {
      console.error("PDF upload error:", error);
      // Clean up uploaded file if processing failed
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Failed to process PDF upload" });
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

  // Admin Availability Management
  app.get("/api/admin/availability", requireAuth, async (req, res) => {
    try {
      const availability = await storage.getAvailability();
      res.json(availability);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.post("/api/admin/availability", requireAuth, async (req, res) => {
    try {
      const validatedData = insertAvailabilitySchema.parse(req.body);
      const availability = await storage.createAvailability(validatedData);
      res.status(201).json(availability);
    } catch (error) {
      res.status(400).json({ message: "Failed to create availability" });
    }
  });

  app.put("/api/admin/availability/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertAvailabilitySchema.partial().parse(req.body);
      const availability = await storage.updateAvailability(parseInt(req.params.id), validatedData);
      if (!availability) {
        return res.status(404).json({ message: "Availability not found" });
      }
      res.json(availability);
    } catch (error) {
      res.status(400).json({ message: "Failed to update availability" });
    }
  });

  app.delete("/api/admin/availability/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteAvailability(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Availability not found" });
      }
      res.json({ message: "Availability deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete availability" });
    }
  });

  // Admin Standard Responses Management
  app.get("/api/admin/standard-responses", requireAuth, async (req, res) => {
    try {
      const responses = await storage.getStandardResponses();
      res.json(responses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch standard responses" });
    }
  });

  app.post("/api/admin/standard-responses", requireAuth, async (req, res) => {
    try {
      const validatedData = insertStandardResponseSchema.parse(req.body);
      const response = await storage.createStandardResponse(validatedData);
      res.status(201).json(response);
    } catch (error) {
      res.status(400).json({ message: "Failed to create standard response" });
    }
  });

  app.put("/api/admin/standard-responses/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertStandardResponseSchema.partial().parse(req.body);
      const response = await storage.updateStandardResponse(parseInt(req.params.id), validatedData);
      if (!response) {
        return res.status(404).json({ message: "Standard response not found" });
      }
      res.json(response);
    } catch (error) {
      res.status(400).json({ message: "Failed to update standard response" });
    }
  });

  app.delete("/api/admin/standard-responses/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteStandardResponse(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Standard response not found" });
      }
      res.json({ message: "Standard response deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete standard response" });
    }
  });

  // Public endpoints for availability and standard responses
  app.get("/api/availability", async (req, res) => {
    try {
      const { date } = req.query;
      if (date) {
        const availability = await storage.getAvailabilityByDate(date as string);
        res.json(availability || null);
      } else {
        const availability = await storage.getAvailability();
        res.json(availability);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.get("/api/standard-responses", async (req, res) => {
    try {
      const responses = await storage.getActiveStandardResponses();
      res.json(responses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch standard responses" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
