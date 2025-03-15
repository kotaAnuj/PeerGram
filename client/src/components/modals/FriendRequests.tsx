import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import UserItem from '@/components/shared/UserItem';
import { useQuery } from '@tanstack/react-query';

type FriendRequestsProps = {
  onClose: () => void;
};

type User = {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  connectionId?: number;
  connectionStatus?: string;
  mutualConnections?: number;
};

export default function FriendRequests({ onClose }: FriendRequestsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<User[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);

  // Fetch connection requests
  const { data: requestsData, isLoading: loadingRequests, refetch } = useQuery({
    queryKey: [`/api/users/${user?.id}/connection-requests`],
    enabled: !!user,
  });

  // Fetch all users for suggestions
  const { data: allUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user,
  });

  // Fetch user connections for filtering suggestions
  const { data: connections } = useQuery({
    queryKey: [`/api/users/${user?.id}/connections`],
    enabled: !!user,
  });

  // Process connection requests
  useEffect(() => {
    if (!requestsData || !user) return;
    
    const processRequests = async () => {
      const processed: User[] = [];
      
      for (const request of requestsData) {
        try {
          // Get requester user
          const response = await fetch(`/api/users/${request.userId}`);
          if (!response.ok) continue;
          
          const userData = await response.json();
          
          processed.push({
            ...userData,
            connectionId: request.id,
            connectionStatus: 'pending',
            mutualConnections: Math.floor(Math.random() * 5) // For UI demonstration
          });
        } catch (error) {
          console.error('Error processing request:', error);
        }
      }
      
      setRequests(processed);
    };
    
    processRequests();
  }, [requestsData, user]);

  // Generate suggested users
  useEffect(() => {
    if (!allUsers || !user || !connections) return;
    
    // Get IDs of users already connected or with pending requests
    const connectedUserIds = connections.map((conn: any) => 
      conn.userId === user.id ? conn.connectedUserId : conn.userId
    );
    
    const requestUserIds = requests.map(req => req.id);
    
    // Filter out current user and already connected/requested users
    const unconnectedUsers = allUsers.filter((u: User) => 
      u.id !== user.id && 
      !connectedUserIds.includes(u.id) &&
      !requestUserIds.includes(u.id)
    );
    
    // Take up to 5 random users as suggestions
    const shuffled = [...unconnectedUsers].sort(() => 0.5 - Math.random());
    setSuggestedUsers(shuffled.slice(0, 5).map(u => ({
      ...u,
      mutualConnections: Math.floor(Math.random() * 5) // For UI demonstration
    })));
  }, [allUsers, user, connections, requests]);

  const handleAction = () => {
    // Refresh requests
    refetch();
  };

  return (
    <div className="fixed inset-0 bg-overlay z-50 flex justify-end" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-white shadow-lg overflow-auto h-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex justify-between items-center sticky top-0 bg-white">
          <h3 className="font-semibold">Connection Requests</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 60px)', overflowY: 'auto' }}>
          {/* Requests section */}
          {loadingRequests ? (
            // Loading skeletons
            Array(2).fill(0).map((_, i) => (
              <div key={i} className="flex items-center">
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
          ) : requests.length > 0 ? (
            <>
              {requests.map((user) => (
                <UserItem 
                  key={user.id}
                  user={user}
                  showAcceptRejectButtons={true}
                  onAction={handleAction}
                />
              ))}
            </>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <i className="far fa-bell-slash text-4xl mb-3"></i>
              <p>No pending connection requests</p>
            </div>
          )}
          
          <div className="border-t border-border my-4"></div>
          
          {/* Suggestions section */}
          <h4 className="font-semibold text-sm">Suggested Connections</h4>
          
          {loadingUsers ? (
            // Loading skeletons
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 animate-pulse w-32 mb-1"></div>
                  <div className="h-3 bg-gray-100 animate-pulse w-24"></div>
                </div>
                <div className="w-16 h-8 bg-gray-200 animate-pulse rounded-lg"></div>
              </div>
            ))
          ) : suggestedUsers.length > 0 ? (
            <>
              {suggestedUsers.map((user) => (
                <UserItem 
                  key={user.id}
                  user={user}
                  showConnectionButton={true}
                  onAction={handleAction}
                />
              ))}
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No suggestions available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
