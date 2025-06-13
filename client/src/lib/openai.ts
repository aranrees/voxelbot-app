// Client-side OpenAI utilities (though main chat logic is handled server-side)
// This file provides client-side types and utilities for OpenAI integration

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  error?: string;
}

// Client-side utility to format messages for display
export function formatChatMessage(content: string): string {
  // Basic formatting for chat messages
  return content.trim();
}

// Utility to validate message content
export function validateMessage(content: string): boolean {
  return content.trim().length > 0 && content.trim().length <= 4000;
}

// Utility to extract action items from AI responses
export function extractActions(content: string): string[] {
  const actions: string[] = [];
  
  if (content.toLowerCase().includes('download') || content.toLowerCase().includes('pdf')) {
    actions.push('download');
  }
  
  if (content.toLowerCase().includes('contact') || content.toLowerCase().includes('phone') || content.toLowerCase().includes('email')) {
    actions.push('contact');
  }
  
  if (content.toLowerCase().includes('appointment') || content.toLowerCase().includes('schedule') || content.toLowerCase().includes('meeting')) {
    actions.push('appointment');
  }
  
  return actions;
}

// Types for OpenAI responses
export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenAIResponse {
  choices: Array<{
    message: OpenAIMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Error handling utilities
export class OpenAIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'OpenAIError';
  }
}

export function isOpenAIError(error: unknown): error is OpenAIError {
  return error instanceof OpenAIError;
}
