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

export interface WebhookResponse {
  output: string;
  followUpQuestions: Array<{
    text: string;
    finish_reason: string;
  }>;
  hasGraph: boolean;
  graphData: {
    summary: string;
    fullGraph: {
      nodes: Array<{
        id: string;
        label: string;
        size: number;
        color: string;
        cluster: number;
      }>;
      edges: Array<{
        source: string;
        target: string;
        weight: number;
      }>;
    };
    mainConcepts: string[];
    contentGaps: string[];
  };
  metadata: {
    questionCount: number;
    usage: number;
    timestamp: string;
  };
}