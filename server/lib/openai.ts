import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-openai-api-key"
});

// Parse priority markers from instruction text
function parseInstructionPriorities(text: string, basePriority: number = 5): Array<{priority: number, content: string}> {
  const sections: Array<{priority: number, content: string}> = [];
  
  // Split by priority markers: ## Priority X or ### Priority X
  const priorityRegex = /^#{2,3}\s*Priority\s+(\d+)\s*$/gm;
  const parts = text.split(priorityRegex);
  
  if (parts.length === 1) {
    // No priority markers found, return as single section with base priority
    return [{priority: basePriority, content: text.trim()}];
  }
  
  // First part (before any priority marker) gets base priority
  if (parts[0].trim()) {
    sections.push({priority: basePriority, content: parts[0].trim()});
  }
  
  // Process pairs of (priority_number, content)
  for (let i = 1; i < parts.length; i += 2) {
    const priorityNum = parseInt(parts[i]);
    const content = parts[i + 1];
    
    if (!isNaN(priorityNum) && content && content.trim()) {
      sections.push({
        priority: Math.max(1, Math.min(10, priorityNum)), // Clamp to 1-10
        content: content.trim()
      });
    }
  }
  
  return sections;
}

export async function getChatResponse(message: string, conversationHistory: Array<{role: string, content: string}> = [], documents: any[] = [], aiInstructions: any[] = [], fileAssets: any[] = []): Promise<string> {
  try {
    // Build enhanced system prompt with admin-defined content
    let systemPrompt = `You are a helpful AI assistant for a business. You can help customers with:
    - Information about products and services
    - Providing contact information
    - Helping them download service guides and PDFs
    - Scheduling appointments and consultations
    - Answering general business questions

    Be friendly, professional, and helpful. If someone asks about downloading PDFs, contact information, or scheduling appointments, acknowledge their request and let them know you can help with that.

    Company Information:
    - Phone: (555) 123-4567
    - Email: info@company.com
    - Address: 123 Business St, Suite 100, City, State 12345
    - Business Hours: Mon-Fri 9:00 AM - 6:00 PM, Sat 10:00 AM - 4:00 PM

    Keep responses conversational and concise.`;

    // Add AI instructions if available with priority parsing
    if (aiInstructions.length > 0) {
      systemPrompt += "\n\nSpecial Instructions:\n";
      
      // Parse all instructions and collect prioritized sections
      const allSections: Array<{priority: number, content: string}> = [];
      
      aiInstructions
        .filter(instruction => instruction.isActive)
        .forEach(instruction => {
          const sections = parseInstructionPriorities(instruction.instruction, instruction.priority);
          allSections.push(...sections);
        });
      
      // Sort all sections by priority (highest first) and add to prompt
      allSections
        .sort((a, b) => b.priority - a.priority)
        .forEach(section => {
          systemPrompt += `- ${section.content}\n`;
        });
    }

    // Add knowledge base from documents if available
    if (documents.length > 0) {
      systemPrompt += "\n\nKnowledge Base:\n";
      documents
        .filter(doc => doc.isActive)
        .forEach(doc => {
          systemPrompt += `\n**${doc.title}** (${doc.type}):\n${doc.content}\n`;
          if (doc.tags && doc.tags.length > 0) {
            systemPrompt += `Tags: ${doc.tags.join(', ')}\n`;
          }
        });
    }

    // Add downloadable files information
    if (fileAssets && fileAssets.length > 0) {
      systemPrompt += "\n\nAvailable Downloads for Clients:\n";
      fileAssets
        .filter(file => file.isPublic)
        .forEach(file => {
          systemPrompt += `\n**${file.title}** (${file.fileType.toUpperCase()}):\n`;
          if (file.description) {
            systemPrompt += `Description: ${file.description}\n`;
          }
          systemPrompt += `Download link: ${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api/files/${file.id}/download\n`;
          systemPrompt += `File size: ${Math.round(file.fileSize / 1024)}KB\n`;
          if (file.tags && file.tags.length > 0) {
            systemPrompt += `Tags: ${file.tags.join(', ')}\n`;
          }
          systemPrompt += "\n";
        });
      systemPrompt += "When relevant, you can share these download links with clients. Always provide the full download URL when mentioning files.";
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: "user", content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I apologize, but I'm having trouble responding right now. Please try again.";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "I'm experiencing some technical difficulties right now. Please try again in a moment, or feel free to contact us directly at (555) 123-4567.";
  }
}
