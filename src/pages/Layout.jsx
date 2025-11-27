
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Calendar, BookOpen } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Planning Hospital del Mar</span>
            </div>
            
            <div className="flex gap-1">
              <Link
                to={createPageUrl('Planning')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  currentPageName === 'Planning'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Planning
              </Link>
              
              <Link
                to={createPageUrl('Documentacio')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  currentPageName === 'Documentacio'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Documentació
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Page Content */}
      <main>
        {children}
      </main>
    </div>
  );
}
