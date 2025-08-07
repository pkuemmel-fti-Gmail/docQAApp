import React from 'react';
import { FileText, MessageSquare, Settings, Home } from 'lucide-react';

type Page = 'home' | 'documents' | 'chat' | 'settings';

interface HeaderProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onPageChange }) => {
  const navItems = [
    { id: 'home' as Page, label: 'Home', icon: Home },
    { id: 'documents' as Page, label: 'Documents', icon: FileText },
    { id: 'chat' as Page, label: 'Chat', icon: MessageSquare },
    { id: 'settings' as Page, label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">DTT Document Q&A</h1>
          </div>

          {/* Navigation */}
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};