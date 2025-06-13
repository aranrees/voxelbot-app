import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-openai-api-key"
});

export async function getChatResponse(message: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<string> {
  try {
    const systemPrompt = `You are a helpful AI assistant for a business. You can help customers with:
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
