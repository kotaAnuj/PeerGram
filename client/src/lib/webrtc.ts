import { io, Socket } from "socket.io-client";
import Peer, { DataConnection } from "peerjs";

// Types
export type PeerConnection = {
  peerId: string;
  userId?: number;
  connection: DataConnection;
  strength: 'strong' | 'medium' | 'weak';
};

export type NetworkStats = {
  totalPeers: number;
  strongConnections: number;
  mediumConnections: number;
  weakConnections: number;
  dataShared: number;
  dataReceived: number;
};

// WebRTC Manager Class
class WebRTCManager {
  private peer: Peer | null = null;
  private peerId: string | null = null;
  private userId: number | null = null;
  private socket: Socket | null = null;
  private connections = new Map<string, PeerConnection>();
  private messageHandlers = new Set<(message: any) => void>();
  private connectionHandlers = new Set<(connection: PeerConnection) => void>();
  private disconnectionHandlers = new Set<(peerId: string) => void>();
  private networkStats: NetworkStats = {
    totalPeers: 0,
    strongConnections: 0,
    mediumConnections: 0,
    weakConnections: 0,
    dataShared: 0,
    dataReceived: 0
  };

  // Initialize WebRTC connection
  public init(userId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Create socket connection for signaling with reconnection
        this.socket = io({
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000
        });
        this.userId = userId;

        // Create Peer connection with improved options
        this.peer = new Peer({
          debug: 2,
          host: window.location.hostname,
          port: window.location.port ? parseInt(window.location.port) : (window.location.protocol === 'https:' ? 443 : 80),
          path: '/peerjs',
          secure: window.location.protocol === 'https:',
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
              {
                urls: 'turn:global.turn.twilio.com:3478?transport=udp',
                username: 'peergram',
                credential: 'peergram2025'
              }
            ],
            sdpSemantics: 'unified-plan',
            iceCandidatePoolSize: 10
          },
          pingInterval: 5000,  // Check connection every 5 seconds
        });

        // Handle socket disconnection and reconnection
        this.socket.on('disconnect', () => {
          console.log('Socket disconnected, attempting to reconnect...');
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`Socket reconnected after ${attemptNumber} attempts`);
          if (this.peerId && this.userId) {
            // Re-register with signaling server
            this.socket?.emit('register-peer', { peerId: this.peerId, userId: this.userId });
          }
        });

        // Set up peer event handlers
        this.peer.on('open', (id) => {
          console.log('My peer ID is:', id);
          this.peerId = id;
          
          // Register with signaling server
          if (this.socket) {
            this.socket.emit('register-peer', { peerId: id, userId });
          }
          
          resolve(id);
        });
        
        this.peer.on('error', (err) => {
          console.error('Peer error:', err);
          
          // Only reject on initialization errors
          if (!this.peerId) {
            reject(err);
          } else {
            // For other errors, attempt to reconnect
            setTimeout(() => {
              console.log('Attempting to reconnect peer after error...');
              if (this.peer) {
                this.peer.reconnect();
              }
            }, 2000);
          }
        });
        
        this.peer.on('disconnected', () => {
          console.log('Peer disconnected from server, attempting to reconnect...');
          
          // Attempt to reconnect
          setTimeout(() => {
            if (this.peer) {
              this.peer.reconnect();
            }
          }, 1000);
        });
        
        this.peer.on('connection', (conn) => {
          this.handleIncomingConnection(conn);
        });
        
        // Set up socket event handlers
        if (this.socket) {
          this.socket.on('active-peers', (peers) => {
            console.log('Active peers:', peers);
            // Connect to active peers with rate limiting to prevent flooding
            let delay = 0;
            peers.forEach((peer: {peerId: string, userId?: number}) => {
              setTimeout(() => {
                this.connectToPeer(peer.peerId, peer.userId);
              }, delay);
              delay += 100; // Stagger connections by 100ms
            });
          });
          
          this.socket.on('peer-joined', (peer) => {
            console.log('New peer joined:', peer);
            this.connectToPeer(peer.peerId, peer.userId);
          });
          
          this.socket.on('peer-left', (peer) => {
            console.log('Peer left:', peer);
            this.handlePeerDisconnection(peer.peerId);
          });
          
          this.socket.on('signal', ({ peerId, signal }) => {
            if (this.peer && !this.connections.has(peerId)) {
              console.log('Received signal from peer:', peerId);
              // Handle incoming connections via signaling
            }
          });
          
          // Setup heartbeat to keep socket alive
          setInterval(() => {
            if (this.socket?.connected && this.peerId) {
              this.socket.emit('heartbeat', { peerId: this.peerId, userId });
            }
          }, 30000); // 30 second heartbeat
        }
        
        // Setup automatic reconnection for lost peers
        setInterval(() => {
          this.checkAndReconnectPeers();
        }, 60000); // Check every minute
        
      } catch (err) {
        reject(err);
      }
    });
  }
  
  // Helper method to reconnect to lost peers
  private checkAndReconnectPeers(): void {
    if (!this.socket || !this.socket.connected) return;
    
    // Request active peers list again to reconnect to anyone we've lost
    this.socket.emit('get-active-peers');
  }

  // Connect to a peer with retry logic
  public connectToPeer(peerId: string, userId?: number, retryCount = 0): void {
    if (!this.peer || this.connections.has(peerId) || peerId === this.peerId) return;
    
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds between retries
    
    try {
      console.log(`Connecting to peer: ${peerId}${retryCount > 0 ? ` (retry #${retryCount})` : ''}`);
      
      // Use more reliable connection settings
      const conn = this.peer.connect(peerId, {
        reliable: true,
        serialization: 'json',
        metadata: {
          userId: this.userId,
          initiatorId: this.peerId
        }
      });
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!this.connections.has(peerId)) {
          console.log(`Connection to peer ${peerId} timed out`);
          conn.close();
          
          // Retry if we haven't reached max retries
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying connection to peer ${peerId}...`);
            setTimeout(() => {
              this.connectToPeer(peerId, userId, retryCount + 1);
            }, RETRY_DELAY);
          }
        }
      }, 10000); // 10 second timeout
      
      conn.on('open', () => {
        // Clear timeout since connection succeeded
        clearTimeout(connectionTimeout);
        
        // Create peer connection entry
        const peerConn: PeerConnection = {
          peerId,
          userId,
          connection: conn,
          strength: 'medium' // Default strength, will be updated based on RTT
        };
        
        // Store the connection
        this.connections.set(peerId, peerConn);
        
        // Update network stats
        this.updateNetworkStats();
        
        // Start measuring connection quality
        this.measureConnectionQuality(peerConn);
        
        // Notify connection handlers
        this.connectionHandlers.forEach(handler => handler(peerConn));
        
        // Send initial handshake data
        conn.send({
          type: 'HANDSHAKE',
          peerId: this.peerId,
          userId: this.userId,
          timestamp: Date.now()
        });
        
        console.log(`Connected to peer: ${peerId}`);
      });
      
      conn.on('data', (data) => {
        // Handle handshake data to get user ID if we don't have it
        if (data && typeof data === 'object' && 'type' in data && data.type === 'HANDSHAKE' && !userId) {
          const peerConn = this.connections.get(peerId);
          if (peerConn && 'userId' in data && typeof data.userId === 'number') {
            peerConn.userId = data.userId;
          }
        }
        
        this.handleIncomingData(peerId, data);
      });
      
      conn.on('close', () => {
        clearTimeout(connectionTimeout);
        this.handlePeerDisconnection(peerId);
        
        // Try to reconnect if the connection closes unexpectedly
        if (this.connections.has(peerId)) {
          setTimeout(() => {
            console.log(`Attempting to reconnect to peer ${peerId} after disconnection...`);
            this.connectToPeer(peerId, userId, 0);
          }, RETRY_DELAY);
        }
      });
      
      conn.on('error', (err) => {
        clearTimeout(connectionTimeout);
        console.error(`Connection error with peer ${peerId}:`, err);
        this.handlePeerDisconnection(peerId);
        
        // Retry if we haven't reached max retries
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            console.log(`Retrying connection to peer ${peerId} after error...`);
            this.connectToPeer(peerId, userId, retryCount + 1);
          }, RETRY_DELAY);
        }
      });
    } catch (err) {
      console.error(`Failed to connect to peer ${peerId}:`, err);
      
      // Retry if we haven't reached max retries
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          console.log(`Retrying connection to peer ${peerId} after failure...`);
          this.connectToPeer(peerId, userId, retryCount + 1);
        }, RETRY_DELAY);
      }
    }
  }

  // Handle incoming peer connection
  private handleIncomingConnection(conn: DataConnection): void {
    const peerId = conn.peer;
    console.log(`Incoming connection from peer: ${peerId}`);
    
    conn.on('open', () => {
      // Create peer connection entry
      const peerConn: PeerConnection = {
        peerId,
        connection: conn,
        strength: 'medium' // Default strength, will be updated based on RTT
      };
      
      // Store the connection
      this.connections.set(peerId, peerConn);
      
      // Update network stats
      this.updateNetworkStats();
      
      // Start measuring connection quality
      this.measureConnectionQuality(peerConn);
      
      // Notify connection handlers
      this.connectionHandlers.forEach(handler => handler(peerConn));
      
      console.log(`Connection established with peer: ${peerId}`);
    });
    
    conn.on('data', (data) => {
      this.handleIncomingData(peerId, data);
    });
    
    conn.on('close', () => {
      this.handlePeerDisconnection(peerId);
    });
    
    conn.on('error', (err) => {
      console.error(`Connection error with peer ${peerId}:`, err);
      this.handlePeerDisconnection(peerId);
    });
  }

  // Handle incoming data
  private handleIncomingData(peerId: string, data: any): void {
    // Update received data stats
    const dataSize = JSON.stringify(data).length / 1024; // Size in KB
    this.networkStats.dataReceived += dataSize;
    
    // Track data transfer stats for server
    if (this.socket && this.userId) {
      this.socket.emit('data-transfer', {
        userId: this.userId,
        dataReceived: dataSize,
        dataShared: 0
      });
    }
    
    // Process received message
    const connection = this.connections.get(peerId);
    if (connection) {
      // Notify message handlers
      this.messageHandlers.forEach(handler => {
        handler({
          peerId,
          userId: connection.userId,
          data,
          connection
        });
      });
    }
  }

  // Handle peer disconnection
  private handlePeerDisconnection(peerId: string): void {
    const connection = this.connections.get(peerId);
    if (connection) {
      console.log(`Peer disconnected: ${peerId}`);
      
      // Close the connection if it's still open
      if (connection.connection.open) {
        connection.connection.close();
      }
      
      // Remove from connections
      this.connections.delete(peerId);
      
      // Update network stats
      this.updateNetworkStats();
      
      // Notify disconnection handlers
      this.disconnectionHandlers.forEach(handler => handler(peerId));
    }
  }

  // Measure connection quality periodically
  private measureConnectionQuality(peerConn: PeerConnection): void {
    const startTime = Date.now();
    
    const pingInterval = setInterval(() => {
      if (!peerConn.connection.open || !this.connections.has(peerConn.peerId)) {
        clearInterval(pingInterval);
        return;
      }
      
      const pingTime = Date.now();
      peerConn.connection.send({ type: 'PING', timestamp: pingTime });
    }, 5000); // Ping every 5 seconds
    
    // Instead of manipulating the dataChannel directly, we'll use the connection's data event
    // which is safer and doesn't have the 'this' context issue
    peerConn.connection.on('data', (data: any) => {
      // Process ping/pong messages
      if (typeof data === 'object' && 'type' in data) {
        if (data.type === 'PING' && 'timestamp' in data) {
          // Send pong response
          peerConn.connection.send({ type: 'PONG', timestamp: data.timestamp });
        } else if (data.type === 'PONG' && 'timestamp' in data) {
          const rtt = Date.now() - data.timestamp;
          this.updateConnectionStrength(peerConn, rtt);
        }
      }
    });
  }

  // Update connection strength based on RTT
  private updateConnectionStrength(peerConn: PeerConnection, rtt: number): void {
    let newStrength: 'strong' | 'medium' | 'weak';
    
    if (rtt < 100) {
      newStrength = 'strong';
    } else if (rtt < 300) {
      newStrength = 'medium';
    } else {
      newStrength = 'weak';
    }
    
    // Only update if the strength has changed
    if (peerConn.strength !== newStrength) {
      peerConn.strength = newStrength;
      
      // Update network stats
      this.updateNetworkStats();
      
      // Send connection strength to server
      if (this.socket && this.peerId) {
        this.socket.emit('connection-strength', {
          peerId: this.peerId,
          targetPeerId: peerConn.peerId,
          strength: newStrength
        });
      }
    }
  }

  // Update network stats based on current connections
  private updateNetworkStats(): void {
    let strongConnections = 0;
    let mediumConnections = 0;
    let weakConnections = 0;
    
    for (const conn of this.connections.values()) {
      if (conn.strength === 'strong') strongConnections++;
      else if (conn.strength === 'medium') mediumConnections++;
      else if (conn.strength === 'weak') weakConnections++;
    }
    
    this.networkStats = {
      ...this.networkStats,
      totalPeers: this.connections.size,
      strongConnections,
      mediumConnections,
      weakConnections
    };
  }

  // Send message to a specific peer
  public sendToPeer(peerId: string, data: any): boolean {
    const connection = this.connections.get(peerId);
    if (connection && connection.connection.open) {
      try {
        connection.connection.send(data);
        
        // Update shared data stats
        const dataSize = JSON.stringify(data).length / 1024; // Size in KB
        this.networkStats.dataShared += dataSize;
        
        // Track data transfer stats for server
        if (this.socket && this.userId) {
          this.socket.emit('data-transfer', {
            userId: this.userId,
            dataShared: dataSize,
            dataReceived: 0
          });
        }
        
        return true;
      } catch (err) {
        console.error(`Error sending data to peer ${peerId}:`, err);
        return false;
      }
    }
    return false;
  }

  // Broadcast data to all connected peers
  public broadcast(data: any): void {
    for (const peerId of this.connections.keys()) {
      this.sendToPeer(peerId, data);
    }
  }

  // Register message handler
  public onMessage(handler: (message: any) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  // Register connection handler
  public onConnection(handler: (connection: PeerConnection) => void): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  // Register disconnection handler
  public onDisconnection(handler: (peerId: string) => void): () => void {
    this.disconnectionHandlers.add(handler);
    return () => this.disconnectionHandlers.delete(handler);
  }

  // Get all current peer connections
  public getConnections(): PeerConnection[] {
    return Array.from(this.connections.values());
  }

  // Get network stats
  public getNetworkStats(): NetworkStats {
    return { ...this.networkStats };
  }

  // Get peer ID
  public getPeerId(): string | null {
    return this.peerId;
  }

  // Close all connections and clean up
  public cleanup(): void {
    // Close all connections
    for (const conn of this.connections.values()) {
      if (conn.connection.open) {
        conn.connection.close();
      }
    }
    
    // Clear connections map
    this.connections.clear();
    
    // Close peer connection
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    
    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Reset stats
    this.networkStats = {
      totalPeers: 0,
      strongConnections: 0,
      mediumConnections: 0,
      weakConnections: 0,
      dataShared: 0,
      dataReceived: 0
    };
  }
}

// Create and export singleton instance
export const webrtcManager = new WebRTCManager();
