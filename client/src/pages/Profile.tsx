import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useP2P } from '@/hooks/useP2P';
import { useQuery } from '@tanstack/react-query';
import PostCard from '@/components/shared/PostCard';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type User = {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
  peerId?: string;
  connectionStatus?: string;
  connectionId?: number;
};

type Post = {
  id: number;
  userId: number;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  contentHash?: string;
  createdAt: Date;
};

export default function Profile() {
  const [match, params] = useRoute('/profile/:id');
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { connections } = useP2P();
  const { toast } = useToast();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const profileId = params?.id ? parseInt(params.id) : user?.id;

  // Fetch profile user
  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: [`/api/users/${profileId}`],
    enabled: !!profileId,
  });

  // Fetch user posts
  const { data: postsData, isLoading: loadingPosts, refetch: refetchPosts } = useQuery({
    queryKey: [`/api/users/${profileId}/posts`],
    enabled: !!profileId,
  });

  // Fetch connections
  const { data: connectionsData, refetch: refetchConnections } = useQuery({
    queryKey: [`/api/users/${user?.id}/connections`],
    enabled: !!user?.id && !!profileId && profileId !== user?.id,
  });

  // Set up profile user data
  useEffect(() => {
    if (!userData || !user) return;
    
    // Check if viewing own profile
    const isOwnProfile = userData.id === user.id;
    setIsCurrentUser(isOwnProfile);
    
    // If not own profile, check connection status
    if (!isOwnProfile && connectionsData) {
      const connection = connectionsData.find(
        (conn: any) => 
          (conn.userId === user.id && conn.connectedUserId === userData.id) ||
          (conn.userId === userData.id && conn.connectedUserId === user.id)
      );
      
      // Check if P2P connected
      const peerConnection = connections.find(conn => conn.userId === userData.id);
      
      setProfileUser({
        ...userData,
        isOnline: !!peerConnection,
        connectionStatus: connection?.status,
        connectionId: connection?.id
      });
    } else {
      setProfileUser(userData);
    }
  }, [userData, user, connectionsData, connections]);

  const handleConnect = async () => {
    if (!user || !profileUser) return;
    
    try {
      await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          connectedUserId: profileUser.id,
          status: 'pending',
        }),
      });
      
      // Update connection status
      setProfileUser({
        ...profileUser,
        connectionStatus: 'pending',
      });
      
      // Refresh connections
      refetchConnections();
      
      toast({
        description: `Connection request sent to ${profileUser.displayName}`,
      });
    } catch (error) {
      console.error('Error connecting:', error);
      toast({
        title: 'Error',
        description: 'Failed to send connection request',
        variant: 'destructive',
      });
    }
  };

  const handleAccept = async () => {
    if (!profileUser?.connectionId) return;
    
    try {
      await fetch(`/api/connections/${profileUser.connectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'accepted',
        }),
      });
      
      // Update connection status
      setProfileUser({
        ...profileUser,
        connectionStatus: 'accepted',
      });
      
      // Refresh connections
      refetchConnections();
      
      toast({
        description: `You are now connected with ${profileUser.displayName}`,
      });
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept connection request',
        variant: 'destructive',
      });
    }
  };

  const handleMessage = () => {
    if (profileUser) {
      setLocation(`/chat/${profileUser.id}`);
    }
  };

  // Loading state
  if (loadingUser) {
    return (
      <div className="max-w-lg mx-auto bg-white md:my-4 md:rounded-lg md:shadow-sm min-h-screen md:min-h-0">
        <div className="p-4">
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="ml-4 flex-1">
              <div className="h-5 bg-gray-200 animate-pulse w-32 mb-2"></div>
              <div className="h-4 bg-gray-100 animate-pulse w-24"></div>
            </div>
          </div>
          <div className="h-12 bg-gray-200 animate-pulse w-full mb-6"></div>
          <div className="flex justify-between mb-6">
            <div className="h-16 bg-gray-200 animate-pulse w-[30%]"></div>
            <div className="h-16 bg-gray-200 animate-pulse w-[30%]"></div>
            <div className="h-16 bg-gray-200 animate-pulse w-[30%]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser || !user) {
    return (
      <div className="max-w-lg mx-auto bg-white md:my-4 md:rounded-lg md:shadow-sm min-h-screen md:min-h-0 flex items-center justify-center">
        <div className="text-center p-4">
          <i className="far fa-user-circle text-4xl text-gray-400 mb-3"></i>
          <p>User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white md:my-4 md:rounded-lg md:shadow-sm min-h-screen md:min-h-0 pb-16">
      {/* Profile header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start mb-4">
          <img 
            src={profileUser.avatar || `https://ui-avatars.com/api/?name=${profileUser.displayName}&background=random`} 
            alt={profileUser.displayName}
            className="w-20 h-20 rounded-full object-cover"
          />
          
          <div className="ml-4 flex-1">
            <h1 className="text-xl font-semibold">{profileUser.displayName}</h1>
            <p className="text-sm text-gray-500">@{profileUser.username}</p>
            
            {!isCurrentUser && (
              <div className="mt-2 flex space-x-2">
                {profileUser.connectionStatus === 'accepted' ? (
                  <>
                    <Button size="sm" onClick={handleMessage}>
                      Message
                    </Button>
                    <Button size="sm" variant="outline">
                      Connected
                    </Button>
                  </>
                ) : profileUser.connectionStatus === 'pending' ? (
                  profileUser.connectionId ? (
                    <>
                      <Button size="sm" onClick={handleAccept}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline">
                        Decline
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      Requested
                    </Button>
                  )
                ) : (
                  <Button size="sm" onClick={handleConnect}>
                    Connect
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Bio */}
        <p className="text-sm mb-4">{profileUser.bio || 'No bio yet.'}</p>
        
        {/* Stats */}
        <div className="flex justify-between">
          <div className="text-center">
            <div className="font-semibold">{postsData?.length || 0}</div>
            <div className="text-xs text-gray-500">Posts</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">
              {connectionsData?.filter((c: any) => c.status === 'accepted').length || 0}
            </div>
            <div className="text-xs text-gray-500">Connections</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">
              {isCurrentUser && profileUser.isOnline ? 'Online' : profileUser.isOnline ? 'Connected' : 'Offline'}
            </div>
            <div className="text-xs text-gray-500">Status</div>
          </div>
        </div>
      </div>
      
      {/* Content tabs */}
      <Tabs defaultValue="posts">
        <TabsList className="w-full justify-start border-b border-border rounded-none">
          <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
          <TabsTrigger value="network" className="flex-1">Network</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="p-4">
          {loadingPosts ? (
            Array(2).fill(0).map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-md mb-4 overflow-hidden">
                <div className="p-3 border-b border-border flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse mr-2"></div>
                  <div className="h-4 w-24 bg-gray-200 animate-pulse"></div>
                </div>
                <div className="bg-gray-200 animate-pulse h-64 w-full"></div>
                <div className="p-3">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse mb-3"></div>
                  <div className="h-3 w-full bg-gray-100 animate-pulse mb-1"></div>
                  <div className="h-3 w-3/4 bg-gray-100 animate-pulse"></div>
                </div>
              </div>
            ))
          ) : postsData?.length > 0 ? (
            postsData.map((post: Post) => (
              <PostCard 
                key={post.id} 
                post={{ ...post, user: profileUser }} 
                onRefresh={refetchPosts}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="far fa-images text-4xl mb-3"></i>
              <p>No posts yet</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="network" className="p-4">
          <div className="bg-white border border-border rounded-md p-4 mb-4">
            <h3 className="font-semibold mb-3">Network Information</h3>
            
            {profileUser.peerId && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Peer ID</p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded overflow-x-auto">
                  {profileUser.peerId}
                </p>
              </div>
            )}
            
            <div className="flex items-center mb-2">
              <div className={`w-3 h-3 rounded-full ${profileUser.isOnline ? 'bg-success' : 'bg-gray-300'} mr-2`}></div>
              <p className="text-sm">{profileUser.isOnline ? 'Online in P2P Network' : 'Not connected to P2P Network'}</p>
            </div>
            
            {profileUser.connectionStatus === 'accepted' && (
              <div className="border-t border-border mt-3 pt-3">
                <p className="text-xs text-gray-500 mb-1">Connection Strength</p>
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-primary"
                    style={{ width: `${connections.find(c => c.userId === profileUser.id)?.strength === 'strong' ? 80 : connections.find(c => c.userId === profileUser.id)?.strength === 'medium' ? 50 : 30}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right mt-1">
                  {connections.find(c => c.userId === profileUser.id)?.strength || 'Unknown'}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
