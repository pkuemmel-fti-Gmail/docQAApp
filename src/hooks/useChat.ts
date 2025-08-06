import { useState, useCallback } from 'react';
import { ChatMessage, ChatSession } from '../types';
import { infraNodusService } from '../services/infraNodusService';

export const useChat = (documentId?: string, documents: Document[] = [], onKnowledgeGraphUpdate?: (data: any) => void) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingKnowledge, setIsAnalyzingKnowledge] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!documentId) return;

    const currentDocument = documents.find(doc => doc.id === documentId);
    if (!currentDocument) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      sender: 'user',
      timestamp: new Date(),
      documentId,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send to n8n workflow with document metadata
      console.log('Sending to n8n:', { question: content, document: currentDocument });
      const response = await sendToN8nWorkflow(content, currentDocument);
      console.log('Received from n8n:', response);
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: response,
        sender: 'assistant',
        timestamp: new Date(),
        documentId,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Generate knowledge graph analysis (fallback since InfraNodus is in n8n)
      if (onKnowledgeGraphUpdate) {
        setIsAnalyzingKnowledge(true);
        try {
          // For now, use fallback analysis. In production, your n8n workflow should
          // include InfraNodus analysis and return it as part of the response
          const knowledgeAnalysis = await infraNodusService.analyzeText(response);
          onKnowledgeGraphUpdate(knowledgeAnalysis);
        } catch (error) {
          console.error('Knowledge graph analysis failed:', error);
          const fallbackQuestions = await infraNodusService.generateFollowUpQuestions(response);
          onKnowledgeGraphUpdate({
            insights: { questions: fallbackQuestions, gaps: [], clusters: [] },
            graph: { nodes: [], edges: [] }
          });
        } finally {
          setIsAnalyzingKnowledge(false);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
        documentId,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [documentId, documents, onKnowledgeGraphUpdate]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    isAnalyzingKnowledge,
    clearMessages,
  };
};

// Send question and document metadata to n8n workflow
const sendToN8nWorkflow = async (question: string, document: Document): Promise<string> => {
  const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://punnet47spoke.app.n8n.cloud/webhook/96cfc630-3e1e-4f1e-ab6c-22bd88112f0c';
  
  console.log('Using webhook URL:', N8N_WEBHOOK_URL);
  
  const payload = {
    question,
    document: {
      id: document.id,
      name: document.name,
      type: document.type,
      size: document.size,
      driveFileId: document.driveFileId,
      webViewLink: document.webViewLink,
      webContentLink: document.webContentLink,
      shareableLink: document.shareableLink, // Direct download link for n8n
      uploadedAt: document.uploadedAt,
      metadata: document.metadata,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    console.log('Sending payload to n8n:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('N8n response status:', response.status);
    console.log('N8n response headers:', Object.fromEntries(response.headers.entries()));
    
    // Handle n8n responses - status 599 might still contain valid data
    if (!response.ok && response.status !== 599) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        console.error('Could not read error response:', e);
      }
      console.error('N8n error response:', errorText);
      throw new Error(`N8n webhook error (${response.status}): ${errorText || 'Unknown error'}`);
    }

    let responseText = '';
    try {
      responseText = await response.text();
      console.log('N8n raw response:', responseText);
    } catch (e) {
      console.error('Could not read response text:', e);
      throw new Error('Failed to read response from n8n webhook');
    }
    
    if (!responseText.trim()) {
      throw new Error('N8n webhook returned empty response. Please check if your n8n workflow is active and properly configured to return a response.');
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('N8n parsed response:', data);
    } catch (parseError) {
      console.error('Failed to parse n8n response as JSON:', parseError);
      console.log('Treating response as plain text since JSON parsing failed');
      // If it's not JSON, treat the response as plain text (but only if it's not empty)
      if (responseText.trim()) {
        return responseText.trim();
      } else {
        throw new Error('N8n webhook returned empty or invalid response');
      }
    }
    
    // Handle various n8n webhook response formats
    // Your n8n workflow returns { "output": "..." }
    const aiResponse = data.output || data.answer || data.response || data.result || data.message;
    
    if (!aiResponse) {
      console.warn('No AI response found in n8n data:', data);
      // If data exists but no recognized response field, return the whole object as string
      if (typeof data === 'object' && Object.keys(data).length > 0) {
        return `Received response from n8n but couldn't find expected response field. Data: ${JSON.stringify(data)}`;
      }
      return 'AI processing completed, but no response text was returned from n8n workflow.';
    }
    
    return aiResponse;
    
  } catch (error) {
    console.error('Error calling n8n workflow:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to n8n webhook. Please check if the webhook URL is correct and accessible.');
    }
    
    if (error.message.includes('JSON') || error.message.includes('empty response')) {
      throw new Error('N8n webhook issue: The workflow may be inactive, not properly configured, or returning invalid data. Please check your n8n workflow.');
    }
    
    // Re-throw the error with the original message if it's already descriptive
    throw error;
  }
};