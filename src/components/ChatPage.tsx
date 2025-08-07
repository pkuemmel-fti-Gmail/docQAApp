import React from 'react';
import { ChatInterface } from './ChatInterface';
import { KnowledgeGraph } from './KnowledgeGraph';
import { useChat } from '../hooks/useChat';
import { ChatMessage, Document } from '../types';
import { FileText } from 'lucide-react';

interface ChatPageProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  selectedDocument?: Document;
  documents: Document[];
  onDocumentSelect: (documentId: string) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  messages,
  onSendMessage,
  isLoading,
  selectedDocument,
  documents,
  onDocumentSelect,
}) => {
  const [showKnowledgeGraph, setShowKnowledgeGraph] = React.useState(false);

  // Get knowledge graph data from the chat hook
  const { knowledgeGraphData } = useChat(selectedDocument?.id, documents);

  const handleSuggestedQuestion = (question: string) => {
    setShowKnowledgeGraph(false);
    onSendMessage(question);
  };

  // Auto-show knowledge graph when data is available
  React.useEffect(() => {
    console.log('ChatPage: Knowledge graph data changed:', knowledgeGraphData);
    if (knowledgeGraphData && !showKnowledgeGraph) {
      console.log('Auto-showing knowledge graph with data:', knowledgeGraphData);
      setShowKnowledgeGraph(true);
    }
  }, [knowledgeGraphData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Document Chat</h1>
          <p className="text-gray-400">Ask questions about your PDF documents and get AI-powered insights</p>
        </div>
      </div>

      {/* PDF Notice */}
      <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          <p className="text-amber-200 text-sm font-medium">
            Chat functionality works with PDF documents only
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document Selector */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Select Document</h3>
            
            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => onDocumentSelect(doc.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedDocument?.id === doc.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium truncate">{doc.name}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {doc.uploadedAt.toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No PDF documents available</p>
                <p className="text-gray-500 text-xs mt-1">Upload documents from the Documents page</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <div className="h-[calc(100vh-16rem)]">
            <ChatInterface
              messages={messages}
              onSendMessage={onSendMessage}
              isLoading={isLoading}
              selectedDocumentName={selectedDocument?.name}
            />
          </div>
        </div>
      </div>

      {/* Knowledge Graph Modal */}
      <KnowledgeGraph
        graphData={knowledgeGraphData}
        onQuestionClick={handleSuggestedQuestion}
        isVisible={showKnowledgeGraph}
        onToggle={() => setShowKnowledgeGraph(!showKnowledgeGraph)}
      />
    </div>
  );
};