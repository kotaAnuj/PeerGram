import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Server as SocketServer } from "socket.io";
import { setupWebRTCSignaling } from "./webrtc";
import { 
  insertUserSchema, 
  insertPostSchema, 
  insertCommentSchema, 
  insertLikeSchema, 
  insertConnectionSchema, 
  insertMessageSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000,  // 1 minute
    pingInterval: 25000, // 25 seconds
    connectTimeout: 30000, // 30 seconds
    maxHttpBufferSize: 1e8, // 100 MB
    transports: ['websocket', 'polling']
  });
  
  // Set up WebRTC signaling
  setupWebRTCSignaling(io);
  
  // P2P helper endpoints
  app.get('/api/p2p/active-peers', (_req: Request, res: Response) => {
    // Get active peers from the socket server
    const activePeers = Array.from(io.of("/").sockets).map(([id, socket]) => {
      const { peerId, userId } = socket.data;
      return { socketId: id, peerId, userId };
    });
    
    res.status(200).json({ 
      count: activePeers.length,
      peers: activePeers,
      timestamp: new Date()
    });
  });
  
  app.post('/api/p2p/heartbeat', (req: Request, res: Response) => {
    const { peerId, userId } = req.body;
    
    if (!peerId) {
      return res.status(400).json({ error: 'Missing peerId' });
    }
    
    // You could update any database records here to mark this peer as active
    res.status(200).json({ 
      status: 'ok',
      timestamp: new Date()
    });
  });

  // User routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/users/firebase/:uid', async (req: Request, res: Response) => {
    try {
      const firebaseUid = req.params.uid;
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/users/peer/:peerId', async (req: Request, res: Response) => {
    try {
      const peerId = req.params.peerId;
      const user = await storage.getUserByPeerId(peerId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.patch('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Post routes
  app.post('/api/posts', async (req: Request, res: Response) => {
    try {
      const postData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/posts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getPost(id);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/users/:userId/posts', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const posts = await storage.getPostsByUser(userId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/feed/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const posts = await storage.getFeedPosts(userId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Comment routes
  app.post('/api/comments', async (req: Request, res: Response) => {
    try {
      const commentData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/posts/:postId/comments', async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      const comments = await storage.getCommentsByPost(postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Like routes
  app.post('/api/likes', async (req: Request, res: Response) => {
    try {
      const likeData = insertLikeSchema.parse(req.body);
      const like = await storage.createLike(likeData);
      res.status(201).json(like);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete('/api/posts/:postId/likes/:userId', async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      const userId = parseInt(req.params.userId);
      const removed = await storage.removeLike(postId, userId);
      
      if (!removed) {
        return res.status(404).json({ message: "Like not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/posts/:postId/likes', async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      const likes = await storage.getLikesByPost(postId);
      res.json(likes);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Connection routes
  app.post('/api/connections', async (req: Request, res: Response) => {
    try {
      const connectionData = insertConnectionSchema.parse(req.body);
      const connection = await storage.createConnection(connectionData);
      res.status(201).json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.patch('/api/connections/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const connectionData = insertConnectionSchema.partial().parse(req.body);
      const connection = await storage.updateConnection(id, connectionData);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      res.json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/users/:userId/connections', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const connections = await storage.getConnections(userId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/users/:userId/connection-requests', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const requests = await storage.getConnectionRequests(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Message routes
  app.post('/api/messages', async (req: Request, res: Response) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/messages/:senderId/:receiverId', async (req: Request, res: Response) => {
    try {
      const senderId = parseInt(req.params.senderId);
      const receiverId = parseInt(req.params.receiverId);
      const messages = await storage.getMessages(senderId, receiverId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.patch('/api/messages/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const messageData = insertMessageSchema.partial().parse(req.body);
      const message = await storage.updateMessage(id, messageData);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Network stats routes
  app.get('/api/users/:userId/network-stats', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const stats = await storage.getNetworkStats(userId);
      
      if (!stats) {
        return res.status(404).json({ message: "Network stats not found" });
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.patch('/api/users/:userId/network-stats', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const statsData = z.object({
        dataShared: z.number().optional(),
        dataReceived: z.number().optional(),
        strongConnections: z.number().optional(),
        mediumConnections: z.number().optional(),
        weakConnections: z.number().optional(),
      }).parse(req.body);
      
      const stats = await storage.updateNetworkStats(userId, statsData);
      res.json(stats);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  return httpServer;
}
