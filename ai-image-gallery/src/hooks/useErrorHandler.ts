import { useToast } from '../contexts/ToastContext';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  context?: string;
}

export const useErrorHandler = () => {
  const { addToast } = useToast();

  const handleError = (
    error: Error | unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      context = 'Unknown'
    } = options;

    // Convert unknown error to Error instance
    const errorInstance = error instanceof Error 
      ? error 
      : new Error(String(error));

    // Log error for debugging
    if (logError) {
      console.error(`Error in ${context}:`, errorInstance);
    }

    // Show user-friendly toast
    if (showToast) {
      addToast({
        type: 'error',
        title: 'Something went wrong',
        message: errorInstance.message || 'An unexpected error occurred',
        duration: 6000
      });
    }

    return errorInstance;
  };

  const handleAsyncError = async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, options);
      return null;
    }
  };

  return {
    handleError,
    handleAsyncError
  };
};
