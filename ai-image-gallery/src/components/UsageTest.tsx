import React, { useState } from 'react';
import { AzureVisionService } from '../services/azureVisionService';
import { useNotifications } from '../contexts/NotificationContext';

interface UsageTestProps {
  className?: string;
}

export const UsageTest: React.FC<UsageTestProps> = ({ className = '' }) => {
  const [isTesting, setIsTesting] = useState(false);
  const { addNotification } = useNotifications();

  const testUsageIncrement = async () => {
    setIsTesting(true);
    try {
      // Simulate incrementing usage
      AzureVisionService.incrementUsage();
      
      const stats = AzureVisionService.getUsageStats();
      
      addNotification({
        type: 'success',
        title: 'Usage Incremented',
        message: `Monthly: ${stats.monthly.used}/${stats.monthly.limit}, Daily: ${stats.daily.used}/${stats.daily.limit}`,
        duration: 5000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Test Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testCanMakeRequest = () => {
    const canMake = AzureVisionService.canMakeRequest();
    const stats = AzureVisionService.getUsageStats();
    
    addNotification({
      type: canMake ? 'success' : 'warning',
      title: 'Request Check',
      message: canMake 
        ? `Can make request. Monthly: ${stats.monthly.used}/${stats.monthly.limit}`
        : `Cannot make request. Monthly: ${stats.monthly.used}/${stats.monthly.limit}`,
      duration: 5000
    });
  };

  const resetUsage = () => {
    AzureVisionService.resetUsageCounters();
    addNotification({
      type: 'success',
      title: 'Usage Reset',
      message: 'Usage counters have been reset to 0',
      duration: 3000
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Tracking Test</h3>
      
      <div className="space-y-3">
        <button
          onClick={testUsageIncrement}
          disabled={isTesting}
          className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isTesting ? 'Testing...' : 'Increment Usage (Test)'}
        </button>
        
        <button
          onClick={testCanMakeRequest}
          className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          Check Can Make Request
        </button>
        
        <button
          onClick={resetUsage}
          className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Reset Usage Counters
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Usage</h4>
        <div className="text-sm text-gray-600">
          {(() => {
            const stats = AzureVisionService.getUsageStats();
            return (
              <div className="space-y-1">
                <div>Monthly: {stats.monthly.used} / {stats.monthly.limit}</div>
                <div>Daily: {stats.daily.used} / {stats.daily.limit}</div>
                <div>Hourly: {stats.hourly.used} / {stats.hourly.limit}</div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
