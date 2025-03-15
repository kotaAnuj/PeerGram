import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useP2P } from '@/hooks/useP2P';
import PostCard from '@/components/shared/PostCard';
import StoryCircle from '@/components/shared/StoryCircle';
import { useQuery } from '@tanstack/react-query';

type Post = {
  id: number;
  userId: number;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  contentHash?: string;
  createdAt: Date;
  user?: User;
};

type User = {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  isOnline?: boolean;
};

export default function Home() {
  const { user } = useAuth();
  const { initialized, connections } = useP2P();
  const [activeConnections, setActiveConnections] = useState<User[]>([]);

  // Fetch feed posts
  const { data: posts, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/feed/${user?.id}`],
    enabled: !!user,
  });

  // Get active connections for stories
  useEffect(() => {
    const fetchActiveConnections = async () => {
      if (!user) return;
      
      try {
        // Get user connections
        const connectionsResponse = await fetch(`/api/users/${user.id}/connections`);
        if (!connectionsResponse.ok) throw new Error('Failed to fetch connections');
        
        const connectionsData = await connectionsResponse.json();
        
        // Get user data for each connection
        const activeUsers: User[] = [];
        
        for (const conn of connectionsData) {
          const userId = conn.userId === user.id ? conn.connectedUserId : conn.userId;
          
          try {
            const userResponse = await fetch(`/api/users/${userId}`);
            if (userResponse.ok) {
              const userData = await userResponse.json();
              // Check if this user is connected via P2P
              const isOnline = connections.some(c => c.userId === userId);
              activeUsers.push({
                ...userData,
                isOnline
              });
            }
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
          }
        }
        
        setActiveConnections(activeUsers);
      } catch (error) {
        console.error('Error fetching active connections:', error);
      }
    };
    
    fetchActiveConnections();
  }, [user, connections]);

  if (!user) {
    return null; // This should never happen since this page is protected
  }

  return (
    <div className="max-w-lg mx-auto bg-white md:my-4 md:rounded-lg md:shadow-sm min-h-screen md:min-h-0">
      {/* Stories */}
      <div className="border-b border-border p-4">
        <div className="flex overflow-x-auto space-x-4 pb-2">
          {/* Current user story */}
          <StoryCircle 
            userId={user.id}
            username="You"
            avatar={user.avatar}
            hasUnseenStory={false}
            isActive={true}
          />
          
          {/* Connected users' stories */}
          {activeConnections.map((connection) => (
            <StoryCircle 
              key={connection.id}
              userId={connection.id}
              username={connection.username}
              avatar={connection.avatar}
              hasUnseenStory={connection.isOnline}
              isActive={false}
            />
          ))}
          
          {/* Show skeletons while loading */}
          {isLoading && !activeConnections.length && (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="w-10 h-3 bg-gray-200 animate-pulse mt-1 rounded"></div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Posts Feed */}
      <div className="pb-16">
        {isLoading ? (
          // Loading skeletons
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-border rounded-md mb-4 overflow-hidden">
              <div className="p-3 border-b border-border flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse mr-2"></div>
                <div className="h-4 w-24 bg-gray-200 animate-pulse"></div>
              </div>
              <div className="bg-gray-200 animate-pulse h-96 w-full"></div>
              <div className="p-3">
                <div className="h-4 w-24 bg-gray-200 animate-pulse mb-3"></div>
                <div className="h-3 w-full bg-gray-100 animate-pulse mb-1"></div>
                <div className="h-3 w-3/4 bg-gray-100 animate-pulse"></div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="p-4 text-center text-danger">
            <p>Error loading posts. Please try again.</p>
            <button 
              onClick={() => refetch()}
              className="mt-2 text-primary text-sm"
            >
              Retry
            </button>
          </div>
        ) : posts?.length ? (
          posts.map((post: Post) => (
            <PostCard key={post.id} post={post} onRefresh={refetch} />
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <i className="far fa-image text-4xl mb-3"></i>
            <p>No posts in your feed yet.</p>
            <p className="text-sm mt-1">Connect with others or create a post!</p>
          </div>
        )}
      </div>
    </div>
  );
}
