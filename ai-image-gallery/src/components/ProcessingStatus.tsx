import React from 'react';
import { useAIProcessing } from '../hooks/useAIProcessing';

interface ProcessingStatusProps {
  className?: string;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ className = '' }) => {
  const { stats, isLoading, error, processPendingImages, refreshStats } = useAIProcessing();

  const handleTestConnection = async () => {
    try {
      console.log('Testing real-time connection...');
      const { RealTimeService } = await import('../services/realTimeService');
      const isConnected = await RealTimeService.testConnection();
      console.log('Real-time connection test result:', isConnected);
      alert(`Real-time connection: ${isConnected ? 'Connected' : 'Failed'}`);
    } catch (err) {
      console.error('Connection test failed:', err);
      alert('Connection test failed');
    }
  };

  const handleRetryAll = async () => {
    // This would retry all failed images
    // For now, we'll just refresh the stats
    await refreshStats();
  };

  const handleProcessPending = async () => {
    await processPendingImages();
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-3" />
          <span className="text-sm text-gray-600">Loading processing status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Processing Status</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleTestConnection}
            className="text-sm text-green-600 hover:text-green-800 transition-colors"
          >
            Test Connection
          </button>
          <button
            onClick={refreshStats}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Images</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          <div className="text-sm text-gray-500">Processing</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
      </div>

      {/* Failed Images */}
      {stats.failed > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-800">
                {stats.failed} image{stats.failed !== 1 ? 's' : ''} failed processing
              </span>
            </div>
            <button
              onClick={handleRetryAll}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              Retry All
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {stats.pending > 0 && (
        <div className="flex space-x-2">
          <button
            onClick={handleProcessPending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Process Pending ({stats.pending})
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {stats.total > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Processing Progress</span>
            <span>{Math.round((stats.completed / stats.total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(stats.completed / stats.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
