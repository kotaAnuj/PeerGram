import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useP2P } from '@/hooks/useP2P';
import { useQuery } from '@tanstack/react-query';
import NetworkVisualizer from '@/components/shared/NetworkVisualizer';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserItem from '@/components/shared/UserItem';

type Connection = {
  id: number;
  userId: number;
  connectedUserId: number;
  status: string;
  strength?: string;
  lastConnectionTime?: Date;
  user?: User;
};

type User = {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  isOnline?: boolean;
  connectionStrength?: string;
};

export default function Network() {
  const { user } = useAuth();
  const { initialized, connections, networkStats } = useP2P();
  const [userConnections, setUserConnections] = useState<Connection[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<Connection[]>([]);

  // Fetch user connections
  const { data: connectionsData, isLoading: loadingConnections, refetch: refetchConnections } = useQuery({
    queryKey: [`/api/users/${user?.id}/connections`],
    enabled: !!user,
  });

  // Fetch connection requests
  const { data: requestsData, isLoading: loadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: [`/api/users/${user?.id}/connection-requests`],
    enabled: !!user,
  });

  // Process connections data
  useEffect(() => {
    if (!connectionsData || !user) return;
    
    const processConnections = async () => {
      const processed: Connection[] = [];
      
      for (const conn of connectionsData) {
        try {
          // Get other user in the connection
          const otherUserId = conn.userId === user.id 
            ? conn.connectedUserId 
            : conn.userId;
          
          const userResponse = await fetch(`/api/users/${otherUserId}`);
          if (!userResponse.ok) continue;
          
          const userData = await userResponse.json();
          
          // Find P2P connection info
          const p2pConnection = connections.find(c => c.userId === otherUserId);
          
          processed.push({
            ...conn,
            user: {
              ...userData,
              isOnline: !!p2pConnection,
              connectionStrength: p2pConnection?.strength
            }
          });
        } catch (error) {
          console.error('Error processing connection:', error);
        }
      }
      
      setUserConnections(processed);
    };
    
    processConnections();
  }, [connectionsData, user, connections]);

  // Process connection requests
  useEffect(() => {
    if (!requestsData || !user) return;
    
    const processRequests = async () => {
      const processed: Connection[] = [];
      
      for (const request of requestsData) {
        try {
          // Get requester user
          const userResponse = await fetch(`/api/users/${request.userId}`);
          if (!userResponse.ok) continue;
          
          const userData = await userResponse.json();
          
          processed.push({
            ...request,
            user: userData
          });
        } catch (error) {
          console.error('Error processing request:', error);
        }
      }
      
      setConnectionRequests(processed);
    };
    
    processRequests();
  }, [requestsData, user]);

  const handleConnectionAction = () => {
    // Refresh both connections and requests
    refetchConnections();
    refetchRequests();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white md:my-4 md:rounded-lg md:shadow-sm min-h-screen md:min-h-0 p-4 pb-16">
      <h1 className="text-lg font-semibold mb-4">My Network</h1>
      
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Network Stats Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Network Statistics</CardTitle>
            <CardDescription>Your P2P network performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Data Shared</span>
                  <span className="font-medium">{networkStats.dataShared.toFixed(2)} MB</span>
                </div>
                <Progress value={Math.min(networkStats.dataShared / 10 * 100, 100)} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Data Received</span>
                  <span className="font-medium">{networkStats.dataReceived.toFixed(2)} MB</span>
                </div>
                <Progress value={Math.min(networkStats.dataReceived / 10 * 100, 100)} className="h-2" />
              </div>
              
              <div className="pt-2 flex justify-between text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-success rounded-full mr-1"></div>
                  <span>Strong: {networkStats.strongConnections}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></div>
                  <span>Medium: {networkStats.mediumConnections}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-danger rounded-full mr-1"></div>
                  <span>Weak: {networkStats.weakConnections}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Network Visualization Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Network Visualization</CardTitle>
            <CardDescription>Your P2P connections</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-full max-w-xs">
              <NetworkVisualizer />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Connections & Requests */}
      <Tabs defaultValue="connections">
        <TabsList className="w-full">
          <TabsTrigger value="connections" className="flex-1">
            My Connections ({userConnections.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1">
            Connection Requests
            {connectionRequests.length > 0 && (
              <span className="ml-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {connectionRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="connections">
          {loadingConnections ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center py-3 border-b border-border">
                <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 animate-pulse w-32 mb-1"></div>
                  <div className="h-3 bg-gray-100 animate-pulse w-24"></div>
                </div>
              </div>
            ))
          ) : userConnections.length > 0 ? (
            <div className="divide-y divide-border">
              {userConnections.map((connection) => (
                <div key={connection.id} className="py-2">
                  {connection.user && (
                    <UserItem 
                      user={{
                        ...connection.user,
                        connectionId: connection.id,
                        connectionStatus: connection.status
                      }}
                      onAction={handleConnectionAction}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-user-friends text-3xl mb-3"></i>
              <p>You don't have any connections yet</p>
              <p className="text-sm mt-1">Connect with other users to build your network</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="requests">
          {loadingRequests ? (
            Array(2).fill(0).map((_, i) => (
              <div key={i} className="flex items-center py-3 border-b border-border">
                <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 animate-pulse w-32 mb-1"></div>
                  <div className="h-3 bg-gray-100 animate-pulse w-24"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-16 h-8 bg-gray-200 animate-pulse rounded-lg"></div>
                  <div className="w-16 h-8 bg-gray-200 animate-pulse rounded-lg"></div>
                </div>
              </div>
            ))
          ) : connectionRequests.length > 0 ? (
            <div className="divide-y divide-border">
              {connectionRequests.map((request) => (
                <div key={request.id} className="py-2">
                  {request.user && (
                    <UserItem 
                      user={{
                        ...request.user,
                        connectionId: request.id,
                        connectionStatus: request.status,
                        mutualConnections: Math.floor(Math.random() * 5) // This is just for UI demonstration
                      }}
                      showAcceptRejectButtons={true}
                      onAction={handleConnectionAction}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-user-plus text-3xl mb-3"></i>
              <p>No pending connection requests</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
