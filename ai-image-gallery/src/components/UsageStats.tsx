import React, { useState, useEffect } from 'react';
import { AzureVisionService } from '../services/azureVisionService';

interface UsageStatsProps {
  className?: string;
}

export const UsageStats: React.FC<UsageStatsProps> = ({ className = '' }) => {
  const [usageStats, setUsageStats] = useState(AzureVisionService.getUsageStats());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStats = () => {
    setIsRefreshing(true);
    setUsageStats(AzureVisionService.getUsageStats());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    // Refresh stats every 30 seconds
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-50';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Azure Vision Usage</h3>
        <button
          onClick={refreshStats}
          disabled={isRefreshing}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Monthly Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Monthly Usage</span>
            <span className={`text-sm px-2 py-1 rounded-full ${getUsageColor(getUsagePercentage(usageStats.monthly.used, usageStats.monthly.limit))}`}>
              {usageStats.monthly.used} / {usageStats.monthly.limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(getUsagePercentage(usageStats.monthly.used, usageStats.monthly.limit))}`}
              style={{ width: `${getUsagePercentage(usageStats.monthly.used, usageStats.monthly.limit)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {usageStats.monthly.remaining} requests remaining this month
          </p>
        </div>

        {/* Daily Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Daily Usage</span>
            <span className={`text-sm px-2 py-1 rounded-full ${getUsageColor(getUsagePercentage(usageStats.daily.used, usageStats.daily.limit))}`}>
              {usageStats.daily.used} / {usageStats.daily.limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(getUsagePercentage(usageStats.daily.used, usageStats.daily.limit))}`}
              style={{ width: `${getUsagePercentage(usageStats.daily.used, usageStats.daily.limit)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {usageStats.daily.remaining} requests remaining today
          </p>
        </div>

        {/* Hourly Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Hourly Usage</span>
            <span className={`text-sm px-2 py-1 rounded-full ${getUsageColor(getUsagePercentage(usageStats.hourly.used, usageStats.hourly.limit))}`}>
              {usageStats.hourly.used} / {usageStats.hourly.limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(getUsagePercentage(usageStats.hourly.used, usageStats.hourly.limit))}`}
              style={{ width: `${getUsagePercentage(usageStats.hourly.used, usageStats.hourly.limit)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {usageStats.hourly.remaining} requests remaining this hour
          </p>
        </div>
      </div>

      {/* Free Tier Information */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900">Free Tier Limits</h4>
            <p className="text-xs text-blue-800 mt-1">
              Azure Computer Vision Free Tier: 10,000 predictions per month
              <br />
              Current limits are set to 80% of free tier to prevent billing
            </p>
          </div>
        </div>
      </div>

      {/* Warning if approaching limits */}
      {(getUsagePercentage(usageStats.monthly.used, usageStats.monthly.limit) >= 75 ||
        getUsagePercentage(usageStats.daily.used, usageStats.daily.limit) >= 75) && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-900">Approaching Limits</h4>
              <p className="text-xs text-yellow-800 mt-1">
                You're approaching your free tier limits. Consider upgrading to a paid plan or wait for the next billing cycle.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
