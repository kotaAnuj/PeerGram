import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  firebaseUid: text("firebase_uid").unique(),
  peerId: text("peer_id").unique(),
  lastSeen: timestamp("last_seen"),
  isOnline: boolean("is_online").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Post model
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  contentHash: text("content_hash").unique(),
  createdAt: timestamp("created_at").defaultNow()
});

// Comment model
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Like model
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

// Connection model (for P2P network connections)
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  connectedUserId: integer("connected_user_id").notNull().references(() => users.id),
  status: text("status").notNull(), // pending, accepted, rejected
  strength: text("strength"), // strong, medium, weak
  lastConnectionTime: timestamp("last_connection_time"),
  createdAt: timestamp("created_at").defaultNow()
});

// Message model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  embedData: jsonb("embed_data"),
  isRead: boolean("is_read").default(false),
  deliveryStatus: text("delivery_status"), // sent, delivered, read
  createdAt: timestamp("created_at").defaultNow()
});

// Network stats model
export const networkStats = pgTable("network_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  dataShared: integer("data_shared").default(0),
  dataReceived: integer("data_received").default(0),
  strongConnections: integer("strong_connections").default(0),
  mediumConnections: integer("medium_connections").default(0),
  weakConnections: integer("weak_connections").default(0),
  lastUpdated: timestamp("last_updated").defaultNow()
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertNetworkStatsSchema = createInsertSchema(networkStats).omit({
  id: true,
  lastUpdated: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;

export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Connection = typeof connections.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertNetworkStats = z.infer<typeof insertNetworkStatsSchema>;
export type NetworkStats = typeof networkStats.$inferSelect;
