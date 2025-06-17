import { storage } from "../storage";
import type { QuickAction } from "@shared/schema";

interface ContextAnalysis {
  intent: string;
  entities: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
  category: 'question' | 'request' | 'problem' | 'pricing' | 'scheduling' | 'general';
}

interface SuggestedAction extends QuickAction {
  relevanceScore: number;
  reason: string;
}

// Analyze conversation context to understand user intent
export function analyzeContext(messages: Array<{role: string, content: string}>): ContextAnalysis {
  const recentMessages = messages.slice(-3); // Last 3 messages for context
  const userMessages = recentMessages.filter(m => m.role === 'user');
  const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
  
  const content = lastUserMessage.toLowerCase();
  
  // Detect intent patterns
  let intent = 'unknown';
  let category: ContextAnalysis['category'] = 'general';
  let urgency: ContextAnalysis['urgency'] = 'low';
  
  // Question patterns
  if (content.includes('?') || content.match(/\b(what|how|when|where|why|can|could|would|do you|is it|are you)\b/)) {
    intent = 'asking_question';
    category = 'question';
  }
  
  // Request patterns
  if (content.match(/\b(need|want|would like|can you|please|help|assist|show me|give me)\b/)) {
    intent = 'making_request';
    category = 'request';
  }
  
  // Problem/issue patterns
  if (content.match(/\b(problem|issue|error|wrong|broken|not working|trouble|difficulty)\b/)) {
    intent = 'reporting_problem';
    category = 'problem';
    urgency = 'medium';
  }
  
  // Pricing/cost patterns
  if (content.match(/\b(price|cost|fee|expensive|cheap|budget|payment|pay|money)\b/)) {
    intent = 'asking_pricing';
    category = 'pricing';
  }
  
  // Scheduling/appointment patterns
  if (content.match(/\b(appointment|meeting|schedule|book|available|time|date|calendar)\b/)) {
    intent = 'scheduling';
    category = 'scheduling';
    urgency = 'medium';
  }
  
  // Urgency indicators
  if (content.match(/\b(urgent|asap|emergency|immediately|now|quick|fast)\b/)) {
    urgency = 'high';
  }
  
  // Extract entities (nouns, important keywords)
  const entities = extractEntities(content);
  
  // Simple sentiment analysis
  const sentiment = analyzeSentiment(content);
  
  return {
    intent,
    entities,
    sentiment,
    urgency,
    category
  };
}

function extractEntities(text: string): string[] {
  const keywords = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['the', 'and', 'but', 'for', 'are', 'you', 'can', 'have', 'that', 'this', 'with'].includes(word));
  
  // Remove duplicates manually to avoid TypeScript issues
  const unique: string[] = [];
  keywords.forEach(keyword => {
    if (!unique.includes(keyword)) {
      unique.push(keyword);
    }
  });
  
  return unique;
}

function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'like', 'happy', 'satisfied', 'perfect'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'frustrated', 'disappointed', 'problem', 'issue'];
  
  const words = text.toLowerCase().split(/\s+/);
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Get smart suggestions based on context analysis
export async function getSmartSuggestions(
  messages: Array<{role: string, content: string}>,
  maxSuggestions: number = 3
): Promise<SuggestedAction[]> {
  const context = analyzeContext(messages);
  const allQuickActions = await storage.getActiveQuickActions();
  
  const scoredActions: SuggestedAction[] = allQuickActions.map(action => {
    let relevanceScore = 0;
    let reason = '';
    
    // Base score from suggestion weight
    relevanceScore += (action.suggestionWeight || 1) * 10;
    
    // Context type matching
    if (action.contextType === context.category) {
      relevanceScore += 50;
      reason = `Matches ${context.category} context`;
    }
    
    // Keyword matching
    if (action.contextKeywords && action.contextKeywords.length > 0) {
      const matchingKeywords = action.contextKeywords.filter(keyword => 
        context.entities.some(entity => 
          entity.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(entity)
        )
      );
      
      if (matchingKeywords.length > 0) {
        relevanceScore += matchingKeywords.length * 25;
        reason = reason ? `${reason}, keyword match: ${matchingKeywords.join(', ')}` : `Keyword match: ${matchingKeywords.join(', ')}`;
      }
    }
    
    // Intent-specific scoring
    switch (context.intent) {
      case 'scheduling':
        if (action.label.toLowerCase().includes('meeting') || action.label.toLowerCase().includes('appointment')) {
          relevanceScore += 40;
        }
        break;
      case 'asking_pricing':
        if (action.label.toLowerCase().includes('price') || action.label.toLowerCase().includes('cost')) {
          relevanceScore += 40;
        }
        break;
      case 'making_request':
        if (action.label.toLowerCase().includes('help') || action.label.toLowerCase().includes('contact')) {
          relevanceScore += 30;
        }
        break;
    }
    
    // Urgency boost
    if (context.urgency === 'high') {
      relevanceScore += 20;
    }
    
    return {
      ...action,
      relevanceScore,
      reason: reason || 'General suggestion'
    };
  });
  
  // Sort by relevance score and return top suggestions
  return scoredActions
    .filter(action => action.relevanceScore > 20) // Minimum relevance threshold
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxSuggestions);
}

// Update existing quick actions with smart context data
export async function updateQuickActionContext(
  id: number,
  contextKeywords: string[],
  contextType: string,
  suggestionWeight: number
): Promise<void> {
  await storage.updateQuickAction(id, {
    contextKeywords,
    contextType,
    suggestionWeight
  });
}