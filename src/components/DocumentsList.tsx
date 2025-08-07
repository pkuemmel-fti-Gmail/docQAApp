import React from 'react';
import { FileText, Trash2, MessageSquare, Calendar, HardDrive } from 'lucide-react';
import { DocumentUpload } from './DocumentUpload';
import { Document } from '../types';

interface DocumentsListProps {
  documents: Document[];
  onDocumentRemove: (documentId: string) => void;
  selectedDocumentId?: string;
  onDocumentSelect: (documentId: string) => void;
  onDocumentUpload: (document: Document) => void;
  onStartChatting: () => void;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({
  documents,
  onDocumentRemove,
  selectedDocumentId,
  onDocumentSelect,
  onDocumentUpload,
  onStartChatting,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Document Management</h1>
          <p className="text-gray-400">Upload and manage your PDF documents for AI analysis</p>
        </div>
        {documents.length > 0 && (
          <button
            onClick={onStartChatting}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Start Chatting</span>
          </button>
        )}
      </div>

      {/* Upload Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Upload New Document</h2>
        <DocumentUpload onDocumentUpload={onDocumentUpload} />
      </div>

      {/* Documents List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Your Documents ({documents.length})</h2>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="p-4 bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No documents yet</h3>
            <p className="text-gray-400">Upload your first PDF document to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {documents.map((document) => (
              <div
                key={document.id}
                className={`p-6 hover:bg-gray-750 transition-colors ${
                  selectedDocumentId === document.id ? 'bg-blue-900/20 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate">{document.name}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <HardDrive className="w-4 h-4" />
                          <span>{formatFileSize(document.size)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(document.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onDocumentSelect(document.id)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedDocumentId === document.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {selectedDocumentId === document.id ? 'Selected' : 'Select'}
                    </button>
                    
                    <button
                      onClick={() => onDocumentRemove(document.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove document"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};