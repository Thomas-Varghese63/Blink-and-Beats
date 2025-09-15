// Backend/services/websocketManager.ts

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { AudioData, LevelState, WebSocketMessage, IoTSensorReading } from '../../src/shared/schema';

export class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private connectionCount = 0;

  constructor() {}

  public initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      this.connectionCount++;
      this.clients.add(ws);
      
      console.log(`WebSocket client connected. Total connections: ${this.clients.size}`);

      // Send initial connection message
      this.sendToClient(ws, {
        type: 'status',
        data: { 
          connected: true, 
          clientId: this.connectionCount,
          message: 'Connected to BeatBlink backend'
        },
        timestamp: Date.now(),
      });

      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`WebSocket client disconnected. Total connections: ${this.clients.size}`);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    console.log('WebSocket server initialized on /ws');
  }

  private handleClientMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, {
          type: 'status',
          data: { pong: true },
          timestamp: Date.now(),
        });
        break;
      
      case 'request_audio_data':
        // Audio data is sent automatically, but we can send current state immediately
        break;
      
      case 'configuration_update':
        // Handle configuration updates from clients
        console.log('Configuration update received:', message.data);
        break;
      
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message to client:', error);
      }
    }
  }

  public broadcastAudioData(audioData: AudioData) {
    const message: WebSocketMessage = {
      type: 'audio_data',
      data: audioData,
      timestamp: Date.now(),
    };

    this.broadcast(message);
  }

  public broadcastLevelState(levelState: LevelState) {
    const message: WebSocketMessage = {
      type: 'level_state',
      data: levelState,
      timestamp: Date.now(),
    };

    this.broadcast(message);
  }

  public broadcastIoTData(sensorData: IoTSensorReading) {
    const message: WebSocketMessage = {
      type: 'iot_data',
      data: sensorData,
      timestamp: Date.now(),
    };

    this.broadcast(message);
  }

  public broadcastConfiguration(config: any) {
    const message: WebSocketMessage = {
      type: 'configuration',
      data: config,
      timestamp: Date.now(),
    };

    this.broadcast(message);
  }

  private broadcast(message: WebSocketMessage) {
    const messageString = JSON.stringify(message);
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageString);
        } catch (error) {
          console.error('Error broadcasting message:', error);
          this.clients.delete(client);
        }
      } else {
        this.clients.delete(client);
      }
    });
  }

  public getConnectionCount(): number {
    return this.clients.size;
  }

  public getStats() {
    return {
      activeConnections: this.clients.size,
      totalConnectionsEver: this.connectionCount,
    };
  }
}