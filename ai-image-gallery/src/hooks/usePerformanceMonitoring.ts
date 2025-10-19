import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  bundleSize?: number;
}

interface PerformanceConfig {
  enableMonitoring: boolean;
  logMetrics: boolean;
  reportToAnalytics?: boolean;
}

export const usePerformanceMonitoring = (config: PerformanceConfig = { enableMonitoring: true, logMetrics: false }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
  });

  useEffect(() => {
    if (!config.enableMonitoring) return;

    const startTime = performance.now();

    // Monitor page load time
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      
      // Get memory usage if available
      const memoryUsage = (performance as any).memory?.usedJSHeapSize;
      
      setMetrics(prev => ({
        ...prev,
        loadTime,
        memoryUsage,
      }));

      if (config.logMetrics) {
        console.log('Performance Metrics:', {
          loadTime: `${loadTime.toFixed(2)}ms`,
          memoryUsage: memoryUsage ? `${(memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A',
        });
      }
    };

    // Monitor render time
    const measureRenderTime = () => {
      const renderStart = performance.now();
      
      requestAnimationFrame(() => {
        const renderTime = performance.now() - renderStart;
        
        setMetrics(prev => ({
          ...prev,
          renderTime,
        }));

        if (config.logMetrics) {
          console.log('Render Time:', `${renderTime.toFixed(2)}ms`);
        }
      });
    };

    // Set up event listeners
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    // Measure initial render
    measureRenderTime();

    // Cleanup
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, [config.enableMonitoring, config.logMetrics]);

  // Monitor bundle size (approximate)
  useEffect(() => {
    if (!config.enableMonitoring) return;

    const estimateBundleSize = () => {
      // This is a rough estimate based on script tags
      const scripts = document.querySelectorAll('script[src]');
      let totalSize = 0;
      
      scripts.forEach(script => {
        const src = script.getAttribute('src');
        if (src && src.includes('assets')) {
          // Estimate based on filename patterns
          if (src.includes('index')) {
            totalSize += 500; // Estimate main bundle size
          } else {
            totalSize += 100; // Estimate chunk size
          }
        }
      });

      setMetrics(prev => ({
        ...prev,
        bundleSize: totalSize,
      }));
    };

    // Estimate after a short delay to ensure scripts are loaded
    const timer = setTimeout(estimateBundleSize, 1000);
    
    return () => clearTimeout(timer);
  }, [config.enableMonitoring]);

  return {
    metrics,
    isPerformanceGood: metrics.loadTime < 3000 && metrics.renderTime < 100,
  };
};

// Hook for monitoring specific component performance
export const useComponentPerformance = (_componentName: string) => {
  const [renderCount, setRenderCount] = useState(0);
  const [lastRenderTime, setLastRenderTime] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    setRenderCount(prev => prev + 1);

    return () => {
      const endTime = performance.now();
      setLastRenderTime(endTime - startTime);
    };
  });

  return {
    renderCount,
    lastRenderTime,
    isOverRendering: renderCount > 10,
  };
};

// Utility function to measure async operations
export const measureAsyncOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ result: T; duration: number }> => {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    
    console.log(`${operationName} completed in ${duration.toFixed(2)}ms`);
    
    return { result, duration };
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`${operationName} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};
