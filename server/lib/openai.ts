import OpenAI from "openai";
import { getBotConfig } from './bot-config';

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-openai-api-key"
});

// Initialize Moonshot (Kimi) client - OpenAI-compatible
const moonshot = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY || "your-moonshot-api-key",
  baseURL: "https://api.moonshot.ai/v1"
});

// Model configuration
const AI_PROVIDER = process.env.AI_PROVIDER || "openai"; // "openai" or "moonshot"
const AI_MODEL = process.env.AI_MODEL || (AI_PROVIDER === "moonshot" ? "kimi-k2.5" : "gpt-4o");

export async function getChatResponse(
  message: string, 
  conversationHistory: Array<{role: string, content: string}> = [], 
  sessionId?: string
): Promise<string> {
  try {
    const config = getBotConfig();
    
    let systemPrompt = "";
    
    if (config) {
      // Identity
      systemPrompt += `You are ${config.identity.name}, ${config.identity.tagline}.\n`;
      systemPrompt += `You represent ${config.identity.organization}'s ${config.identity.programme}.\n\n`;
      
      // Voice and purpose
      systemPrompt += `Your voice: ${config.coreInstructions.voice}\n\n`;
      systemPrompt += `Primary purpose:\n`;
      config.coreInstructions.primaryPurpose.forEach((purpose: string) => {
        systemPrompt += `- ${purpose}\n`;
      });
      systemPrompt += `\n`;
      
      // Key messages
      systemPrompt += `Key messages to communicate:\n`;
      config.coreInstructions.keyMessages.forEach((msg: string) => {
        systemPrompt += `- ${msg}\n`;
      });
      systemPrompt += `\n`;
      
      // Contact information
      systemPrompt += `Contact Information:\n`;
      systemPrompt += `- Phone: ${config.contactInfo.phone}\n`;
      systemPrompt += `- Email: ${config.contactInfo.email}\n`;
      systemPrompt += `- Website: ${config.contactInfo.website}\n`;
      systemPrompt += `- ${config.contactInfo.address}\n`;
      systemPrompt += `- ${config.contactInfo.businessHours}\n\n`;
      
      // Visitor protocols
      systemPrompt += `CRITICAL: Identify visitor type first.\n\n`;
      
      systemPrompt += `If PARENT:\n`;
      config.visitorProtocols.parent.steps.forEach((step: string) => {
        systemPrompt += `- ${step}\n`;
      });
      systemPrompt += `\n`;
      
      systemPrompt += `If YOUNG PERSON (under 18):\n`;
      config.visitorProtocols.youngPerson.steps.forEach((step: string) => {
        systemPrompt += `- ${step}\n`;
      });
      systemPrompt += `\n`;
      
      systemPrompt += `If ADULT FAMILY MEMBER/FRIEND:\n`;
      config.visitorProtocols.adultFamilyMember.steps.forEach((step: string) => {
        systemPrompt += `- ${step}\n`;
      });
      systemPrompt += `\n`;
      
      systemPrompt += `If OTHER (teacher, partner, etc):\n`;
      config.visitorProtocols.other.steps.forEach((step: string) => {
        systemPrompt += `- ${step}\n`;
      });
      systemPrompt += `\n`;
      
      // Common questions
      systemPrompt += `Common Questions & Answers:\n`;
      config.commonQuestions.forEach((qa: any) => {
        systemPrompt += `\nQ: ${qa.question}\n`;
        systemPrompt += `A: ${qa.answer}\n`;
      });
      systemPrompt += `\n`;
      
      // Knowledge base
      systemPrompt += `Knowledge Base:\n`;
      config.knowledgeBase.forEach((kb: any) => {
        systemPrompt += `\n**${kb.title}** (${kb.category}):\n`;
        systemPrompt += `${kb.content}\n`;
      });
      systemPrompt += `\n`;
      
      // Booking triggers
      systemPrompt += `When to suggest discovery call:\n`;
      config.bookingTriggers.conditions.forEach((condition: string) => {
        systemPrompt += `- ${condition}\n`;
      });
      systemPrompt += `\nSuggestion message: "${config.bookingTriggers.message}"\n`;
      systemPrompt += `Calendly link: ${config.bookingTriggers.calendlyUrl}\n\n`;
      
      // Prohibitions
      systemPrompt += `What NOT to do:\n`;
      config.prohibitions.forEach((prohibition: string) => {
        systemPrompt += `- ${prohibition}\n`;
      });
      systemPrompt += `\n`;
      
      // Tone examples
      systemPrompt += `Good tone examples:\n`;
      config.toneExamples.good.forEach((example: string) => {
        systemPrompt += `- "${example}"\n`;
      });
      systemPrompt += `\nBad tone examples (avoid):\n`;
      config.toneExamples.bad.forEach((example: string) => {
        systemPrompt += `- "${example}"\n`;
      });
      
    } else {
      systemPrompt = `You are a helpful AI assistant. Be friendly and professional.`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: "user", content: message }
    ];

    // Select the appropriate client and model based on environment
    const client = AI_PROVIDER === "moonshot" ? moonshot : openai;
    const model = AI_MODEL;

    console.log(`Using AI Provider: ${AI_PROVIDER}, Model: ${model}`);

    // Kimi K2.5 requires temperature: 1, OpenAI supports 0.7
    const temperature = AI_PROVIDER === "moonshot" ? 1 : 0.7;
    
    const response = await client.chat.completions.create({
      model: model,
      messages: messages as any,
      max_tokens: 500,
      temperature: temperature,
    });

    return response.choices[0].message.content || "I apologize, but I'm having trouble responding right now. Please try again.";
  } catch (error) {
    console.error("AI API Error:", error);
    return "I'm experiencing some technical difficulties right now. Please try again in a moment.";
  }
}
