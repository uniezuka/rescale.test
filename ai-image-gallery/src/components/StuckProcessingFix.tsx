import React, { useState, useEffect } from 'react';
import { BackgroundProcessingService } from '../services/backgroundProcessingService';
import { supabase } from '../services/supabase';
import { useNotifications } from '../contexts/NotificationContext';

interface StuckProcessingFixProps {
  className?: string;
}

export const StuckProcessingFix: React.FC<StuckProcessingFixProps> = ({ className = '' }) => {
  const [stuckImages, setStuckImages] = useState<any[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const { addNotification } = useNotifications();

  const checkStuckProcessing = async () => {
    setIsChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find images stuck in processing for more than 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: stuckImagesData, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .eq('processing_status', 'processing')
        .lt('updated_at', fiveMinutesAgo)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error checking stuck images:', error);
        return;
      }

      setStuckImages(stuckImagesData || []);
      
      if (stuckImagesData && stuckImagesData.length > 0) {
        addNotification({
          type: 'warning',
          title: 'Stuck Processing Detected',
          message: `Found ${stuckImagesData.length} image(s) stuck in processing. You can retry them.`,
          duration: 8000
        });
      } else {
        addNotification({
          type: 'success',
          title: 'No Stuck Images',
          message: 'All images are processing normally.',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error checking stuck processing:', error);
      addNotification({
        type: 'error',
        title: 'Check Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000
      });
    } finally {
      setIsChecking(false);
    }
  };

  const retryStuckImage = async (imageId: string) => {
    try {
      await BackgroundProcessingService.retryProcessing(imageId);
      addNotification({
        type: 'success',
        title: 'Retry Initiated',
        message: 'Processing retry has been initiated for the stuck image.',
        duration: 5000
      });
      // Refresh the list
      checkStuckProcessing();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Retry Failed',
        message: error instanceof Error ? error.message : 'Failed to retry processing',
        duration: 8000
      });
    }
  };

  const resetStuckImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('images')
        .update({
          processing_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', imageId);

      if (error) {
        throw new Error(`Failed to reset image status: ${error.message}`);
      }

      addNotification({
        type: 'success',
        title: 'Image Reset',
        message: 'Image status has been reset to pending.',
        duration: 5000
      });
      
      // Refresh the list
      checkStuckProcessing();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Reset Failed',
        message: error instanceof Error ? error.message : 'Failed to reset image',
        duration: 8000
      });
    }
  };

  const retryAllStuckImages = async () => {
    for (const image of stuckImages) {
      try {
        await BackgroundProcessingService.retryProcessing(image.id);
      } catch (error) {
        console.error(`Failed to retry image ${image.id}:`, error);
      }
    }
    
    addNotification({
      type: 'success',
      title: 'Bulk Retry Complete',
      message: `Retry initiated for ${stuckImages.length} stuck images.`,
      duration: 5000
    });
    
    // Refresh the list
    checkStuckProcessing();
  };

  useEffect(() => {
    // Check for stuck images on component mount
    checkStuckProcessing();
  }, []);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Stuck Processing Fix</h3>
        <button
          onClick={checkStuckProcessing}
          disabled={isChecking}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isChecking ? 'Checking...' : 'Check Stuck Images'}
        </button>
      </div>

      {stuckImages.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-gray-900">
              Stuck Images ({stuckImages.length})
            </h4>
            <button
              onClick={retryAllStuckImages}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Retry All
            </button>
          </div>
          
          <div className="space-y-2">
            {stuckImages.map((image) => (
              <div key={image.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{image.original_filename}</p>
                  <p className="text-xs text-gray-500">
                    Stuck since: {new Date(image.updated_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Duration: {Math.round((Date.now() - new Date(image.updated_at).getTime()) / 60000)} minutes
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => retryStuckImage(image.id)}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => resetStuckImage(image.id)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stuckImages.length === 0 && !isChecking && (
        <div className="text-center py-4">
          <div className="text-green-600 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">No stuck images found</p>
          <p className="text-xs text-gray-500 mt-1">All images are processing normally</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900">About Stuck Processing</h4>
            <p className="text-xs text-blue-800 mt-1">
              Images stuck in "processing" status for more than 5 minutes are detected here. 
              You can retry them or reset their status to "pending".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
