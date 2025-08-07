import React, { useState } from 'react';
import { Header } from './components/Header';
import { DocumentsList } from './components/DocumentsList';
import { ChatPage } from './components/ChatPage';
import { SettingsPage } from './components/SettingsPage';
import { useChat } from './hooks/useChat';
import { googleDriveService } from './services/googleDriveService';
import { Document } from './types';
import { FileText } from 'lucide-react';

type Page = 'home' | 'documents' | 'chat' | 'settings';

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(googleDriveService.isAuthenticated());
  
  const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);
  
  const { messages, sendMessage, isLoading, clearMessages, knowledgeGraphData } = useChat(
    selectedDocumentId,
    documents
  );

  // Initialize Google Drive on component mount
  React.useEffect(() => {
    const initializeGoogleDrive = async () => {
      try {
        await googleDriveService.initialize();
        setIsAuthenticated(googleDriveService.isAuthenticated());
      } catch (error) {
        console.error('Failed to initialize Google Drive:', error);
      }
    };
    initializeGoogleDrive();
  }, []);

  const handleGoogleDriveLogin = async () => {
    try {
      // Check if Google Drive is properly initialized
      if (!googleDriveService.isInitialized()) {
        await googleDriveService.initialize();
      }
      
      await googleDriveService.authenticate();
      setIsAuthenticated(googleDriveService.isAuthenticated());
      
      // Load existing documents after authentication
      await loadExistingDocuments();
      
      // Navigate to documents page after successful login
      setCurrentPage('documents');
    } catch (error) {
      console.error('Authentication failed:', error);
      alert(`Google Drive authentication failed: ${error.message}`);
    }
  };

  const loadExistingDocuments = async () => {
    try {
      const driveFiles = await googleDriveService.listDocuments();
      const newDocuments: Document[] = driveFiles
        .filter(file => file.mimeType === 'application/pdf') // Only PDFs
        .map(file => ({
          id: file.id,
          name: file.name,
          size: parseInt(file.size) || 0,
          type: file.mimeType,
          uploadedAt: new Date(file.createdTime),
          driveFileId: file.id,
          webViewLink: file.webViewLink,
          webContentLink: file.webContentLink,
          shareableLink: `https://drive.google.com/uc?id=${file.id}&export=download`,
          metadata: {
            driveId: file.id,
            createdTime: file.createdTime,
          },
        }));
      
      newDocuments.forEach(doc => handleDocumentUpload(doc));
    } catch (error) {
      console.error('Error loading existing documents:', error);
    }
  };
  const handleDocumentUpload = (document: Document) => {
    setDocuments(prev => [...prev, document]);
    // Auto-select the first uploaded document
    if (!selectedDocumentId) {
      setSelectedDocumentId(document.id);
    }
  };

  const handleDocumentRemove = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    if (selectedDocumentId === documentId) {
      const remainingDocs = documents.filter(doc => doc.id !== documentId);
      setSelectedDocumentId(remainingDocs.length > 0 ? remainingDocs[0].id : undefined);
      clearMessages();
    }
  };

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocumentId(documentId);
    clearMessages();
  };

  const onPageChange = (page: Page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'documents':
        return (
          <DocumentsList
            documents={documents}
            onDocumentRemove={handleDocumentRemove}
            selectedDocumentId={selectedDocumentId}
            onDocumentSelect={handleDocumentSelect}
            onDocumentUpload={handleDocumentUpload}
            onStartChatting={() => onPageChange('chat')}
          />
        );
      case 'chat':
        return (
          <ChatPage
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
            selectedDocument={selectedDocument}
            documents={documents}
            onDocumentSelect={handleDocumentSelect}
            knowledgeGraphData={knowledgeGraphData}
          />
        );
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center relative">
            {/* Main Content */}
            <div className="text-center mb-12">
              <div className="mb-8">
                <img 
                  src="/ftiLogo.png" 
                  alt="DocPalAi Logo" 
                  className="w-20 h-20 mx-auto mb-6 rounded-lg shadow-lg"
                />
                <h1 className="text-4xl font-bold text-white mb-4">DTT Internal Document Q&A Tool</h1>
                <p className="text-gray-400 text-lg max-w-md mx-auto">
                  AI-powered document analysis and chat interface
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {isAuthenticated ? (
                  <button
                    onClick={() => onPageChange('documents')}
                    className="flex items-center space-x-3 px-6 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl transition-all duration-200 text-white min-w-[200px]"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Manage Documents</span>
                  </button>
                ) : (
                  <button
                    onClick={handleGoogleDriveLogin}
                    className="flex items-center space-x-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-xl transition-all duration-200 text-white min-w-[200px]"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Login to Google Drive to Begin</span>
                  </button>
                )}
              </div>
              
              {/* Quick Stats */}
              <div className="flex justify-center space-x-8 text-sm text-gray-500">
                <div className="text-center">
                  <div className="text-white font-semibold text-lg">{documents.length}</div>
                  <div>Documents</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold text-lg">{messages.length}</div>
                  <div>Messages</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold text-lg">PDF</div>
                  <div>Supported</div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header currentPage={currentPage} onPageChange={onPageChange} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;