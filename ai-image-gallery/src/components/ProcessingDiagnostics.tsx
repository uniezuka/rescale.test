import React, { useState } from 'react';
import { BackgroundProcessingService } from '../services/backgroundProcessingService';
import { AzureVisionService } from '../services/azureVisionService';
import { supabase } from '../services/supabase';
import { useNotifications } from '../contexts/NotificationContext';

interface ProcessingDiagnosticsProps {
  className?: string;
}

export const ProcessingDiagnostics: React.FC<ProcessingDiagnosticsProps> = ({ className = '' }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [failedImages, setFailedImages] = useState<any[]>([]);
  const { addNotification } = useNotifications();

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);
    const results: any[] = [];

    try {
      // 1. Check Azure Configuration
      results.push({
        test: 'Azure Configuration',
        status: 'checking',
        details: 'Checking Azure Computer Vision configuration...'
      });
      setDiagnostics([...results]);

      const azureEndpoint = import.meta.env.VITE_AZURE_CV_ENDPOINT;
      const azureKey = import.meta.env.VITE_AZURE_CV_KEY;

      if (!azureEndpoint || !azureKey) {
        results[results.length - 1] = {
          test: 'Azure Configuration',
          status: 'failed',
          details: 'Azure Computer Vision credentials not configured',
          solution: 'Add VITE_AZURE_CV_ENDPOINT and VITE_AZURE_CV_KEY to your .env.local file'
        };
      } else {
        results[results.length - 1] = {
          test: 'Azure Configuration',
          status: 'passed',
          details: 'Azure credentials are configured'
        };
      }
      setDiagnostics([...results]);

      // 2. Test Azure Connection
      results.push({
        test: 'Azure Connection',
        status: 'checking',
        details: 'Testing Azure Computer Vision connection...'
      });
      setDiagnostics([...results]);

      try {
        const isConnected = await AzureVisionService.testConnection();
        results[results.length - 1] = {
          test: 'Azure Connection',
          status: isConnected ? 'passed' : 'failed',
          details: isConnected ? 'Successfully connected to Azure Computer Vision' : 'Failed to connect to Azure Computer Vision',
          solution: isConnected ? null : 'Check your Azure endpoint and API key, ensure the service is active'
        };
      } catch (error) {
        results[results.length - 1] = {
          test: 'Azure Connection',
          status: 'failed',
          details: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          solution: 'Verify Azure Computer Vision service is active and credentials are correct'
        };
      }
      setDiagnostics([...results]);

      // 3. Check Usage Limits
      results.push({
        test: 'Usage Limits',
        status: 'checking',
        details: 'Checking Azure usage limits...'
      });
      setDiagnostics([...results]);

      try {
        const usageStats = AzureVisionService.getUsageStats();
        const monthlyPercentage = (usageStats.monthly.used / usageStats.monthly.limit) * 100;
        const dailyPercentage = (usageStats.daily.used / usageStats.daily.limit) * 100;

        if (monthlyPercentage >= 100 || dailyPercentage >= 100) {
          results[results.length - 1] = {
            test: 'Usage Limits',
            status: 'failed',
            details: `Usage limits exceeded: Monthly ${usageStats.monthly.used}/${usageStats.monthly.limit}, Daily ${usageStats.daily.used}/${usageStats.daily.limit}`,
            solution: 'Wait for limits to reset or upgrade to a paid plan'
          };
        } else {
          results[results.length - 1] = {
            test: 'Usage Limits',
            status: 'passed',
            details: `Usage within limits: Monthly ${usageStats.monthly.used}/${usageStats.monthly.limit}, Daily ${usageStats.daily.used}/${usageStats.daily.limit}`
          };
        }
      } catch (error) {
        results[results.length - 1] = {
          test: 'Usage Limits',
          status: 'error',
          details: `Failed to check usage limits: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
      setDiagnostics([...results]);

      // 4. Check Supabase Connection
      results.push({
        test: 'Supabase Connection',
        status: 'checking',
        details: 'Testing Supabase connection...'
      });
      setDiagnostics([...results]);

      try {
        const { error } = await supabase.from('images').select('count').limit(1);
        if (error) {
          results[results.length - 1] = {
            test: 'Supabase Connection',
            status: 'failed',
            details: `Supabase connection failed: ${error.message}`,
            solution: 'Check your Supabase URL and API key'
          };
        } else {
          results[results.length - 1] = {
            test: 'Supabase Connection',
            status: 'passed',
            details: 'Successfully connected to Supabase'
          };
        }
      } catch (error) {
        results[results.length - 1] = {
          test: 'Supabase Connection',
          status: 'failed',
          details: `Supabase test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          solution: 'Verify Supabase configuration and network connectivity'
        };
      }
      setDiagnostics([...results]);

      // 5. Check Failed Images
      results.push({
        test: 'Failed Images',
        status: 'checking',
        details: 'Checking for failed processing images...'
      });
      setDiagnostics([...results]);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: failedImagesData, error } = await supabase
            .from('images')
            .select('*')
            .eq('user_id', user.id)
            .eq('processing_status', 'failed')
            .order('updated_at', { ascending: false })
            .limit(10);

          if (error) {
            results[results.length - 1] = {
              test: 'Failed Images',
              status: 'error',
              details: `Failed to fetch failed images: ${error.message}`
            };
          } else {
            setFailedImages(failedImagesData || []);
            results[results.length - 1] = {
              test: 'Failed Images',
              status: failedImagesData?.length ? 'warning' : 'passed',
              details: `Found ${failedImagesData?.length || 0} failed images`,
              solution: failedImagesData?.length ? 'Review failed images and retry processing' : null
            };
          }
        } else {
          results[results.length - 1] = {
            test: 'Failed Images',
            status: 'error',
            details: 'User not authenticated'
          };
        }
      } catch (error) {
        results[results.length - 1] = {
          test: 'Failed Images',
          status: 'error',
          details: `Failed to check failed images: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
      setDiagnostics([...results]);

      // 6. Test FastAPI Backend Connection
      results.push({
        test: 'FastAPI Backend',
        status: 'checking',
        details: 'Testing FastAPI backend connection...'
      });
      setDiagnostics([...results]);

      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
        const response = await fetch(`${API_BASE_URL}/health`);

        if (!response.ok) {
          results[results.length - 1] = {
            test: 'FastAPI Backend',
            status: 'failed',
            details: `FastAPI backend not responding: ${response.statusText}`,
            solution: 'Start the FastAPI backend server or check the VITE_API_BASE_URL configuration'
          };
        } else {
          const healthData = await response.json();
          results[results.length - 1] = {
            test: 'FastAPI Backend',
            status: 'passed',
            details: `FastAPI backend is healthy: ${healthData.message}`
          };
        }
      } catch (error) {
        results[results.length - 1] = {
          test: 'FastAPI Backend',
          status: 'failed',
          details: `FastAPI backend test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          solution: 'Start the FastAPI backend server or check the VITE_API_BASE_URL configuration'
        };
      }
      setDiagnostics([...results]);

      // 7. Test Client-Side Processing (Fallback)
      results.push({
        test: 'Client-Side Processing',
        status: 'checking',
        details: 'Testing client-side Azure processing fallback...'
      });
      setDiagnostics([...results]);

      try {
        const testImageUrl = 'https://via.placeholder.com/150x150/000000/FFFFFF?text=Test';
        const result = await AzureVisionService.analyzeImage(testImageUrl);
        
        if (result && result.tags && result.tags.length > 0) {
          results[results.length - 1] = {
            test: 'Client-Side Processing',
            status: 'passed',
            details: 'Client-side processing is working correctly'
          };
        } else {
          results[results.length - 1] = {
            test: 'Client-Side Processing',
            status: 'failed',
            details: 'Client-side processing returned empty results',
            solution: 'Check Azure credentials and network connectivity'
          };
        }
      } catch (error) {
        results[results.length - 1] = {
          test: 'Client-Side Processing',
          status: 'failed',
          details: `Client-side processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          solution: 'Check Azure Computer Vision credentials and service status'
        };
      }
      setDiagnostics([...results]);

    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Diagnostics Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 8000
      });
    } finally {
      setIsRunning(false);
    }
  };

  const retryFailedImage = async (imageId: string) => {
    try {
      await BackgroundProcessingService.retryProcessing(imageId);
      addNotification({
        type: 'success',
        title: 'Retry Initiated',
        message: 'Processing retry has been initiated for the image',
        duration: 5000
      });
      // Refresh failed images
      runDiagnostics();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Retry Failed',
        message: error instanceof Error ? error.message : 'Failed to retry processing',
        duration: 8000
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>;
      case 'failed':
        return <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>;
      case 'warning':
        return <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>;
      case 'checking':
        return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Processing Diagnostics</h3>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </button>
      </div>

      {diagnostics.length > 0 && (
        <div className="space-y-3 mb-6">
          {diagnostics.map((diagnostic, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(diagnostic.status)}
                  <span className="text-sm font-medium text-gray-900">
                    {diagnostic.test}
                  </span>
                </div>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  diagnostic.status === 'passed' ? 'bg-green-100 text-green-800' :
                  diagnostic.status === 'failed' ? 'bg-red-100 text-red-800' :
                  diagnostic.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  diagnostic.status === 'checking' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {diagnostic.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{diagnostic.details}</p>
              {diagnostic.solution && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                  <strong>Solution:</strong> {diagnostic.solution}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {failedImages.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Failed Images</h4>
          <div className="space-y-2">
            {failedImages.map((image) => (
              <div key={image.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{image.original_filename}</p>
                  <p className="text-xs text-gray-500">
                    Failed on: {new Date(image.updated_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => retryFailedImage(image.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
                >
                  Retry
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
