import { useState, useCallback } from 'react';
import { ChatMessage, ChatSession } from '../types';
import { googleKnowledgeGraphService } from '../services/googleKnowledgeGraphService';
import { Document } from '../types';

export const useChat = (documentId?: string, documents: Document[] = [], onKnowledgeGraphUpdate?: (data: any) => void) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingKnowledge, setIsAnalyzingKnowledge] = useState(false);
  const [knowledgeGraphData, setKnowledgeGraphData] = useState<any>(null);

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
      const webhookResponse = await sendToN8nWorkflow(content, currentDocument);
      console.log('Received from n8n:', webhookResponse);
      
      // Handle both old format (string) and new format (object)
      let aiResponse: string;
      
      if (typeof webhookResponse === 'string') {
        // Simple format - just text response
        aiResponse = webhookResponse;
      } else if (webhookResponse && typeof webhookResponse === 'object') {
        // Object format - extract the text response
        aiResponse = webhookResponse.output || webhookResponse.answer || webhookResponse.response || 'No response text found';
      } else {
        aiResponse = 'Received invalid response format from n8n workflow';
      }
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: aiResponse,
        sender: 'assistant',
        timestamp: new Date(),
        documentId,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // ALWAYS run Google Knowledge Graph analysis on the AI response
      console.log('🧠 STARTING knowledge graph analysis for AI response...');
      console.log('🧠 AI Response length:', aiResponse.length);
      console.log('🧠 AI Response preview:', aiResponse.substring(0, 200) + '...');
      
      setIsAnalyzingKnowledge(true);
      
      // Run analysis in background without blocking UI
      setTimeout(async () => {
        try {
          console.log('🧠 Calling googleKnowledgeGraphService.analyzeText...');
          const knowledgeAnalysis = await googleKnowledgeGraphService.analyzeText(aiResponse);
          console.log('🧠 Knowledge graph analysis COMPLETE:', knowledgeAnalysis);
          console.log('🧠 Analysis has nodes:', knowledgeAnalysis?.graph?.nodes?.length || 0);
          console.log('🧠 Analysis has insights:', knowledgeAnalysis?.insights?.questions?.length || 0);
          
          setKnowledgeGraphData(knowledgeAnalysis);
          console.log('🧠 Knowledge graph data SET in state');
          
        } catch (error) {
          console.error('🧠 Knowledge graph analysis FAILED:', error);
          
          // Create a simple fallback with test data
          const fallbackData = {
            graph: {
              nodes: [
                { id: 'test1', label: 'Test Entity 1', size: 10, color: '#3B82F6', cluster: 0, type: 'Entity', score: 1 },
                { id: 'test2', label: 'Test Entity 2', size: 8, color: '#10B981', cluster: 1, type: 'Concept', score: 0.8 }
              ],
              edges: [
                { source: 'test1', target: 'test2', weight: 0.5, relationship: 'related' }
              ]
            },
            insights: {
              questions: ['What is the relationship between these concepts?', 'How do these entities connect?'],
              gaps: ['More context needed'],
              clusters: [{ id: 0, label: 'Test Cluster', concepts: ['Test Entity 1', 'Test Entity 2'] }]
            },
            summary: 'Fallback test analysis generated',
            metadata: { entityCount: 2, timestamp: Date.now().toString(), source: 'fallback-test' }
          };
          
          console.log('🧠 Using FALLBACK test data:', fallbackData);
          setKnowledgeGraphData(fallbackData);
          
        } finally {
          setIsAnalyzingKnowledge(false);
          console.log('🧠 Analysis complete, isAnalyzingKnowledge set to false');
        }
      }, 100); // Small delay to ensure UI updates
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
    setKnowledgeGraphData(null);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    isAnalyzingKnowledge,
    knowledgeGraphData,
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
    
    // Return the entire response object so we can extract both text and knowledge graph data
    return data;
    
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