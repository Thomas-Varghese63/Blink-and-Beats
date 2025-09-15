// Backend/routes.ts

import express from "express";
import type { Request, Response } from "express";
import { AudioProcessor } from "./services/audioProcessor.js"; // Corrected import path
import { WebSocketManager } from "./services/websocketManager.js"; // Corrected import path

export function registerRoutes(app: express.Express, audioProcessor: AudioProcessor, websocketManager: WebSocketManager): void {
  // Audio Analysis Routes
  app.get("/api/audio/analyze", (req: Request, res: Response) => {
    try {
      const audioData = audioProcessor.getCurrentAudioData();
      res.json(audioData);
    } catch (error) {
      res.status(500).json({ error: "Failed to get audio analysis data" });
    }
  });

  app.get("/api/audio/levels", (req: Request, res: Response) => {
    try {
      const levelState = audioProcessor.getCurrentLevelState();
      res.json(levelState);
    } catch (error) {
      res.status(500).json({ error: "Failed to get level state" });
    }
  });

  app.post("/api/audio/stream", (req: Request, res: Response) => {
    try {
      // In a real implementation, this would process uploaded audio data
      // For now, we'll acknowledge the request
      res.json({ 
        message: "Audio stream received",
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process audio stream" });
    }
  });

  // Configuration Routes
  app.get("/api/config/audio", (req: Request, res: Response) => {
    try {
      const config = audioProcessor.getConfiguration();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to get configuration" });
    }
  });

  app.post("/api/config/audio", (req: Request, res: Response) => {
    try {
      const updates = req.body;
      audioProcessor.updateConfiguration(updates);
      
      const newConfig = audioProcessor.getConfiguration();
      websocketManager.broadcastConfiguration(newConfig);
      
      res.json({
        message: "Configuration updated successfully",
        config: newConfig
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update configuration" });
    }
  });

  // IoT Sensor Routes
  app.get("/api/iot/sensors", (req: Request, res: Response) => {
    try {
      // Simulated IoT sensor data
      const sensors = [
        {
          id: "hr-001",
          deviceId: "HR-001",
          sensorType: "heart_rate",
          isActive: true,
          lastReading: {
            value: 72 + Math.floor(Math.random() * 20),
            timestamp: Date.now(),
          }
        },
        {
          id: "ms-002",
          deviceId: "MS-002",
          sensorType: "motion",
          isActive: true,
          lastReading: {
            value: Math.random() * 100,
            timestamp: Date.now(),
          }
        },
        {
          id: "sp-003",
          deviceId: "SP-003",
          sensorType: "sound_pressure",
          isActive: true,
          lastReading: {
            value: 75 + Math.floor(Math.random() * 20),
            timestamp: Date.now(),
          }
        },
      ];
      
      res.json(sensors);
    } catch (error) {
      res.status(500).json({ error: "Failed to get IoT sensor data" });
    }
  });

  app.post("/api/iot/sensors/:sensorId/data", (req: Request, res: Response) => {
    try {
      const { sensorId } = req.params;
      const sensorData = req.body;
      
      // In a real implementation, this would store the sensor data
      console.log(`Received IoT data from sensor ${sensorId}:`, sensorData);
      
      // Broadcast the sensor data to connected clients
      websocketManager.broadcastIoTData({
        sensorId,
        sensorType: sensorData.type || 'unknown',
        value: sensorData.value,
        metadata: sensorData.metadata,
        timestamp: Date.now(),
      });
      
      res.json({ 
        message: "Sensor data received",
        sensorId,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process sensor data" });
    }
  });

  // WebSocket Status Route
  app.get("/api/websocket/status", (req: Request, res: Response) => {
    try {
      const stats = websocketManager.getStats();
      res.json({
        connected: true,
        activeConnections: stats.activeConnections,
        totalConnections: stats.totalConnectionsEver,
        latency: Math.floor(Math.random() * 20) + 5, // Simulated latency
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get WebSocket status" });
    }
  });

  // System Status Route
  app.get("/api/status", (req: Request, res: Response) => {
    try {
      const wsStats = websocketManager.getStats();
      res.json({
        system: "online",
        services: {
          audioProcessor: "running",
          websocketServer: "running",
          iotHub: "connected",
        },
        metrics: {
          activeConnections: wsStats.activeConnections,
          audioStreams: Math.max(1, wsStats.activeConnections - 2),
          iotSensors: 7,
          apiRequestsPerSec: 120 + Math.floor(Math.random() * 50),
        },
        uptime: process.uptime(),
        timestamp: Date.now(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get system status" });
    }
  });
}