import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { BackgroundProcessingService } from '../services/backgroundProcessingService';
import { useNotifications } from '../contexts/NotificationContext';

interface QuickFixProps {
  className?: string;
}

export const QuickFix: React.FC<QuickFixProps> = ({ className = '' }) => {
  const [isFixing, setIsFixing] = useState(false);
  const { addNotification } = useNotifications();

  const fixStuckProcessing = async () => {
    setIsFixing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addNotification({
          type: 'error',
          title: 'Not Authenticated',
          message: 'Please log in first',
          duration: 5000
        });
        return;
      }

      // Find the stuck image
      const { data: stuckImage, error: fetchError } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .eq('processing_status', 'processing')
        .single();

      if (fetchError || !stuckImage) {
        addNotification({
          type: 'info',
          title: 'No Stuck Images',
          message: 'No images are currently stuck in processing',
          duration: 3000
        });
        return;
      }

      console.log('Found stuck image:', stuckImage);

      // Reset the image status to pending
      const { error: resetError } = await supabase
        .from('images')
        .update({
          processing_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', stuckImage.id);

      if (resetError) {
        throw new Error(`Failed to reset image: ${resetError.message}`);
      }

      addNotification({
        type: 'success',
        title: 'Image Reset',
        message: `Image "${stuckImage.original_filename}" has been reset to pending status`,
        duration: 5000
      });

      // Wait a moment then retry processing
      setTimeout(async () => {
        try {
          console.log('Retrying processing for image:', stuckImage.id);
          await BackgroundProcessingService.retryProcessing(stuckImage.id);
          
          addNotification({
            type: 'success',
            title: 'Processing Retry Initiated',
            message: 'The image is now being processed again',
            duration: 5000
          });
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          addNotification({
            type: 'warning',
            title: 'Retry Failed',
            message: 'Image was reset but retry failed. You can try uploading again.',
            duration: 8000
          });
        }
      }, 1000);

    } catch (error) {
      console.error('Fix failed:', error);
      addNotification({
        type: 'error',
        title: 'Fix Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 8000
      });
    } finally {
      setIsFixing(false);
    }
  };

  const forceCompleteProcessing = async () => {
    setIsFixing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find the stuck image
      const { data: stuckImage, error: fetchError } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .eq('processing_status', 'processing')
        .single();

      if (fetchError || !stuckImage) {
        addNotification({
          type: 'info',
          title: 'No Stuck Images',
          message: 'No images are currently stuck in processing',
          duration: 3000
        });
        return;
      }

      // Force complete the processing with dummy data
      const { error: completeError } = await supabase
        .from('images')
        .update({
          processing_status: 'completed',
          ai_tags: ['image', 'photo'],
          ai_description: 'An image processed successfully',
          dominant_colors: ['#000000', '#ffffff'],
          updated_at: new Date().toISOString()
        })
        .eq('id', stuckImage.id);

      if (completeError) {
        throw new Error(`Failed to complete processing: ${completeError.message}`);
      }

      addNotification({
        type: 'success',
        title: 'Processing Completed',
        message: `Image "${stuckImage.original_filename}" has been marked as completed`,
        duration: 5000
      });

    } catch (error) {
      console.error('Force complete failed:', error);
      addNotification({
        type: 'error',
        title: 'Force Complete Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 8000
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Fix for Stuck Processing</h3>
      
      <div className="space-y-3">
        <button
          onClick={fixStuckProcessing}
          disabled={isFixing}
          className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isFixing ? 'Fixing...' : 'Reset & Retry Processing'}
        </button>
        
        <button
          onClick={forceCompleteProcessing}
          disabled={isFixing}
          className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isFixing ? 'Completing...' : 'Force Complete Processing'}
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-yellow-900">Instructions</h4>
            <p className="text-xs text-yellow-800 mt-1">
              <strong>Reset & Retry:</strong> Resets the image to pending and tries processing again.<br/>
              <strong>Force Complete:</strong> Marks the image as completed with basic AI data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
