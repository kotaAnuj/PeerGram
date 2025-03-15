import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useP2P } from '@/hooks/useP2P';
import PostCard from '@/components/shared/PostCard';
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
};

export default function Explore() {
  const { user } = useAuth();
  const { initialized, connections } = useP2P();
  const [explorePosts, setExplorePosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'p2p'>('all');

  // Fetch all posts (in a real app, this would be paginated and filtered)
  const { data: posts, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/posts'],
    enabled: !!user,
  });

  // Get all users for mapping to posts
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user,
  });

  // Filter and process posts for explore page
  useEffect(() => {
    if (!posts || !users || !user) return;
    
    // Add user data to posts
    const postsWithUsers = posts.map((post: Post) => {
      const postUser = users.find((u: User) => u.id === post.userId);
      return { ...post, user: postUser };
    });
    
    // Filter out current user's posts
    const otherUsersPosts = postsWithUsers.filter((post: Post) => post.userId !== user.id);
    
    // Get connected user IDs for P2P tab filtering
    const connectedUserIds = connections.map(conn => conn.userId);
    
    if (activeTab === 'p2p') {
      // Filter to only show posts from P2P connected users
      const p2pPosts = otherUsersPosts.filter((post: Post) => 
        connectedUserIds.includes(post.userId)
      );
      setExplorePosts(p2pPosts);
    } else {
      // Show all posts for the 'all' tab
      setExplorePosts(otherUsersPosts);
    }
  }, [posts, users, user, connections, activeTab]);

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-lg mx-auto bg-white md:my-4 md:rounded-lg md:shadow-sm min-h-screen md:min-h-0">
      {/* Explore header */}
      <div className="border-b border-border p-4 sticky top-0 bg-white z-10">
        <h1 className="text-lg font-semibold mb-3">Explore</h1>
        
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button 
            className={`flex-1 py-2 text-sm font-medium ${activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('all')}
          >
            All Posts
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-medium ${activeTab === 'p2p' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('p2p')}
          >
            P2P Network
          </button>
        </div>
      </div>
      
      {/* Posts grid */}
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
        ) : explorePosts.length ? (
          explorePosts.map((post: Post) => (
            <PostCard key={post.id} post={post} onRefresh={refetch} />
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <i className="far fa-compass text-4xl mb-3"></i>
            <p>{activeTab === 'p2p' ? 'No posts from your P2P connections' : 'No posts to explore yet'}</p>
            {activeTab === 'p2p' && connections.length === 0 && (
              <p className="text-sm mt-1">Connect with others to see their posts</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
