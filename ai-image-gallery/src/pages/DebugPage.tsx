import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Breadcrumb } from '../components/Breadcrumb';
import { DebugPanel } from '../components/DebugPanel';
import { QuickFix } from '../components/QuickFix';
import { RealtimeDebug } from '../components/RealtimeDebug';
import { ProcessingStatus } from '../components/ProcessingStatus';

export const DebugPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You must be logged in to access debug tools.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Debug Tools
              </h1>
              <p className="text-gray-600">
                Development and debugging tools for AI Image Gallery
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> Debug tools are for development only!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Status */}
        <div className="mb-8">
          <ProcessingStatus />
        </div>

        {/* Quick Fix for Stuck Processing */}
        <div className="mb-8">
          <QuickFix />
        </div>

        {/* Real-time Debug Component */}
        <div className="mb-8">
          <RealtimeDebug />
        </div>

        {/* Debug Panel */}
        <div className="mb-8">
          <DebugPanel />
        </div>

        {/* Debug Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Available Debug Components</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• ProcessingStatus - Shows AI processing statistics</li>
                <li>• QuickFix - Fixes stuck processing images</li>
                <li>• RealtimeDebug - Tests real-time subscriptions</li>
                <li>• DebugPanel - Comprehensive debugging tools</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Azure Vision API testing</li>
                <li>• Usage statistics and limits</li>
                <li>• Real-time subscription testing</li>
                <li>• Processing diagnostics</li>
                <li>• Manual database updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
