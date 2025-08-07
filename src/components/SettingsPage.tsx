import React from 'react';
import { Settings, Key, Globe, Database, AlertCircle, CheckCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [apiKeys, setApiKeys] = React.useState({
    googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    n8nWebhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || '',
  });

  const handleApiKeyChange = (key: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [key]: value }));
  };

  const isConfigured = (value: string) => value && value.trim() !== '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Configure your API keys and application settings</p>
      </div>

      {/* API Configuration */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Key className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-white">API Configuration</h2>
        </div>

        <div className="space-y-6">
          {/* Google API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Google API Key
              {isConfigured(apiKeys.googleApiKey) ? (
                <CheckCircle className="inline w-4 h-4 text-green-500 ml-2" />
              ) : (
                <AlertCircle className="inline w-4 h-4 text-amber-500 ml-2" />
              )}
            </label>
            <input
              type="password"
              value={apiKeys.googleApiKey}
              onChange={(e) => handleApiKeyChange('googleApiKey', e.target.value)}
              placeholder="Enter your Google API key"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Used for Google Drive integration and Knowledge Graph API
            </p>
          </div>

          {/* Google Client ID */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Google Client ID
              {isConfigured(apiKeys.googleClientId) ? (
                <CheckCircle className="inline w-4 h-4 text-green-500 ml-2" />
              ) : (
                <AlertCircle className="inline w-4 h-4 text-amber-500 ml-2" />
              )}
            </label>
            <input
              type="text"
              value={apiKeys.googleClientId}
              onChange={(e) => handleApiKeyChange('googleClientId', e.target.value)}
              placeholder="Enter your Google Client ID"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Required for Google Drive authentication
            </p>
          </div>

          {/* N8n Webhook URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              N8n Webhook URL
              {isConfigured(apiKeys.n8nWebhookUrl) ? (
                <CheckCircle className="inline w-4 h-4 text-green-500 ml-2" />
              ) : (
                <AlertCircle className="inline w-4 h-4 text-amber-500 ml-2" />
              )}
            </label>
            <input
              type="url"
              value={apiKeys.n8nWebhookUrl}
              onChange={(e) => handleApiKeyChange('n8nWebhookUrl', e.target.value)}
              placeholder="Enter your N8n webhook URL"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Webhook endpoint for document processing workflow
            </p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Database className="w-6 h-6 text-green-500" />
          <h2 className="text-xl font-semibold text-white">System Status</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">Google Drive</span>
              {isConfigured(apiKeys.googleApiKey) && isConfigured(apiKeys.googleClientId) ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <p className="text-xs text-gray-400">
              {isConfigured(apiKeys.googleApiKey) && isConfigured(apiKeys.googleClientId)
                ? 'Configured'
                : 'Missing API credentials'}
            </p>
          </div>

          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">N8n Workflow</span>
              {isConfigured(apiKeys.n8nWebhookUrl) ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <p className="text-xs text-gray-400">
              {isConfigured(apiKeys.n8nWebhookUrl) ? 'Configured' : 'Missing webhook URL'}
            </p>
          </div>

          <div className="p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">Knowledge Graph</span>
              {isConfigured(apiKeys.googleApiKey) ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <p className="text-xs text-gray-400">
              {isConfigured(apiKeys.googleApiKey) ? 'Available' : 'Requires Google API key'}
            </p>
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Globe className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-blue-200 font-medium mb-1">Environment Variables</h3>
            <p className="text-blue-300 text-sm">
              These settings are loaded from your environment variables (.env file). 
              Changes here are for display only and won't persist after refresh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};