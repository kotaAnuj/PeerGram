import { Server as SocketServer } from "socket.io";
import { storage } from "./storage";

type PeerConnection = {
  peerId: string;
  userId: number;
  socketId: string;
  connectedPeers: Set<string>;
};

// In-memory store of active peer connections
const activePeers = new Map<string, PeerConnection>();

export function setupWebRTCSignaling(io: SocketServer) {
  io.on("connection", (socket) => {
    console.log(`New socket connection: ${socket.id}`);

    // Handle peer registration
    socket.on("register-peer", async ({ peerId, userId }) => {
      console.log(`Registering peer: ${peerId} for user ${userId}`);
      
      // Store peer connection info
      activePeers.set(peerId, { 
        peerId, 
        userId, 
        socketId: socket.id,
        connectedPeers: new Set()
      });
      
      // Update user's peer ID in storage
      if (userId) {
        try {
          const user = await storage.getUser(userId);
          if (user) {
            await storage.updateUser(userId, { peerId, isOnline: true });
          }
        } catch (error) {
          console.error("Error updating user peer ID:", error);
        }
      }
      
      // Notify other peers of new connection
      socket.broadcast.emit("peer-joined", { peerId, userId });
      
      // Send list of active peers to the newly connected peer
      socket.emit("active-peers", Array.from(activePeers.keys())
        .filter(id => id !== peerId)
        .map(id => {
          const peer = activePeers.get(id);
          return { peerId: id, userId: peer?.userId };
        })
      );
    });
    
    // Handle WebRTC signaling
    socket.on("signal", ({ peerId, targetPeerId, signal }) => {
      const targetPeer = activePeers.get(targetPeerId);
      if (targetPeer) {
        io.to(targetPeer.socketId).emit("signal", {
          peerId,
          signal
        });
        
        // Track connected peers for network visualization
        const sourcePeer = activePeers.get(peerId);
        if (sourcePeer) {
          sourcePeer.connectedPeers.add(targetPeerId);
          targetPeer.connectedPeers.add(peerId);
        }
      }
    });
    
    // Handle connection strength updates
    socket.on("connection-strength", async ({ peerId, targetPeerId, strength }) => {
      try {
        const sourcePeer = activePeers.get(peerId);
        const targetPeer = activePeers.get(targetPeerId);
        
        if (sourcePeer && targetPeer && sourcePeer.userId && targetPeer.userId) {
          // Find existing connection in either direction
          const connections = await storage.getConnections(sourcePeer.userId);
          const connection = connections.find(conn => 
            (conn.userId === sourcePeer.userId && conn.connectedUserId === targetPeer.userId) ||
            (conn.userId === targetPeer.userId && conn.connectedUserId === sourcePeer.userId)
          );
          
          if (connection) {
            await storage.updateConnection(connection.id, { strength });
          } else {
            await storage.createConnection({
              userId: sourcePeer.userId,
              connectedUserId: targetPeer.userId,
              status: "accepted",
              strength,
              lastConnectionTime: new Date()
            });
          }
        }
      } catch (error) {
        console.error("Error updating connection strength:", error);
      }
    });
    
    // Handle data transfer stats
    socket.on("data-transfer", async ({ userId, dataShared, dataReceived }) => {
      try {
        if (userId) {
          const stats = await storage.getNetworkStats(userId);
          if (stats) {
            await storage.updateNetworkStats(userId, {
              dataShared: stats.dataShared + dataShared,
              dataReceived: stats.dataReceived + dataReceived
            });
          } else {
            await storage.updateNetworkStats(userId, {
              dataShared,
              dataReceived
            });
          }
        }
      } catch (error) {
        console.error("Error updating data transfer stats:", error);
      }
    });

    // Handle peer disconnection
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Find and remove the disconnected peer
      for (const [peerId, peer] of activePeers.entries()) {
        if (peer.socketId === socket.id) {
          console.log(`Peer ${peerId} disconnected`);
          
          // Update user's online status
          if (peer.userId) {
            try {
              await storage.updateUser(peer.userId, { isOnline: false, lastSeen: new Date() });
            } catch (error) {
              console.error("Error updating user online status:", error);
            }
          }
          
          // Remove from active peers
          activePeers.delete(peerId);
          
          // Notify other peers of disconnection
          socket.broadcast.emit("peer-left", { peerId });
          
          break;
        }
      }
    });
  });
}
