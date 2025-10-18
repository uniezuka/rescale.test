import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { RealTimeService, type ProcessingUpdate } from '../services/realTimeService';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../contexts/NotificationContext';

interface RealtimeDebugProps {
  className?: string;
}

export const RealtimeDebug: React.FC<RealtimeDebugProps> = ({ className = '' }) => {
  const [lastUpdate, setLastUpdate] = useState<ProcessingUpdate | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!user) return;
    
    // Clean up existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    const unsubscribe = RealTimeService.subscribeToUserImageUpdates(user.id, (update: ProcessingUpdate) => {
      setLastUpdate(update);
      setUpdateCount(prev => prev + 1);
      
      addNotification({
        type: 'info',
        title: 'Real-time Update',
        message: `Image ${update.imageId.slice(0, 8)}... status: ${update.status}`,
        duration: 3000
      });
    });

    unsubscribeRef.current = unsubscribe;
    setIsSubscribed(true);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setIsSubscribed(false);
    };
  }, [user, addNotification]);

  const testDatabaseUpdate = async () => {
    if (!user) return;

    try {
      // Find a processing image and update it
      const { data: processingImage } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .eq('processing_status', 'processing')
        .single();

      if (processingImage) {
        const { error } = await supabase
          .from('images')
          .update({
            processing_status: 'completed',
            ai_tags: ['test', 'realtime', 'debug'],
            ai_description: 'Test real-time update from debug component',
            dominant_colors: ['#ff0000', '#00ff00', '#0000ff'],
            updated_at: new Date().toISOString()
          })
          .eq('id', processingImage.id);

        if (error) {
          console.error('Debug: Update failed:', error);
        }
      }
    } catch (error) {
      console.error('Debug: Test failed:', error);
    }
  };

  const getDebugInfo = () => {
    const info = RealTimeService.getDebugInfo();
    setDebugInfo(info);
  };

  const clearUpdates = () => {
    setLastUpdate(null);
    setUpdateCount(0);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Real-time Debug</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Updates: {updateCount}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={testDatabaseUpdate}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Test Update
        </button>
        
        <button
          onClick={getDebugInfo}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          Debug Info
        </button>
        
        <button
          onClick={clearUpdates}
          className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          Clear
        </button>
      </div>

      {lastUpdate && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Last Update:</h4>
          <div className="text-xs text-gray-600">
            <div><strong>Image:</strong> {lastUpdate.imageId.slice(0, 12)}...</div>
            <div><strong>Status:</strong> {lastUpdate.status}</div>
            <div><strong>Tags:</strong> {lastUpdate.tags?.length || 0}</div>
            <div><strong>Description:</strong> {lastUpdate.description ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}

      {debugInfo && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Info:</h4>
          <div className="text-xs text-gray-600">
            <div><strong>Subscriptions:</strong> {debugInfo.subscriptions.length}</div>
            <div><strong>Callbacks:</strong> {Object.keys(debugInfo.callbacks).length}</div>
          </div>
        </div>
      )}

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-yellow-900">Debug Instructions</h4>
            <p className="text-xs text-yellow-800 mt-1">
              Test real-time updates by clicking "Test Update" or upload a new image. 
              Watch the update counter and notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
