interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  createdTime: string;
  webViewLink: string;
  webContentLink: string;
}

class GoogleDriveService {
  private gapi: any = null;
  private isInitialized = false;
  private isAuthenticated = false;

  constructor() {
    this.loadGoogleAPI();
  }

  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google API can only be loaded in browser environment'));
        return;
      }

      // Check if gapi is already loaded
      if (window.gapi) {
        this.gapi = window.gapi;
        resolve();
        return;
      }

      // Load the Google API script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        this.gapi = window.gapi;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Google API'));
      };
      document.head.appendChild(script);
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadGoogleAPI();
      
      await new Promise<void>((resolve, reject) => {
        this.gapi.load('auth2:client', {
          callback: resolve,
          onerror: reject,
        });
      });

      await this.gapi.client.init({
        apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: 'https://www.googleapis.com/auth/drive.file',
      });

      this.isInitialized = true;
      this.isAuthenticated = this.gapi.auth2.getAuthInstance().isSignedIn.get();
    } catch (error) {
      console.error('Failed to initialize Google Drive API:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.isInitialized;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticated && this.gapi?.auth2?.getAuthInstance()?.isSignedIn?.get();
  }

  async authenticate(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const authInstance = this.gapi.auth2.getAuthInstance();
    
    if (!authInstance.isSignedIn.get()) {
      await authInstance.signIn();
    }
    
    this.isAuthenticated = authInstance.isSignedIn.get();
  }

  async uploadFile(file: File): Promise<GoogleDriveFile> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Google Drive');
    }

    const metadata = {
      name: file.name,
      parents: [], // Upload to root folder
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`,
      },
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Get additional file metadata
    const fileResponse = await this.gapi.client.drive.files.get({
      fileId: result.id,
      fields: 'id,name,mimeType,size,createdTime,webViewLink,webContentLink',
    });

    return fileResponse.result;
  }

  async listDocuments(): Promise<GoogleDriveFile[]> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Google Drive');
    }

    const response = await this.gapi.client.drive.files.list({
      q: "mimeType='application/pdf'",
      fields: 'files(id,name,mimeType,size,createdTime,webViewLink,webContentLink)',
      orderBy: 'createdTime desc',
    });

    return response.result.files || [];
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Google Drive');
    }

    await this.gapi.client.drive.files.delete({
      fileId: fileId,
    });
  }
}

export const googleDriveService = new GoogleDriveService();