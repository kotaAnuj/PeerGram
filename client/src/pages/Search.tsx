import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import UserItem from '@/components/shared/UserItem';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

type User = {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  isOnline?: boolean;
  connectionStatus?: string;
  mutualConnections?: number;
};

export default function Search() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch user connections for reference
  const { data: connections, refetch: refetchConnections } = useQuery({
    queryKey: [`/api/users/${user?.id}/connections`],
    enabled: !!user,
  });

  // Fetch all users for search (in a real app, this would be paginated and have a proper search API)
  const { data: allUsers, isLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user,
  });

  // Generate suggested users
  useEffect(() => {
    if (!user || !allUsers || !connections) return;
    
    // Filter out current user and already connected users
    const connectedUserIds = connections.map((conn: any) => 
      conn.userId === user.id ? conn.connectedUserId : conn.userId
    );
    
    const unconnectedUsers = allUsers.filter((u: User) => 
      u.id !== user.id && !connectedUserIds.includes(u.id)
    );
    
    // Take up to 5 random users as suggestions
    const shuffled = [...unconnectedUsers].sort(() => 0.5 - Math.random());
    setSuggestedUsers(shuffled.slice(0, 5));
  }, [user, allUsers, connections]);

  // Handle search query changes
  useEffect(() => {
    if (!searchQuery.trim() || !allUsers || !user) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    const query = searchQuery.toLowerCase();
    const results = allUsers.filter((u: User) => 
      u.id !== user.id && (
        u.username.toLowerCase().includes(query) || 
        u.displayName.toLowerCase().includes(query)
      )
    );
    
    // Add connection status to results
    const resultsWithStatus = results.map((u: User) => {
      const connection = connections?.find((conn: any) => 
        (conn.userId === user.id && conn.connectedUserId === u.id) ||
        (conn.userId === u.id && conn.connectedUserId === user.id)
      );
      
      return {
        ...u,
        connectionStatus: connection?.status,
        // In a real app, you would calculate mutualConnections here
        mutualConnections: Math.floor(Math.random() * 5) // This is just for UI demonstration
      };
    });
    
    setSearchResults(resultsWithStatus);
    setIsSearching(false);
  }, [searchQuery, allUsers, connections, user]);

  const handleUserAction = () => {
    refetchConnections();
    
    toast({
      description: 'Connection request sent successfully',
    });
  };

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto bg-white md:my-4 md:rounded-lg md:shadow-sm min-h-screen md:min-h-0">
      {/* Search header */}
      <div className="border-b border-border p-4 sticky top-0 bg-white z-10">
        <h1 className="text-lg font-semibold mb-3">Search</h1>
        
        <div className="relative">
          <input 
            type="text"
            placeholder="Search users..."
            className="w-full py-2 px-4 pr-10 rounded-full bg-gray-100 text-sm focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-3 top-2.5 text-gray-400">
            {isSearching ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-search"></i>
            )}
          </div>
        </div>
      </div>
      
      {/* Search results */}
      <div className="p-4 pb-16">
        {searchQuery && (
          <div>
            <h2 className="text-sm font-semibold mb-3">Search Results</h2>
            
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center py-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 animate-pulse w-32 mb-1"></div>
                    <div className="h-3 bg-gray-100 animate-pulse w-24"></div>
                  </div>
                </div>
              ))
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <UserItem 
                    key={user.id}
                    user={user}
                    showConnectionButton={user.connectionStatus !== 'accepted'}
                    onAction={handleUserAction}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No users found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}
        
        {!searchQuery && (
          <div>
            <h2 className="text-sm font-semibold mb-3">Suggested People</h2>
            
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center py-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 animate-pulse w-32 mb-1"></div>
                    <div className="h-3 bg-gray-100 animate-pulse w-24"></div>
                  </div>
                </div>
              ))
            ) : suggestedUsers.length > 0 ? (
              <div className="space-y-2">
                {suggestedUsers.map((user) => (
                  <UserItem 
                    key={user.id}
                    user={user}
                    showConnectionButton={true}
                    onAction={handleUserAction}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No suggestions available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
