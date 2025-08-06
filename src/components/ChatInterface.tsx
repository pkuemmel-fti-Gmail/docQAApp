import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Bot, User } from 'lucide-react';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  selectedDocumentName?: string;
  onKnowledgeGraphUpdate?: (data: any) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  selectedDocumentName,
  onKnowledgeGraphUpdate,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzingKnowledge, setIsAnalyzingKnowledge] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      const message = inputMessage.trim();
      setInputMessage('');
      
      // Send message and handle knowledge graph analysis
      onSendMessage(message);
      
      if (onKnowledgeGraphUpdate) {
        setIsAnalyzingKnowledge(true);
        // The knowledge graph analysis will be handled in the useChat hook
        setTimeout(() => setIsAnalyzingKnowledge(false), 3000); // Reset after 3 seconds
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-xl border border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-700 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-600 rounded-lg">
            <MessageSquare className="w-5 h-5 text-gray-300" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">Document Assistant</h3>
            {selectedDocumentName && (
              <p className="text-sm text-gray-400 font-medium">Analyzing: {selectedDocumentName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-96 bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-700 rounded-xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Bot className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="font-semibold text-white mb-3 text-lg">Ready to analyze your document</h4>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
              {selectedDocumentName
                ? "Ask me anything about your document!"
                : "Upload a document to start asking questions."}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-3xl ${
                message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`p-2.5 rounded-xl shadow-lg ${
                  message.sender === 'user' 
                    ? 'bg-blue-600' 
                    : 'bg-gray-700'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-gray-300" />
                  )}
                </div>
                
                <div className={`p-4 rounded-2xl shadow-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-white border border-gray-700'
                }`}>
                  {message.sender === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  )}
                  <p className={`text-xs mt-2 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-3xl">
              <div className="p-2.5 rounded-xl bg-gray-700">
                <Bot className="w-4 h-4 text-gray-300" />
              </div>
              <div className="p-4 rounded-2xl bg-gray-800 border border-gray-700">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {isAnalyzingKnowledge && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-3xl">
              <div className="p-2.5 rounded-xl bg-purple-600">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="p-4 rounded-2xl bg-purple-900/20 border border-purple-700/30">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-purple-200 text-sm ml-2">Analyzing knowledge patterns...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-gray-700 bg-gray-800 rounded-b-xl">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={selectedDocumentName ? "Ask a question about your document..." : "Upload a document first..."}
            disabled={!selectedDocumentName || isLoading}
            className="flex-1 px-5 py-3.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-600 disabled:cursor-not-allowed font-medium"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || !selectedDocumentName || isLoading}
            className="px-6 py-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};