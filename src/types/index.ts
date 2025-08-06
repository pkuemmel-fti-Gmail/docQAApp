export interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  driveFileId: string;
  webViewLink: string;
  webContentLink: string;
  shareableLink: string;
  metadata?: {
    driveId: string;
    folderId?: string;
    createdTime: string;
  };
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  documentId?: string;
}

export interface ChatSession {
  id: string;
  documentId: string;
  messages: ChatMessage[];
  createdAt: Date;
}