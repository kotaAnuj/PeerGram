import { useEffect, useState, useCallback } from 'react';
import { webrtcManager, PeerConnection, NetworkStats } from '@/lib/webrtc';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { localDB, DataTypes, generateHash } from '@/lib/storage';

export const useP2P = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(false);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connections, setConnections] = useState<PeerConnection[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalPeers: 0,
    strongConnections: 0,
    mediumConnections: 0,
    weakConnections: 0,
    dataShared: 0,
    dataReceived: 0
  });

  // Initialize P2P connection
  const initialize = useCallback(async () => {
    if (!user || initialized) return;
    
    try {
      // Initialize IndexedDB
      await localDB.connect();
      
      // Initialize WebRTC
      const id = await webrtcManager.init(user.id);
      setPeerId(id);
      setInitialized(true);
      
      // Update user's peer ID in the database
      await apiRequest('PATCH', `/api/users/${user.id}`, { peerId: id });
      
      // Set the initial stats
      setConnections(webrtcManager.getConnections());
      setNetworkStats(webrtcManager.getNetworkStats());
      
      toast({
        title: 'P2P Connected',
        description: `Your peer ID is ${id}. Connected to the P2P network.`,
      });
    } catch (error) {
      console.error('P2P initialization error:', error);
      toast({
        title: 'P2P Connection Failed',
        description: 'Failed to connect to the P2P network. Some features may be limited.',
        variant: 'destructive',
      });
    }
  }, [user, initialized, toast]);

  // Update connections and stats
  const updateState = useCallback(() => {
    setConnections(webrtcManager.getConnections());
    setNetworkStats(webrtcManager.getNetworkStats());
  }, []);

  // Set up event listeners when initialized
  useEffect(() => {
    if (!initialized) return;
    
    // Handle connection events
    const connectionHandler = (connection: PeerConnection) => {
      updateState();
      toast({
        title: 'Peer Connected',
        description: `Connected to peer: ${connection.peerId}`,
      });
    };
    
    // Handle disconnection events
    const disconnectionHandler = (peerId: string) => {
      updateState();
      toast({
        description: `Peer disconnected: ${peerId}`,
      });
    };
    
    // Register handlers
    const unsubscribeConnection = webrtcManager.onConnection(connectionHandler);
    const unsubscribeDisconnection = webrtcManager.onDisconnection(disconnectionHandler);
    
    // Set up periodic stats update
    const intervalId = setInterval(() => {
      updateState();
    }, 10000);
    
    return () => {
      unsubscribeConnection();
      unsubscribeDisconnection();
      clearInterval(intervalId);
    };
  }, [initialized, toast, updateState]);

  // Initialize when user is available
  useEffect(() => {
    if (user && !initialized) {
      initialize();
    }
    
    return () => {
      if (initialized) {
        webrtcManager.cleanup();
        localDB.close();
        setInitialized(false);
      }
    };
  }, [user, initialized, initialize]);

  // Send message to a peer
  const sendToPeer = (targetPeerId: string, data: any) => {
    if (!initialized) return false;
    return webrtcManager.sendToPeer(targetPeerId, data);
  };

  // Broadcast message to all peers
  const broadcast = (data: any) => {
    if (!initialized) return;
    webrtcManager.broadcast(data);
  };

  // Store content in the P2P network
  const storeContent = async (type: string, content: any) => {
    if (!initialized || !user) return null;
    
    try {
      // Generate content hash
      const hash = generateHash(content);
      
      // Store locally first
      const id = await localDB.saveItem({
        type,
        data: content,
        hash,
        userId: user.id
      });
      
      // Broadcast to peers
      broadcast({
        type: 'STORE',
        contentType: type,
        content,
        hash,
        userId: user.id,
        timestamp: Date.now()
      });
      
      return id;
    } catch (error) {
      console.error('Error storing content:', error);
      toast({
        title: 'Storage Error',
        description: 'Failed to store content in the P2P network.',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Retrieve content from the P2P network
  const retrieveContent = async (type: string, hash?: string) => {
    if (!initialized) return [];
    
    try {
      // First check local storage
      const localItems = await localDB.getItemsByType(type);
      
      if (hash) {
        return localItems.filter(item => item.hash === hash);
      }
      
      return localItems;
    } catch (error) {
      console.error('Error retrieving content:', error);
      toast({
        title: 'Retrieval Error',
        description: 'Failed to retrieve content from the P2P network.',
        variant: 'destructive',
      });
      return [];
    }
  };

  return {
    initialized,
    peerId,
    connections,
    networkStats,
    sendToPeer,
    broadcast,
    storeContent,
    retrieveContent,
    updateState,
  };
};
