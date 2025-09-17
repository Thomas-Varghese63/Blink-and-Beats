// src/App.tsx

import React, { useState, useEffect } from 'react';
import { Music, Volume2, Wifi, Activity, Play, Pause, Trophy, Zap } from 'lucide-react';
import Scene from './components/Scene';
import type { CustomCSSProperties } from './components/CustomCSS';
import './components/FrequencyBars.css';

const BeatBlinkApp: React.FC = () => {
  // Local state to manage UI-only elements
  const [isPlaying, setIsPlaying] = useState(false);
  const [iotConnected, setIotConnected] = useState(false);
  const [audioData, setAudioData] = useState({
    volume: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    frequencies: new Array(32).fill(0),
    overallIntensity: 0
  });
  const [levelState, setLevelState] = useState({
    current: 1,
    progress: 0,
    isWinner: false,
    winnerStartTime: null as number | null
  });
  // Add these new state variables with the existing ones
  const [esp32Response, setEsp32Response] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Replace the existing toggleAudio function
  const toggleAudio = () => {
    setIsPlaying((prev) => !prev);
  };

  // Add this new effect after your state declarations
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setAudioData({
        volume: Math.random(),
        bass: Math.random(),
        mid: Math.random(),
        treble: Math.random(),
        frequencies: new Array(32).fill(0).map(() => Math.random() * 255),
        overallIntensity: Math.random(),
      });

      setLevelState((prev) => ({
        ...prev,
        current: Math.floor(Math.random() * 4) + 1, // Changed to 4 levels
        progress: Math.random(),
        isWinner: Math.random() > 0.95, // ~5% chance of winner animation
      }));
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const connectIoT = async () => {
  try {
    const res = await fetch("http://localhost:4000/api/status"); // backend endpoint
    if (res.ok) {
      setIotConnected(true);
    } else {
      setIotConnected(false);
    }
  } catch (err) {
    console.error("ESP32 not reachable:", err);
    setIotConnected(false);
  }
};

  // Add this new function with your existing functions
  const sendRelayCommand = async (level: number) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      const data = await res.json();
      setEsp32Response(data);
    } catch (err: any) {
      setEsp32Response({ status: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Level indicator, frequency bars, etc., remain the same but now use currentAudioData and currentLevelState
  // ... (rest of the component code is the same)
  const LevelIndicator = () => {
    const getLevelColor = (level: number) => {
      const colors = ['#64748b', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
      return colors[level - 1] || colors[0];
    };
    
    const getLevelStyle = (level: number): CustomCSSProperties => {
      const isCurrentLevel = level === levelState.current;
      const isPastLevel = level < levelState.current;
      const color = getLevelColor(level);
      
      return {
        '--level-width': isCurrentLevel 
          ? `${levelState.progress * 100}%` 
          : isPastLevel ? '100%' : '0%',
        '--level-color': color,
        '--level-shadow': isCurrentLevel ? `0 0 10px ${color}` : 'none'
      };
    };

    const intensityStyle: CustomCSSProperties = {
      '--intensity-width': `${audioData.overallIntensity * 100}%`,
      '--intensity-gradient': 'linear-gradient(to right, #06b6d4, #ec4899, #facc15)',
      '--intensity-shadow': `0 0 15px rgba(0, 255, 255, ${audioData.overallIntensity})`
    };
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-lg">Level {levelState.current}</span>
        </div>
        
        {/* Level progress bars */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <div key={level} className="flex items-center space-x-3">
              <span className="text-xs text-gray-400 w-6">{level}</span>
              <div className="flex-1 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`level-bar ${
                    level < levelState.current 
                      ? 'opacity-100' 
                      : level === levelState.current 
                        ? 'opacity-100' 
                        : 'opacity-50'
                  }`}
                  style={getLevelStyle(level)}
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
            <div className="intensity-bar" style={intensityStyle} />
          </div>
        </div>
      </div>
    );
  };
  
  // Frequency bars component
  const FrequencyBars = () => {
    // Create a style object with proper typing
    const getBarStyle = (freq: number, index: number): CustomCSSProperties => {
      const height = Math.max((freq / 255) * 100, 2); // Ensure minimum height
      const levelBoost = isPlaying ? (1 + levelState.current * 0.1) : 1;
      const hue = (index / audioData.frequencies.length) * 360; // Color gradient based on index
      
      return {
        '--bar-height': `${Math.max(height * levelBoost, 8)}%`,
        '--bar-gradient': `linear-gradient(to top, 
          hsl(${hue}, 70%, 50%),
          hsl(${hue + 30}, 80%, 60%)
        )`,
        '--bar-shadow': height > 50 ? `0 0 8px hsl(${hue}, 70%, 50%)` : 'none'
      };
    };

    return (
      <div className="flex items-end space-x-1 h-20">
        {audioData.frequencies.map((freq, i) => (
          <div
            key={i}
            className={`frequency-bar ${isPlaying ? 'playing' : ''}`}
            style={getBarStyle(freq, i)}
          />
        ))}
      </div>
    );
  };

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
        {/*<div className="absolute inset-0 bg-gradient-to-r from-yellow-100/20 via-pink-500/20 to-cyan-400/20 animate-pulse" /> */}
        </div>
      )}
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Header */}
        <header className="relative z-10 p-6 pointer-events-auto">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <Music className="w-10 h-10 text-cyan-400 animate-pulse" />
              <h1 className="text-3xl md:text-6xl font-black bg-gradient-to-r from-cyan-400 via-pink-400 to-green-400 bg-clip-text text-transparent">
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
            <Activity className={`w-5 h-5 ${iotConnected ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
          </div>
          <FrequencyBars />
        </div>

        {/* Music Level Panel */}
        <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-3 w-75 pointer-events-auto shadow-2xl">
          <h3 className="text-white font-bold text-lg mb-6 flex items-center">
            <Activity className="w-6 h-6 mr-3 text-pink-400" />
            Music Intensity Meters
          </h3>
          <MusicLevelIndicator />
        </div>

        {/* Relay Controls Panel */}
        <div className="absolute bottom-32 right-6 bg-black/40 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 pointer-events-auto shadow-2xl">
          <div className="flex flex-col space-y-4">
            <h3 className="text-white font-bold text-lg flex items-center">
              <Zap className="w-6 h-6 mr-3 text-yellow-400" />
              Relay Controls
            </h3>
            
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((level) => (
                <button
                  key={level}
                  onClick={() => sendRelayCommand(level)}
                  className="px-4 py-2 bg-cyan-500/20 border-2 border-cyan-400 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-all transform hover:scale-105"
                >
                  Relay {level}
                </button>
              ))}
              <button
                onClick={() => sendRelayCommand(0)}
                className="px-4 py-2 bg-pink-500/20 border-2 border-pink-400 text-pink-400 rounded-xl hover:bg-pink-500/30 transition-all transform hover:scale-105"
              >
                All Off
              </button>
            </div>

            {loading && (
              <div className="text-cyan-400 text-sm animate-pulse">
                Sending command...
              </div>
            )}

            {esp32Response && (
              <div className="text-sm">
                <div className="text-gray-400">ESP32 Response:</div>
                <pre className="text-cyan-300 text-xs mt-1 bg-black/50 p-2 rounded">
                  {JSON.stringify(esp32Response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-6 left-6 right-6 bg-black/30 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 pointer-events-auto shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${iotConnected ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-gray-400'}`} />
                <span className="text-white font-medium">{iotConnected ? 'Server Connected' : 'Server Disconnected'}</span>
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

        {/* Center Info (only shown when not connected) 
        {!iotConnected && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-40">
            <div className="bg-black/60 backdrop-blur-xl border-2 border-white/30 rounded-3xl p-10 text-center max-w-lg shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">Connecting to Beat & Blink Server...</h2>
              <div className="text-gray-300 mb-8 text-lg leading-relaxed">
                <span>Please wait while we establish a connection to the real-time data stream.</span>
              </div>
            </div>
          </div>
        )}
          */}
      </div>
      

      {/* Dynamic background effects based on level */}
      <div className="absolute inset-0 pointer-events-none">
        {levelState.current >= 3 && (
          <div 
            className="background-effect level-3"
            style={{
              '--center-x': `${50 + Math.sin(Date.now() * 0.002) * 30}%`,
              '--center-y': `${50 + Math.cos(Date.now() * 0.002) * 30}%`
            } as CustomCSSProperties}
          />
        )}
        {levelState.current >= 4 && (
          <div 
            className="background-effect level-4"
            style={{
              '--center-x': `${50 + Math.cos(Date.now() * 0.003) * 25}%`,
              '--center-y': `${50 + Math.sin(Date.now() * 0.003) * 25}%`
            } as CustomCSSProperties}
          />
        )}
        {levelState.isWinner && (
          <div className="background-effect winner" />
        )}
      </div>
    </div>
  );
};

export default BeatBlinkApp;