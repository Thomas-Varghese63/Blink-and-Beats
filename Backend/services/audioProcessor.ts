// Backend/services/audioProcessor.ts

import { AudioData, LevelState } from "../../src/shared/schema";

export class AudioProcessor {
  private isProcessing = false;
  private configuration = {
    fftSize: 1024,
    smoothingTimeConstant: 0.7,
    updateRate: 60,
    winnerThreshold: 0.95,
    winnerDuration: 5000,
  };

  private levelState: LevelState = {
    current: 1,
    progress: 0,
    isWinner: false,
    winnerStartTime: null,
  };

  private callbacks: {
    onAudioData?: (data: AudioData) => void;
    onLevelChange?: (state: LevelState) => void;
  } = {};

  constructor() {
    // Initialize with simulated data for now
    this.startSimulation();
  }

  public setCallbacks(callbacks: {
    onAudioData?: (data: AudioData) => void;
    onLevelChange?: (state: LevelState) => void;
  }) {
    this.callbacks = callbacks;
  }

  public updateConfiguration(config: Partial<typeof this.configuration>) {
    this.configuration = { ...this.configuration, ...config };
  }

  public getConfiguration() {
    return { ...this.configuration };
  }

  public async initializeAudioInput(): Promise<boolean> {
    try {
      // In a real implementation, this would require server-side audio processing
      // For now, we'll use simulation since Web Audio API is not available on server
      console.log('Audio input would be initialized on the server');
      return true;
    } catch (error) {
      console.error('Failed to initialize audio input:', error);
      return false;
    }
  }

  private startSimulation() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const processAudio = () => {
      if (!this.isProcessing) return;

      const audioData = this.generateSimulatedAudioData();
      const newLevelState = this.calculateLevel(audioData.overallIntensity);

      if (this.callbacks.onAudioData) {
        this.callbacks.onAudioData(audioData);
      }

      if (this.callbacks.onLevelChange) {
        this.callbacks.onLevelChange(newLevelState);
      }

      setTimeout(processAudio, 1000 / this.configuration.updateRate);
    };

    processAudio();
  }

  private generateSimulatedAudioData(): AudioData {
    const time = Date.now() * 0.001;
    const frequencies: number[] = [];

    // Create realistic frequency simulation
    for (let i = 0; i < this.configuration.fftSize / 4; i++) {
      const bassComponent = Math.sin(time * 2 + i * 0.05) * 100;
      const midComponent = Math.sin(time * 3 + i * 0.03) * 80;
      const trebleComponent = Math.sin(time * 4 + i * 0.02) * 60;
      frequencies[i] = Math.max(0, Math.min(255, bassComponent + midComponent + trebleComponent + 50));
    }

    // Simulate intensity progression through levels
    const cycleTime = time * 0.3;
    const intensityCycle = (Math.sin(cycleTime) + 1) / 2; // 0 to 1
    const overallIntensity = Math.pow(intensityCycle, 1.5); // Non-linear for more dramatic effect

    const volume = 0.3 + overallIntensity * 0.7;
    const bass = 0.2 + Math.sin(time * 1.5) * 0.3 + overallIntensity * 0.5;
    const mid = 0.2 + Math.sin(time * 2.5) * 0.3 + overallIntensity * 0.5;
    const treble = 0.2 + Math.sin(time * 3.5) * 0.3 + overallIntensity * 0.5;

    return {
      volume: Math.max(0, Math.min(1, volume)),
      bass: Math.max(0, Math.min(1, bass)),
      mid: Math.max(0, Math.min(1, mid)),
      treble: Math.max(0, Math.min(1, treble)),
      frequencies,
      overallIntensity: Math.max(0, Math.min(1, overallIntensity)),
    };
  }

  private calculateLevel(intensity: number): LevelState {
    // Increase sensitivity: use a power function to make levels respond more dramatically to intensity changes
    const scaledIntensity = Math.pow(intensity, 0.7); // Adjust exponent to control sensitivity (lower = more sensitive)
    const level = Math.min(Math.floor(scaledIntensity * 5) + 1, 5);
    const progress = (scaledIntensity * 5) % 1;

    const newState = { ...this.levelState, current: level, progress };

    // Check for winner state (Level 5 with high intensity)
    if (level === 5 && intensity > this.configuration.winnerThreshold && !this.levelState.isWinner) {
      newState.isWinner = true;
      newState.winnerStartTime = Date.now();
    } else if (level < 5 && this.levelState.isWinner &&
               Date.now() - (this.levelState.winnerStartTime || 0) > this.configuration.winnerDuration) {
      // Reset winner state after duration if intensity drops
      newState.isWinner = false;
      newState.winnerStartTime = null;
    }

    this.levelState = newState;
    return newState;
  }

  public stop() {
    this.isProcessing = false;
  }

  public getCurrentAudioData(): AudioData {
    return this.generateSimulatedAudioData();
  }

  public getCurrentLevelState(): LevelState {
    return { ...this.levelState };
  }
}