import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Music, Volume2, Wifi, Activity, Play, Pause, Trophy, Zap } from 'lucide-react';
import Scene from './components/Scene';

interface AudioData {
  volume: number;
  bass: number;
  mid: number;
  treble: number;
  frequencies: Uint8Array;
  overallIntensity: number;
}

interface LevelState {
  current: number;
  progress: number;
  isWinner: boolean;
  winnerStartTime: number | null;
}

const BeatBlinkApp: React.FC = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const [audioData, setAudioData] = useState<AudioData>({
    volume: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    frequencies: new Uint8Array(256),
    overallIntensity: 0
  });
  
  const [levelState, setLevelState] = useState<LevelState>({
    current: 1,
    progress: 0,
    isWinner: false,
    winnerStartTime: null
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [iotConnected, setIotConnected] = useState(false);

  // Calculate level based on intensity
  const calculateLevel = useCallback((intensity: number) => {
    const level = Math.min(Math.floor(intensity * 5) + 1, 5);
    const progress = (intensity * 5) % 1;
    
    setLevelState(prev => {
      const newState = { ...prev, current: level, progress };
      
      // Check for winner state (Level 5 with high intensity)
      if (level === 5 && intensity > 0.95 && !prev.isWinner) {
        newState.isWinner = true;
        newState.winnerStartTime = Date.now();
      } else if (level < 5 && prev.isWinner && Date.now() - (prev.winnerStartTime || 0) > 5000) {
        // Reset winner state after 5 seconds if intensity drops
        newState.isWinner = false;
        newState.winnerStartTime = null;
      }
      
      return newState;
    });
  }, []);

  // Initialize audio analysis
  const initAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Start audio analysis loop
      analyzeAudio();
    } catch (error) {
      console.log('Microphone access denied, using simulated audio data');
      simulateAudio();
    }
  }, []);

  // Analyze real-time audio with intensity calculation
  const analyzeAudio = () => {
    if (!analyserRef.current) return;

    const frequencies = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(frequencies);

    // Calculate different frequency ranges
    const bassRange = frequencies.slice(0, 80);
    const midRange = frequencies.slice(80, 200);
    const trebleRange = frequencies.slice(200, 400);

    const bass = bassRange.reduce((sum, value) => sum + value, 0) / bassRange.length / 255;
    const mid = midRange.reduce((sum, value) => sum + value, 0) / midRange.length / 255;
    const treble = trebleRange.reduce((sum, value) => sum + value, 0) / trebleRange.length / 255;
    const volume = frequencies.reduce((sum, value) => sum + value, 0) / frequencies.length / 255;

    // Calculate overall intensity (weighted combination)
    const overallIntensity = (bass * 0.4 + mid * 0.3 + treble * 0.2 + volume * 0.1);

    const newAudioData = { volume, bass, mid, treble, frequencies, overallIntensity };
    setAudioData(newAudioData);
    
    // Update level based on intensity
    calculateLevel(overallIntensity);

    requestAnimationFrame(analyzeAudio);
  };

  // Enhanced simulation with level progression
  const simulateAudio = () => {
    const time = Date.now() * 0.001;
    const frequencies = new Uint8Array(512);
    
    // Create more realistic frequency simulation
    for (let i = 0; i < frequencies.length; i++) {
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

    const newAudioData = { volume, bass, mid, treble, frequencies, overallIntensity };
    setAudioData(newAudioData);
    
    // Update level based on intensity
    calculateLevel(overallIntensity);
    
    setTimeout(simulateAudio, 50);
  };

  // Toggle audio/simulation
  const toggleAudio = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioContextRef.current) {
        audioContextRef.current.suspend();
      }
    } else {
      setIsPlaying(true);
      if (audioContextRef.current) {
        audioContextRef.current.resume();
      } else {
        initAudio();
      }
    }
  };

  // IoT integration placeholder
  const connectIoT = () => {
    setIotConnected(!iotConnected);
    
    /*
    IoT Integration Implementation:
    
    This function connects to IoT sensors that provide real-time data:
    - Heart rate monitors from wearables
    - Motion sensors detecting crowd movement
    - Environmental sensors (temperature, humidity, sound pressure)
    - Light sensors for ambient lighting conditions
    - Accelerometers for device movement
    
    Example WebSocket integration:
    
    const iotWebSocket = new WebSocket('wss://iot-hub.beatblink.com/sensors');
    
    iotWebSocket.onmessage = (event) => {
      const sensorData = JSON.parse(event.data);
      
      // Map IoT sensor data to audio visualization parameters
      const mappedAudioData = {
        volume: Math.min(1, sensorData.heartRate / 180), // Normalize heart rate (60-180 BPM)
        bass: Math.min(1, sensorData.motionIntensity / 100), // Motion sensor data
        mid: Math.min(1, sensorData.ambientSound / 120), // Sound pressure level
        treble: Math.min(1, sensorData.crowdDensity / 50), // Crowd density from multiple sensors
        frequencies: convertSensorArrayToFrequency(sensorData.multiSensorArray),
        overallIntensity: calculateCombinedIntensity(sensorData)
      };
      
      setAudioData(mappedAudioData);
      calculateLevel(mappedAudioData.overallIntensity);
    };
    
    iotWebSocket.onerror = (error) => {
      console.error('IoT connection failed:', error);
      setIotConnected(false);
      // Fallback to simulated data
      simulateAudio();
    };
    
    // Send configuration to IoT hub
    iotWebSocket.onopen = () => {
      iotWebSocket.send(JSON.stringify({
        type: 'configure',
        sampleRate: 20, // 20Hz update rate
        sensors: ['heartRate', 'motion', 'sound', 'crowd', 'environment']
      }));
    };
    */
  };

  // Initialize everything
  useEffect(() => {
    simulateAudio(); // Start with simulated data
  }, []);

  // Level indicator component
  const LevelIndicator = () => {
    const getLevelColor = (level: number) => {
      const colors = ['#64748b', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
      return colors[level - 1] || colors[0];
    };

    const getLevelName = (level: number) => {
      const names = ['Warm Up', 'Getting Started', 'In the Zone', 'Peak Energy', 'MAXIMUM POWER'];
      return names[level - 1] || names[0];
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-lg">Level {levelState.current}</span>
          <span className="text-cyan-300 text-sm">{getLevelName(levelState.current)}</span>
        </div>
        
        {/* Level progress bars */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <div key={level} className="flex items-center space-x-3">
              <span className="text-xs text-gray-400 w-6">{level}</span>
              <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    level < levelState.current 
                      ? 'w-full' 
                      : level === levelState.current 
                        ? `opacity-100` 
                        : 'w-0 opacity-50'
                  }`}
                  style={{ 
                    backgroundColor: getLevelColor(level),
                    width: level === levelState.current ? `${levelState.progress * 100}%` : level < levelState.current ? '100%' : '0%',
                    boxShadow: level === levelState.current ? `0 0 10px ${getLevelColor(level)}` : 'none'
                  }}
                />
              </div>
              {level === 5 && (
                <Trophy className={`w-4 h-4 ${levelState.current === 5 ? 'text-yellow-400 animate-pulse' : 'text-gray-600'}`} />
              )}
            </div>
          ))}
        </div>
        
        {/* Overall intensity meter */}
        <div className="mt-4 p-3 bg-black/30 rounded-lg border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-cyan-300 text-sm">Overall Intensity</span>
            <span className="text-white text-sm">{Math.round(audioData.overallIntensity * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-150 bg-gradient-to-r from-cyan-500 via-pink-500 to-yellow-500"
              style={{ 
                width: `${audioData.overallIntensity * 100}%`,
                boxShadow: `0 0 15px rgba(0, 255, 255, ${audioData.overallIntensity})`
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Frequency bars component
  const FrequencyBars = () => (
    <div className="flex items-end space-x-1 h-20">
      {Array.from({ length: 32 }).map((_, i) => {
        const height = (audioData.frequencies[i * 16] || 0) / 255 * 100;
        const levelBoost = 1 + levelState.current * 0.1;
        return (
          <div
            key={i}
            className="w-2 bg-gradient-to-t from-cyan-500 via-pink-500 to-green-500 rounded-t-sm transition-all duration-75 ease-out"
            style={{ 
              height: `${Math.max(height * levelBoost, 8)}%`,
              boxShadow: height > 50 ? `0 0 8px rgba(0, 255, 255, 0.6)` : 'none'
            }}
          />
        );
      })}
    </div>
  );

  // Music level indicator
  const MusicLevelIndicator = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-cyan-300">Volume</span>
        <span className="text-white font-mono">{Math.round(audioData.volume * 100)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-cyan-500 to-pink-500 h-3 rounded-full transition-all duration-150"
          style={{ 
            width: `${audioData.volume * 100}%`,
            boxShadow: `0 0 10px rgba(0, 255, 255, ${audioData.volume})`
          }}
        />
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-pink-300">Bass</span>
        <span className="text-white font-mono">{Math.round(audioData.bass * 100)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-pink-500 to-purple-500 h-3 rounded-full transition-all duration-150"
          style={{ 
            width: `${audioData.bass * 100}%`,
            boxShadow: `0 0 10px rgba(255, 20, 147, ${audioData.bass})`
          }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-green-300">Treble</span>
        <span className="text-white font-mono">{Math.round(audioData.treble * 100)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-green-500 to-yellow-500 h-3 rounded-full transition-all duration-150"
          style={{ 
            width: `${audioData.treble * 100}%`,
            boxShadow: `0 0 10px rgba(50, 205, 50, ${audioData.treble})`
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* React Three Fiber Scene */}
      <div className="absolute inset-0 w-full h-full">
        <Scene 
          musicIntensity={audioData.overallIntensity}
          levelState={levelState}
          audioData={audioData}
        />
      </div>
      
      {/* Winner State Overlay */}
      {levelState.isWinner && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-center animate-pulse">
            <div className="text-8xl md:text-9xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400 bg-clip-text animate-bounce">
              WINNER!
            </div>
            <div className="text-2xl md:text-3xl text-white mt-4 animate-pulse">
              🎉 MAXIMUM ENERGY ACHIEVED! 🎉
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-pink-500/20 to-cyan-400/20 animate-pulse" />
        </div>
      )}
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Header */}
        <header className="relative z-10 p-6 pointer-events-auto">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <Music className="w-10 h-10 text-cyan-400 animate-pulse" />
              <h1 className="text-4xl md:text-7xl font-black bg-gradient-to-r from-cyan-400 via-pink-400 to-green-400 bg-clip-text text-transparent">
                BEAT & BLINK
              </h1>
              {levelState.isWinner && (
                <Trophy className="w-12 h-12 text-yellow-400 animate-bounce" />
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={connectIoT}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all transform hover:scale-105 ${
                  iotConnected 
                    ? 'bg-green-500/20 border-2 border-green-400 text-green-400 shadow-lg shadow-green-400/25' 
                    : 'bg-gray-800/50 border-2 border-gray-600 text-gray-400 hover:border-cyan-400 hover:text-cyan-400 hover:shadow-lg hover:shadow-cyan-400/25'
                }`}
              >
                <Wifi className="w-5 h-5" />
                <span className="font-medium">IoT {iotConnected ? 'Connected' : 'Connect'}</span>
              </button>
              
              <button
                onClick={toggleAudio}
                className="flex items-center space-x-2 px-6 py-3 bg-pink-500/20 border-2 border-pink-400 text-pink-400 rounded-xl hover:bg-pink-500/30 transition-all transform hover:scale-105 shadow-lg shadow-pink-400/25"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span className="font-medium">{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Level System Panel */}
        <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 w-80 pointer-events-auto shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <Zap className={`w-6 h-6 ${levelState.current >= 3 ? 'text-yellow-400 animate-pulse' : 'text-cyan-400'}`} />
            <span className="text-white font-bold text-lg">Energy Level System</span>
            {levelState.isWinner && <Trophy className="w-6 h-6 text-yellow-400 animate-bounce" />}
          </div>
          <LevelIndicator />
        </div>

        {/* Audio Visualizer Panel */}
        <div className="absolute bottom-32 left-6 bg-black/40 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 pointer-events-auto shadow-2xl">
          <div className="flex items-center space-x-3 mb-4">
            <Volume2 className="w-6 h-6 text-cyan-400" />
            <span className="text-white font-bold">Live Audio Visualizer</span>
            <Activity className={`w-5 h-5 ${isPlaying ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
          </div>
          <FrequencyBars />
        </div>

        {/* Music Level Panel */}
        <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 w-80 pointer-events-auto shadow-2xl">
          <h3 className="text-white font-bold text-lg mb-6 flex items-center">
            <Activity className="w-6 h-6 mr-3 text-pink-400" />
            Music Intensity Meters
          </h3>
          <MusicLevelIndicator />
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-6 left-6 right-6 bg-black/30 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 pointer-events-auto shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-gray-400'}`} />
                <span className="text-white font-medium">{isPlaying ? 'Live Audio Active' : 'Audio Paused'}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${iotConnected ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-gray-400'}`} />
                <span className="text-white font-medium">IoT Sensors {iotConnected ? 'Connected' : 'Disconnected'}</span>
              </div>

              <div className="flex items-center space-x-3">
                <Zap className={`w-5 h-5 ${levelState.current >= 4 ? 'text-yellow-400 animate-pulse' : 'text-cyan-400'}`} />
                <span className="text-white font-medium">Level {levelState.current}/5</span>
                {levelState.isWinner && (
                  <span className="text-yellow-400 font-bold animate-pulse">WINNER STATE!</span>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-cyan-300 font-medium">Live Music • IoT Integration • Web Animation</div>
              <div className="text-gray-400 text-sm">Real-time Visualization Experience</div>
            </div>
          </div>
        </div>

        {/* Center Info (only shown when not playing) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-40">
            <div className="bg-black/60 backdrop-blur-xl border-2 border-white/30 rounded-3xl p-10 text-center max-w-lg shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">Welcome to Beat & Blink</h2>
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                Experience live music through immersive 3D visualization and IoT integration.
                Progress through 5 energy levels and reach the WINNER state!
              </p>
              <button
                onClick={toggleAudio}
                className="flex items-center space-x-3 mx-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-pink-500 text-white rounded-xl hover:from-cyan-600 hover:to-pink-600 transition-all transform hover:scale-110 shadow-lg shadow-cyan-500/25 font-bold text-lg"
              >
                <Play className="w-6 h-6" />
                <span>Start Experience</span>
              </button>
              
              <div className="mt-6 text-sm text-gray-400">
                🎵 Real-time audio analysis • 🤖 IoT sensor integration • 🏆 Level progression system
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic background effects based on level */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 ${levelState.current >= 3 ? 'opacity-20' : 'opacity-10'}`}
          style={{
            background: `radial-gradient(circle at ${50 + Math.sin(Date.now() * 0.002) * 30}% ${50 + Math.cos(Date.now() * 0.002) * 30}%, rgba(0,255,255,0.4) 0%, transparent 60%)`
          }}
        />
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 ${levelState.current >= 4 ? 'opacity-15' : 'opacity-5'}`}
          style={{
            background: `radial-gradient(circle at ${50 + Math.cos(Date.now() * 0.003) * 25}% ${50 + Math.sin(Date.now() * 0.003) * 25}%, rgba(255,20,147,0.3) 0%, transparent 50%)`
          }}
        />
        {levelState.isWinner && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 via-pink-500/30 to-cyan-400/30 animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default BeatBlinkApp;