import { AzureVisionService } from '../services/azureVisionService';
import { BackgroundProcessingService } from '../services/backgroundProcessingService';
import { RealTimeService } from '../services/realTimeService';
import { AIAnalysisService } from '../services/aiAnalysisService';
import type { ImageMetadata } from '../types/image';

export interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

export class AITestingService {
  /**
   * Run comprehensive AI processing tests
   */
  static async runAllTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test Azure Computer Vision connection
    results.push(await this.testAzureConnection());

    // Test image analysis
    results.push(await this.testImageAnalysis());

    // Test background processing
    results.push(await this.testBackgroundProcessing());

    // Test real-time subscriptions
    results.push(await this.testRealTimeSubscriptions());

    // Test AI analysis service
    results.push(await this.testAIAnalysisService());

    return results;
  }

  /**
   * Test Azure Computer Vision connection
   */
  static async testAzureConnection(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const isConnected = await AzureVisionService.testConnection();
      const duration = Date.now() - startTime;

      return {
        testName: 'Azure Computer Vision Connection',
        success: isConnected,
        duration,
        details: {
          endpoint: import.meta.env.VITE_AZURE_CV_ENDPOINT ? 'Configured' : 'Not configured',
          apiKey: import.meta.env.VITE_AZURE_CV_KEY ? 'Configured' : 'Not configured'
        }
      };
    } catch (error) {
      return {
        testName: 'Azure Computer Vision Connection',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test image analysis with sample image
   */
  static async testImageAnalysis(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testImageUrl = 'https://via.placeholder.com/300x300/FF0000/FFFFFF?text=Test';
      const result = await AzureVisionService.analyzeImage(testImageUrl);
      const duration = Date.now() - startTime;

      return {
        testName: 'Image Analysis',
        success: true,
        duration,
        details: {
          tags: result.tags,
          description: result.description,
          colors: result.dominantColors
        }
      };
    } catch (error) {
      return {
        testName: 'Image Analysis',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test background processing service
   */
  static async testBackgroundProcessing(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const stats = await BackgroundProcessingService.getProcessingStats();
      const duration = Date.now() - startTime;

      return {
        testName: 'Background Processing Service',
        success: true,
        duration,
        details: {
          stats,
          serviceAvailable: true
        }
      };
    } catch (error) {
      return {
        testName: 'Background Processing Service',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test real-time subscriptions
   */
  static async testRealTimeSubscriptions(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const isConnected = await RealTimeService.testConnection();
      const duration = Date.now() - startTime;

      return {
        testName: 'Real-time Subscriptions',
        success: isConnected,
        duration,
        details: {
          connectionStatus: RealTimeService.getConnectionStatus()
        }
      };
    } catch (error) {
      return {
        testName: 'Real-time Subscriptions',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test AI analysis service utilities
   */
  static async testAIAnalysisService(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Create mock image data
      const mockImage: ImageMetadata = {
        id: 'test-id',
        user_id: 'test-user',
        filename: 'test.jpg',
        original_filename: 'test-image.jpg',
        file_size: 1024000,
        mime_type: 'image/jpeg',
        width: 1920,
        height: 1080,
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        processing_status: 'completed',
        ai_tags: ['nature', 'landscape', 'mountain'],
        ai_description: 'A beautiful mountain landscape with trees and sky',
        dominant_colors: ['#2E8B57', '#87CEEB', '#8B4513'],
        thumbnail_url: 'https://example.com/thumb.jpg',
        original_url: 'https://example.com/original.jpg'
      };

      // Test various AI analysis functions
      const keywords = AIAnalysisService.generateSearchKeywords(mockImage);
      const quality = AIAnalysisService.getAnalysisQuality(mockImage);
      const palette = AIAnalysisService.generateColorPalette(mockImage.dominant_colors || []);

      const duration = Date.now() - startTime;

      return {
        testName: 'AI Analysis Service',
        success: true,
        duration,
        details: {
          keywords,
          quality,
          palette,
          functionsTested: ['generateSearchKeywords', 'getAnalysisQuality', 'generateColorPalette']
        }
      };
    } catch (error) {
      return {
        testName: 'AI Analysis Service',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test processing a real image (if available)
   */
  static async testRealImageProcessing(imageId: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const result = await BackgroundProcessingService.processImage(imageId);
      const duration = Date.now() - startTime;

      return {
        testName: 'Real Image Processing',
        success: result.success,
        duration,
        details: {
          result,
          imageId
        }
      };
    } catch (error) {
      return {
        testName: 'Real Image Processing',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Performance test for batch processing
   */
  static async testBatchProcessing(imageIds: string[]): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const results = await BackgroundProcessingService.processBatch(imageIds);
      const duration = Date.now() - startTime;

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      return {
        testName: 'Batch Processing',
        success: successCount > 0,
        duration,
        details: {
          totalImages: imageIds.length,
          successful: successCount,
          failed: failureCount,
          averageTimePerImage: duration / imageIds.length,
          results
        }
      };
    } catch (error) {
      return {
        testName: 'Batch Processing',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate test report
   */
  static generateTestReport(results: TestResult[]): {
    summary: {
      total: number;
      passed: number;
      failed: number;
      totalDuration: number;
    };
    details: TestResult[];
  } {
    const summary = {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
    };

    return {
      summary,
      details: results
    };
  }

  /**
   * Log test results to console
   */
  static logTestResults(results: TestResult[]): void {
    console.group('🧪 AI Processing Test Results');
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.testName}: ${result.duration}ms`);
      
      if (!result.success && result.error) {
        console.error(`   Error: ${result.error}`);
      }
      
      if (result.details) {
        console.log('   Details:', result.details);
      }
    });

    const report = this.generateTestReport(results);
    console.log(`\n📊 Summary: ${report.summary.passed}/${report.summary.total} tests passed`);
    console.log(`⏱️ Total duration: ${report.summary.totalDuration}ms`);
    
    console.groupEnd();
  }
}
