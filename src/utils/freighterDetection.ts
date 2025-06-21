/**
 * Enhanced Freighter detection utility
 */

export interface FreighterDetectionResult {
  isInstalled: boolean;
  isLoading: boolean;
  error?: string;
}

export class FreighterDetector {
  private static instance: FreighterDetector;
  private detectionPromise: Promise<boolean> | null = null;
  private isDetected = false;

  static getInstance(): FreighterDetector {
    if (!FreighterDetector.instance) {
      FreighterDetector.instance = new FreighterDetector();
    }
    return FreighterDetector.instance;
  }

  async detectFreighter(): Promise<boolean> {
    // Return cached result if already detected
    if (this.isDetected) return true;

    // Return existing promise if detection is in progress
    if (this.detectionPromise) return this.detectionPromise;

    this.detectionPromise = this.performDetection();
    const result = await this.detectionPromise;
    this.detectionPromise = null;
    
    if (result) {
      this.isDetected = true;
    }
    
    return result;
  }

  private async performDetection(): Promise<boolean> {
    // Check if Freighter is immediately available
    if (this.checkFreighterAvailable()) {
      return true;
    }

    // Wait for Freighter to load (common with extension loading)
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (this.checkFreighterAvailable()) {
          clearInterval(checkInterval);
          resolve(true);
          return;
        }

        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    });
  }

  private checkFreighterAvailable(): boolean {
    return !!(
      window.freighterApi && 
      typeof window.freighterApi.getPublicKey === 'function' &&
      typeof window.freighterApi.isConnected === 'function'
    );
  }

  reset(): void {
    this.isDetected = false;
    this.detectionPromise = null;
  }

  forceRedetection(): Promise<boolean> {
    this.reset();
    return this.detectFreighter();
  }
}

// Export singleton instance
export const freighterDetector = FreighterDetector.getInstance();
