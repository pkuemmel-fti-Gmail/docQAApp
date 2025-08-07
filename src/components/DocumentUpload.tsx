import React, { useCallback } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { googleDriveService } from '../services/googleDriveService';
import { Document } from '../types';

interface DocumentUploadProps {
  onDocumentUpload: (document: Document) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onDocumentUpload }) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files.length) return;

    const file = files[0];
    
    // Check if it's a PDF
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are supported');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload to Google Drive
      const driveFile = await googleDriveService.uploadFile(file);
      
      // Create document object
      const document: Document = {
        id: driveFile.id,
        name: driveFile.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        driveFileId: driveFile.id,
        webViewLink: driveFile.webViewLink,
        webContentLink: driveFile.webContentLink,
        shareableLink: `https://drive.google.com/uc?id=${driveFile.id}&export=download`,
        metadata: {
          driveId: driveFile.id,
          createdTime: new Date().toISOString(),
        },
      };

      onDocumentUpload(document);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onDocumentUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-gray-700 rounded-full">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Upload PDF Document</h3>
            <p className="text-gray-400 mb-4">Drag and drop your PDF file here, or click to browse</p>
            
            <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
              <FileText className="w-4 h-4 mr-2" />
              Choose File
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Upload Status */}
      {isUploading && (
        <div className="flex items-center space-x-3 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <span className="text-blue-200">Uploading to Google Drive...</span>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center space-x-3 p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-200">{uploadError}</span>
        </div>
      )}

      {/* Info */}
      <div className="text-sm text-gray-400">
        <p>• Only PDF files are supported</p>
        <p>• Files are uploaded to your Google Drive</p>
        <p>• Maximum file size: 100MB</p>
      </div>
    </div>
  );
};