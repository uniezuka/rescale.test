/**
 * Fallback color extraction service for when Azure Computer Vision doesn't return colors
 * Uses client-side canvas-based color analysis as a backup
 */

export interface ColorExtractionResult {
  dominantColors: string[];
  success: boolean;
  method: 'azure' | 'fallback';
}

export class FallbackColorExtractionService {
  /**
   * Extract dominant colors from an image using canvas-based analysis
   */
  static async extractColorsFromImage(imageBlob: Blob): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        try {
          // Set canvas size to image size (limit to reasonable size for performance)
          const maxSize = 300;
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          // Draw image to canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const colors = this.analyzeImageData(imageData);

          resolve(colors);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for color extraction'));
      };

      // Create object URL for the image blob
      const imageUrl = URL.createObjectURL(imageBlob);
      img.src = imageUrl;

      // Clean up object URL after image loads
      img.onload = () => {
        URL.revokeObjectURL(imageUrl);
      };
    });
  }

  /**
   * Analyze image data to extract dominant colors
   */
  private static analyzeImageData(imageData: ImageData): string[] {
    const data = imageData.data;
    const colorCounts = new Map<string, number>();
    const sampleRate = 10; // Sample every 10th pixel for performance

    // Sample pixels and count colors
    for (let i = 0; i < data.length; i += 4 * sampleRate) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Skip transparent pixels
      if (a < 128) continue;

      // Quantize colors to reduce noise (group similar colors)
      const quantizedR = Math.round(r / 32) * 32;
      const quantizedG = Math.round(g / 32) * 32;
      const quantizedB = Math.round(b / 32) * 32;

      const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
      colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
    }

    // Convert to hex colors and sort by frequency
    const sortedColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Get top 5 colors
      .map(([colorKey]) => {
        const [r, g, b] = colorKey.split(',').map(Number);
        return this.rgbToHex(r, g, b);
      })
      .filter(color => this.isValidColor(color));

    return sortedColors;
  }

  /**
   * Convert RGB values to hex color
   */
  private static rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const hex = Math.max(0, Math.min(255, n)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  /**
   * Validate if a color is meaningful (not too dark/light/monochromatic)
   */
  private static isValidColor(hexColor: string): boolean {
    const rgb = this.hexToRgb(hexColor);
    if (!rgb) return false;

    const { r, g, b } = rgb;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Filter out very dark colors (brightness < 30)
    if (brightness < 30) return false;
    
    // Filter out very light colors (brightness > 225)
    if (brightness > 225) return false;

    // Filter out grayscale colors (low color variance)
    const variance = Math.max(r, g, b) - Math.min(r, g, b);
    if (variance < 30) return false;

    return true;
  }

  /**
   * Convert hex color to RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Get fallback colors for common scenarios
   */
  static getFallbackColors(imageType?: string): string[] {
    // Provide sensible defaults based on image type or common colors
    const fallbackPalettes = {
      'nature': ['#2E8B57', '#87CEEB', '#8B4513', '#228B22', '#DAA520'],
      'portrait': ['#8B4513', '#CD853F', '#F4A460', '#DEB887', '#F5DEB3'],
      'landscape': ['#87CEEB', '#98FB98', '#F0E68C', '#DDA0DD', '#FFB6C1'],
      'default': ['#4A90E2', '#7ED321', '#F5A623', '#D0021B', '#9013FE']
    };

    return fallbackPalettes[imageType as keyof typeof fallbackPalettes] || fallbackPalettes.default;
  }
}
