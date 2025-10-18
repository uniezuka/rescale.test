import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { RealTimeService, type ProcessingUpdate } from '../services/realTimeService';
import { useAuth } from '../hooks/useAuth';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  // Add notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, notification.duration || 5000);
    }
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Set up real-time subscriptions for processing updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = RealTimeService.subscribeToProcessingUpdates((update: ProcessingUpdate) => {
      // Create notification based on processing update
      switch (update.status) {
        case 'completed':
          addNotification({
            type: 'success',
            title: 'Image Analysis Complete',
            message: `AI analysis completed for your image. Found ${update.tags?.length || 0} tags and extracted ${update.dominantColors?.length || 0} colors.`,
            duration: 5000
          });
          break;

        case 'failed':
          addNotification({
            type: 'error',
            title: 'Image Analysis Failed',
            message: 'Failed to analyze image. You can retry the processing.',
            duration: 8000,
            actions: [
              {
                label: 'Retry',
                action: () => {
                  // This would trigger a retry - implementation depends on your needs
                  console.log('Retry processing for image:', update.imageId);
                }
              }
            ]
          });
          break;

        case 'processing':
          addNotification({
            type: 'info',
            title: 'Processing Image',
            message: 'AI is analyzing your image. This may take a few moments.',
            duration: 3000
          });
          break;

        case 'deleted':
          addNotification({
            type: 'info',
            title: 'Image Deleted',
            message: 'The image has been successfully removed from your gallery.',
            duration: 3000
          });
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
