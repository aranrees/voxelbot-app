import { storage } from "../storage";
import type { QuickAction, InsertQuickAction } from "@shared/schema";

interface ConversationPattern {
  topics: string[];
  frequency: number;
  lastSeen: Date;
  userIntent: string;
  commonPhrases: string[];
}

interface AdaptiveRecommendation {
  action: 'create' | 'update' | 'deactivate';
  quickAction?: Partial<InsertQuickAction>;
  existingActionId?: number;
  reason: string;
  confidence: number;
}

// Analyze conversation patterns to identify missing or needed quick actions
export async function analyzeConversationForAdaptiveActions(
  messages: Array<{role: string, content: string, timestamp: Date}>,
  sessionId: string
): Promise<AdaptiveRecommendation[]> {
  
  if (messages.length < 3) {
    return []; // Need sufficient conversation data
  }

  const recommendations: AdaptiveRecommendation[] = [];
  const userMessages = messages.filter(m => m.role === 'user');
  const existingActions = await storage.getActiveQuickActions();
  
  // Analyze conversation patterns
  const patterns = extractConversationPatterns(userMessages);
  
  // Check for frequently requested topics not covered by current actions
  for (const pattern of patterns) {
    if (pattern.frequency >= 2) { // Topic mentioned at least twice
      const isAlreadyCovered = existingActions.some(action => 
        action.contextKeywords?.some(keyword => 
          pattern.topics.some(topic => 
            topic.toLowerCase().includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(topic.toLowerCase())
          )
        )
      );
      
      if (!isAlreadyCovered) {
        const recommendation = generateQuickActionRecommendation(pattern);
        if (recommendation.confidence > 0.6) {
          recommendations.push(recommendation);
        }
      }
    }
  }
  
  // Check for underperforming actions that should be updated or deactivated
  const underperformingActions = await identifyUnderperformingActions(existingActions);
  recommendations.push(...underperformingActions);
  
  return recommendations.slice(0, 3); // Limit to top 3 recommendations
}

function extractConversationPatterns(userMessages: Array<{content: string, timestamp: Date}>): ConversationPattern[] {
  const topicMap = new Map<string, ConversationPattern>();
  
  for (const message of userMessages) {
    const topics = extractTopicsFromMessage(message.content);
    const intent = classifyUserIntent(message.content);
    
    for (const topic of topics) {
      const key = topic.toLowerCase();
      
      if (topicMap.has(key)) {
        const pattern = topicMap.get(key)!;
        pattern.frequency++;
        pattern.lastSeen = message.timestamp;
        if (!pattern.commonPhrases.includes(message.content.substring(0, 50))) {
          pattern.commonPhrases.push(message.content.substring(0, 50));
        }
      } else {
        topicMap.set(key, {
          topics: [topic],
          frequency: 1,
          lastSeen: message.timestamp,
          userIntent: intent,
          commonPhrases: [message.content.substring(0, 50)]
        });
      }
    }
  }
  
  return Array.from(topicMap.values());
}

function extractTopicsFromMessage(content: string): string[] {
  const topics: string[] = [];
  const text = content.toLowerCase();
  
  // Business-related topics
  const businessTopics = {
    'pricing': ['price', 'cost', 'fee', 'expensive', 'cheap', 'budget', 'payment', 'rates'],
    'scheduling': ['appointment', 'meeting', 'schedule', 'book', 'available', 'calendar', 'time'],
    'support': ['help', 'support', 'assistance', 'problem', 'issue', 'trouble'],
    'services': ['service', 'offering', 'what do you do', 'what can you help', 'capabilities'],
    'contact': ['contact', 'phone', 'email', 'address', 'location', 'reach out'],
    'downloads': ['download', 'pdf', 'guide', 'brochure', 'file', 'document'],
    'demo': ['demo', 'demonstration', 'show me', 'example', 'trial'],
    'consultation': ['consultation', 'advice', 'recommend', 'suggest', 'guidance']
  };
  
  for (const [topic, keywords] of Object.entries(businessTopics)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      topics.push(topic);
    }
  }
  
  return topics;
}

function classifyUserIntent(content: string): string {
  const text = content.toLowerCase();
  
  if (text.includes('?') || text.match(/\b(what|how|when|where|why|can|could|would)\b/)) {
    return 'question';
  }
  if (text.match(/\b(need|want|would like|please|help|can you)\b/)) {
    return 'request';
  }
  if (text.match(/\b(problem|issue|error|wrong|broken|not working)\b/)) {
    return 'problem';
  }
  
  return 'general';
}

function generateQuickActionRecommendation(pattern: ConversationPattern): AdaptiveRecommendation {
  const topicName = pattern.topics[0];
  let label = '';
  let message = '';
  let contextType = 'general';
  let keywords: string[] = [];
  
  switch (topicName) {
    case 'pricing':
      label = 'Get Pricing Details';
      message = 'I\'d like detailed information about your pricing and packages';
      contextType = 'pricing';
      keywords = ['price', 'cost', 'fee', 'budget', 'payment', 'rates'];
      break;
    
    case 'demo':
      label = 'Request Demo';
      message = 'Can you show me a demo or example of your work?';
      contextType = 'request';
      keywords = ['demo', 'demonstration', 'show', 'example', 'trial'];
      break;
    
    case 'consultation':
      label = 'Book Consultation';
      message = 'I\'d like to schedule a consultation to discuss my needs';
      contextType = 'scheduling';
      keywords = ['consultation', 'advice', 'discuss', 'guidance', 'recommend'];
      break;
    
    case 'services':
      label = 'Learn About Services';
      message = 'What services do you offer and how can you help me?';
      contextType = 'question';
      keywords = ['services', 'offering', 'capabilities', 'help', 'what do you do'];
      break;
    
    default:
      label = `Ask About ${topicName.charAt(0).toUpperCase() + topicName.slice(1)}`;
      message = `I have questions about ${topicName}`;
      keywords = pattern.topics;
  }
  
  return {
    action: 'create',
    quickAction: {
      label,
      message,
      contextKeywords: keywords,
      contextType,
      suggestionWeight: Math.min(10, pattern.frequency + 5),
      isActive: true
    } as InsertQuickAction,
    reason: `Users frequently ask about ${topicName} (${pattern.frequency} times)`,
    confidence: Math.min(1, pattern.frequency / 3)
  };
}

async function identifyUnderperformingActions(existingActions: QuickAction[]): Promise<AdaptiveRecommendation[]> {
  const recommendations: AdaptiveRecommendation[] = [];
  
  // This would typically analyze usage statistics, but for now we'll focus on creating new actions
  // In a full implementation, you'd track click rates and user engagement with each action
  
  return recommendations;
}

// Apply AI-recommended changes to quick actions
export async function applyAdaptiveRecommendations(
  recommendations: AdaptiveRecommendation[]
): Promise<{applied: number, skipped: number}> {
  let applied = 0;
  let skipped = 0;
  
  for (const rec of recommendations) {
    try {
      switch (rec.action) {
        case 'create':
          if (rec.quickAction && rec.quickAction.label && rec.quickAction.message) {
            await storage.createQuickAction(rec.quickAction as InsertQuickAction);
            applied++;
          }
          break;
        
        case 'update':
          if (rec.existingActionId && rec.quickAction) {
            await storage.updateQuickAction(rec.existingActionId, rec.quickAction);
            applied++;
          }
          break;
        
        case 'deactivate':
          if (rec.existingActionId) {
            await storage.updateQuickAction(rec.existingActionId, { isActive: false });
            applied++;
          }
          break;
      }
    } catch (error) {
      console.error('Failed to apply adaptive recommendation:', error);
      skipped++;
    }
  }
  
  return { applied, skipped };
}

// Generate AI instructions for managing adaptive quick actions
export function generateAdaptiveActionInstructions(): string {
  return `## Adaptive Quick Action Management

You can automatically suggest and create new quick action buttons based on user conversation patterns. Here's how:

**When to suggest new quick actions:**
- Users repeatedly ask about topics not covered by existing actions
- Common requests emerge from conversation patterns
- Users show interest in specific services or information

**How to analyze patterns:**
- Look for topics mentioned 2+ times in conversations
- Identify user intent (questions, requests, problems)
- Note keywords and phrases users commonly use

**Quick action guidelines:**
- Keep labels short and action-oriented (e.g., "Get Pricing", "Book Demo")
- Messages should be natural user requests
- Set appropriate context types: general, question, request, problem, pricing, scheduling
- Use relevant keywords that match user language
- Set suggestion weight 1-10 based on importance/frequency

**Context types:**
- **general**: Default category for broad topics
- **question**: When users are asking for information
- **request**: When users want something specific
- **problem**: When users need help with issues
- **pricing**: Cost and payment related topics
- **scheduling**: Appointments and time-related requests

**Example adaptive action:**
If users frequently ask "What's your pricing?" create:
- Label: "Get Pricing Info"
- Message: "Can you tell me about your pricing and packages?"
- Context: pricing
- Keywords: price, cost, fee, budget, payment, rates
- Weight: 7-8 (high priority for business)

Monitor conversation patterns and proactively suggest helpful quick actions to improve user experience.`;
}