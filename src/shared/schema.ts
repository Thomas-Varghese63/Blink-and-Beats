// src/shared/schema.ts

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const audioSessions = pgTable("audio_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionStart: timestamp("session_start").defaultNow(),
  sessionEnd: timestamp("session_end"),
  isActive: boolean("is_active").default(true),
});

export const audioAnalysis = pgTable("audio_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => audioSessions.id),
  timestamp: timestamp("timestamp").defaultNow(),
  volume: real("volume").notNull(),
  bass: real("bass").notNull(),
  mid: real("mid").notNull(),
  treble: real("treble").notNull(),
  overallIntensity: real("overall_intensity").notNull(),
  levelCurrent: integer("level_current").notNull(),
  levelProgress: real("level_progress").notNull(),
  isWinner: boolean("is_winner").default(false),
});

export const iotSensors = pgTable("iot_sensors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: text("device_id").notNull().unique(),
  sensorType: text("sensor_type").notNull(),
  isActive: boolean("is_active").default(true),
  lastHeartbeat: timestamp("last_heartbeat").defaultNow(),
});

export const iotSensorData = pgTable("iot_sensor_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sensorId: varchar("sensor_id").references(() => iotSensors.id),
  timestamp: timestamp("timestamp").defaultNow(),
  value: real("value").notNull(),
  metadata: text("metadata"), // JSON string for additional sensor data
});

export const audioConfiguration = pgTable("audio_configuration", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fftSize: integer("fft_size").default(1024),
  smoothingTimeConstant: real("smoothing_time_constant").default(0.7),
  updateRate: integer("update_rate").default(60),
  winnerThreshold: real("winner_threshold").default(0.95),
  winnerDuration: integer("winner_duration").default(5000),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAudioSessionSchema = createInsertSchema(audioSessions).omit({
  id: true,
  sessionStart: true,
});

export const insertAudioAnalysisSchema = createInsertSchema(audioAnalysis).omit({
  id: true,
  timestamp: true,
});

export const insertIotSensorSchema = createInsertSchema(iotSensors).omit({
  id: true,
  lastHeartbeat: true,
});

export const insertIotSensorDataSchema = createInsertSchema(iotSensorData).omit({
  id: true,
  timestamp: true,
});

export const insertAudioConfigurationSchema = createInsertSchema(audioConfiguration).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAudioSession = z.infer<typeof insertAudioSessionSchema>;
export type AudioSession = typeof audioSessions.$inferSelect;

export type InsertAudioAnalysis = z.infer<typeof insertAudioAnalysisSchema>;
export type AudioAnalysis = typeof audioAnalysis.$inferSelect;

export type InsertIotSensor = z.infer<typeof insertIotSensorSchema>;
export type IotSensor = typeof iotSensors.$inferSelect;

export type InsertIotSensorData = z.infer<typeof insertIotSensorDataSchema>;
export type IotSensorData = typeof iotSensorData.$inferSelect;

export type InsertAudioConfiguration = z.infer<typeof insertAudioConfigurationSchema>;
export type AudioConfiguration = typeof audioConfiguration.$inferSelect;

// Real-time data interfaces
export interface AudioData {
  volume: number;
  bass: number;
  mid: number;
  treble: number;
  frequencies: number[];
  overallIntensity: number;
}

export interface LevelState {
  current: number;
  progress: number;
  isWinner: boolean;
  winnerStartTime: number | null;
}

export interface IoTSensorReading {
  sensorId: string;
  sensorType: string;
  value: number;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface WebSocketMessage {
  type: 'audio_data' | 'level_state' | 'iot_data' | 'configuration' | 'status';
  data: any;
  timestamp: number;
}