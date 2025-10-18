import React, { useState } from 'react';
import { AITestingService, type TestResult } from '../services/aiTestingService';
import { AzureVisionService } from '../services/azureVisionService';
import { UsageStats } from './UsageStats';
import { ProcessingDiagnostics } from './ProcessingDiagnostics';
import { UsageTest } from './UsageTest';
import { StuckProcessingFix } from './StuckProcessingFix';
import { useNotifications } from '../contexts/NotificationContext';

interface DebugPanelProps {
  className?: string;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ className = '' }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const { addNotification } = useNotifications();

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      const results = await AITestingService.runAllTests();
      setTestResults(results);
      
      // Log results to console
      AITestingService.logTestResults(results);

      // Show notification
      const passedCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      addNotification({
        type: passedCount === totalCount ? 'success' : 'warning',
        title: 'AI Tests Complete',
        message: `${passedCount}/${totalCount} tests passed`,
        duration: 5000
      });

    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Test Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 8000
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Processing Debug Panel</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button
            onClick={runTests}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </button>
        </div>
      </div>

      {isRunning && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-sm text-blue-800">Running AI processing tests...</span>
          </div>
        </div>
      )}

      {testResults.length > 0 && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Test Summary</span>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>
                  ✅ {testResults.filter(r => r.success).length} passed
                </span>
                <span>
                  ❌ {testResults.filter(r => !r.success).length} failed
                </span>
                <span>
                  ⏱️ {formatDuration(testResults.reduce((sum, r) => sum + r.duration, 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.success)}
                    <span className="text-sm font-medium text-gray-900">
                      {result.testName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <span>{formatDuration(result.duration)}</span>
                    {result.error && (
                      <span className="text-red-600">Error</span>
                    )}
                  </div>
                </div>

                {result.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    {result.error}
                  </div>
                )}

                {showDetails && result.details && (
                  <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Diagnostics */}
      <div className="mt-4">
        <ProcessingDiagnostics />
      </div>

      {/* Stuck Processing Fix */}
      <div className="mt-4">
        <StuckProcessingFix />
      </div>

      {/* Usage Stats */}
      <div className="mt-4">
        <UsageStats />
      </div>

      {/* Usage Test */}
      <div className="mt-4">
        <UsageTest />
      </div>

      {/* Environment Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Environment Configuration</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">Azure Endpoint:</span>
            <span className="ml-1">
              {import.meta.env.VITE_AZURE_CV_ENDPOINT ? '✅ Configured' : '❌ Missing'}
            </span>
          </div>
          <div>
            <span className="font-medium">Azure Key:</span>
            <span className="ml-1">
              {import.meta.env.VITE_AZURE_CV_KEY ? '✅ Configured' : '❌ Missing'}
            </span>
          </div>
          <div>
            <span className="font-medium">Supabase URL:</span>
            <span className="ml-1">
              {import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing'}
            </span>
          </div>
          <div>
            <span className="font-medium">Supabase Key:</span>
            <span className="ml-1">
              {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing'}
            </span>
          </div>
        </div>
        
        {/* Usage Controls */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Usage Controls</span>
            <button
              onClick={() => {
                AzureVisionService.resetUsageCounters();
                addNotification({
                  type: 'success',
                  title: 'Usage Reset',
                  message: 'Azure Vision usage counters have been reset',
                  duration: 3000
                });
              }}
              className="text-xs text-red-600 hover:text-red-800 transition-colors"
            >
              Reset Counters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
