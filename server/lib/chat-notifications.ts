import fs from "fs";
import path from "path";

export interface CompletedChatData {
  sessionId: string;
  messageCount: number;
  startTime: Date;
  endTime: Date;
  durationMs: number;
  transcript: string;
}

export interface ChatMessage {
  timestamp: Date;
  role: string;
  content: string;
}

export async function createChatNotificationFiles(completedChat: CompletedChatData, messages: ChatMessage[]) {
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

Recent messages:
${messages.slice(-3).map(msg => `[${msg.role.toUpperCase()}]: ${msg.content.substring(0, 100)}...`).join('\n')}
`;
    
    const summaryFile = path.join(notificationsDir, 'latest-chat.txt');
    fs.writeFileSync(summaryFile, summary);
    
    // Create webhook notification file (can be monitored by external systems)
    const webhookData = {
      type: "chat_completed",
      timestamp: new Date().toISOString(),
      sessionId: completedChat.sessionId,
      messageCount: completedChat.messageCount,
      durationMinutes: Math.round(completedChat.durationMs / 1000 / 60),
      transcriptFile: filename
    };
    
    const webhookFile = path.join(notificationsDir, 'webhook-notifications.jsonl');
    fs.appendFileSync(webhookFile, JSON.stringify(webhookData) + '\n');
    
    console.log(`Chat notification created: ${filename}`);
    return { success: true, filename };
  } catch (error) {
    console.error('Failed to create notification files:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}