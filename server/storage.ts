import { 
  users, posts, comments, likes, connections, messages, networkStats,
  type User, type InsertUser, 
  type Post, type InsertPost,
  type Comment, type InsertComment,
  type Like, type InsertLike,
  type Connection, type InsertConnection,
  type Message, type InsertMessage,
  type NetworkStats, type InsertNetworkStats
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserByPeerId(peerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Post operations
  getPost(id: number): Promise<Post | undefined>;
  getPostsByUser(userId: number): Promise<Post[]>;
  getFeedPosts(userId: number): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;

  // Comment operations
  getCommentsByPost(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;

  // Like operations
  getLikesByPost(postId: number): Promise<Like[]>;
  createLike(like: InsertLike): Promise<Like>;
  removeLike(postId: number, userId: number): Promise<boolean>;

  // Connection operations
  getConnections(userId: number): Promise<Connection[]>;
  getConnectionRequests(userId: number): Promise<Connection[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnection(id: number, data: Partial<InsertConnection>): Promise<Connection | undefined>;

  // Message operations
  getMessages(senderId: number, receiverId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, data: Partial<InsertMessage>): Promise<Message | undefined>;

  // Network stats operations
  getNetworkStats(userId: number): Promise<NetworkStats | undefined>;
  updateNetworkStats(userId: number, data: Partial<InsertNetworkStats>): Promise<NetworkStats | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private comments: Map<number, Comment>;
  private likes: Map<number, Like>;
  private connections: Map<number, Connection>;
  private messages: Map<number, Message>;
  private networkStats: Map<number, NetworkStats>;
  
  private currentUserId: number;
  private currentPostId: number;
  private currentCommentId: number;
  private currentLikeId: number;
  private currentConnectionId: number;
  private currentMessageId: number;
  private currentNetworkStatsId: number;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.connections = new Map();
    this.messages = new Map();
    this.networkStats = new Map();
    
    this.currentUserId = 1;
    this.currentPostId = 1;
    this.currentCommentId = 1;
    this.currentLikeId = 1;
    this.currentConnectionId = 1;
    this.currentMessageId = 1;
    this.currentNetworkStatsId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid
    );
  }

  async getUserByPeerId(peerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.peerId === peerId
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Post operations
  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async getPostsByUser(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getFeedPosts(userId: number): Promise<Post[]> {
    // Get all users connected to this user
    const connections = await this.getConnections(userId);
    const connectedUserIds = connections
      .filter(conn => conn.status === "accepted")
      .map(conn => conn.connectedUserId);
    
    // Include user's own posts
    connectedUserIds.push(userId);
    
    // Get posts from connected users
    return Array.from(this.posts.values())
      .filter(post => connectedUserIds.includes(post.userId))
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.currentPostId++;
    const now = new Date();
    const post: Post = { 
      ...insertPost, 
      id, 
      createdAt: now 
    };
    this.posts.set(id, post);
    return post;
  }

  // Comment operations
  async getCommentsByPost(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const now = new Date();
    const comment: Comment = { 
      ...insertComment, 
      id, 
      createdAt: now 
    };
    this.comments.set(id, comment);
    return comment;
  }

  // Like operations
  async getLikesByPost(postId: number): Promise<Like[]> {
    return Array.from(this.likes.values())
      .filter(like => like.postId === postId);
  }

  async createLike(insertLike: InsertLike): Promise<Like> {
    // Check if like already exists
    const existingLike = Array.from(this.likes.values())
      .find(like => like.postId === insertLike.postId && like.userId === insertLike.userId);
    
    if (existingLike) return existingLike;
    
    const id = this.currentLikeId++;
    const now = new Date();
    const like: Like = { 
      ...insertLike, 
      id, 
      createdAt: now 
    };
    this.likes.set(id, like);
    return like;
  }

  async removeLike(postId: number, userId: number): Promise<boolean> {
    const like = Array.from(this.likes.values())
      .find(like => like.postId === postId && like.userId === userId);
    
    if (!like) return false;
    
    this.likes.delete(like.id);
    return true;
  }

  // Connection operations
  async getConnections(userId: number): Promise<Connection[]> {
    return Array.from(this.connections.values())
      .filter(connection => 
        (connection.userId === userId || connection.connectedUserId === userId) && 
        connection.status === "accepted"
      );
  }

  async getConnectionRequests(userId: number): Promise<Connection[]> {
    return Array.from(this.connections.values())
      .filter(connection => 
        connection.connectedUserId === userId && 
        connection.status === "pending"
      );
  }

  async createConnection(insertConnection: InsertConnection): Promise<Connection> {
    // Check if connection already exists
    const existingConnection = Array.from(this.connections.values())
      .find(connection => 
        (connection.userId === insertConnection.userId && 
         connection.connectedUserId === insertConnection.connectedUserId) ||
        (connection.userId === insertConnection.connectedUserId && 
         connection.connectedUserId === insertConnection.userId)
      );
    
    if (existingConnection) return existingConnection;
    
    const id = this.currentConnectionId++;
    const now = new Date();
    const connection: Connection = { 
      ...insertConnection, 
      id, 
      createdAt: now 
    };
    this.connections.set(id, connection);
    return connection;
  }

  async updateConnection(id: number, data: Partial<InsertConnection>): Promise<Connection | undefined> {
    const connection = this.connections.get(id);
    if (!connection) return undefined;
    
    const updatedConnection = { ...connection, ...data };
    this.connections.set(id, updatedConnection);
    return updatedConnection;
  }

  // Message operations
  async getMessages(senderId: number, receiverId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        (message.senderId === senderId && message.receiverId === receiverId) ||
        (message.senderId === receiverId && message.receiverId === senderId)
      )
      .sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const now = new Date();
    const message: Message = { 
      ...insertMessage, 
      id, 
      createdAt: now 
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessage(id: number, data: Partial<InsertMessage>): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, ...data };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Network stats operations
  async getNetworkStats(userId: number): Promise<NetworkStats | undefined> {
    return Array.from(this.networkStats.values())
      .find(stats => stats.userId === userId);
  }

  async updateNetworkStats(userId: number, data: Partial<InsertNetworkStats>): Promise<NetworkStats | undefined> {
    let stats = await this.getNetworkStats(userId);
    
    if (!stats) {
      // Create new stats
      const id = this.currentNetworkStatsId++;
      const now = new Date();
      stats = {
        id,
        userId,
        dataShared: 0,
        dataReceived: 0,
        strongConnections: 0,
        mediumConnections: 0,
        weakConnections: 0,
        lastUpdated: now
      };
      this.networkStats.set(id, stats);
    }
    
    const updatedStats = { ...stats, ...data, lastUpdated: new Date() };
    this.networkStats.set(stats.id, updatedStats);
    return updatedStats;
  }
}

export const storage = new MemStorage();
