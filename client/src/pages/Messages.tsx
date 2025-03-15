import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useP2P } from '@/hooks/useP2P';
import { useQuery } from '@tanstack/react-query';
import { formatMessageTime } from '@/lib/utils';

type User = {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  isOnline?: boolean;
  connectionStrength?: 'strong' | 'medium' | 'weak';
  lastMessage?: {
    content: string;
    timestamp: Date;
    isRead: boolean;
  };
};

export default function Messages() {
  const { user } = useAuth();
  const { connections } = useP2P();
  const [, setLocation] = useLocation();
  const [chats, setChats] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch connections
  const { data: connectionsData, isLoading: loadingConnections } = useQuery({
    queryKey: [`/api/users/${user?.id}/connections`],
    enabled: !!user,
  });

  useEffect(() => {
    const fetchChats = async () => {
      if (!user || !connectionsData) return;
      
      const chatUsers: User[] = [];
      
      for (const connection of connectionsData) {
        // Get the other user's ID
        const otherUserId = connection.userId === user.id 
          ? connection.connectedUserId 
          : connection.userId;
        
        try {
          // Fetch user info
          const userResponse = await fetch(`/api/users/${otherUserId}`);
          if (!userResponse.ok) continue;
          
          const userData = await userResponse.json();
          
          // Fetch messages between users
          const messagesResponse = await fetch(`/api/messages/${user.id}/${otherUserId}`);
          if (!messagesResponse.ok) continue;
          
          const messagesData = await messagesResponse.json();
          
          // Check if there are any messages
          if (messagesData.length > 0) {
            // Sort messages by date and get the latest
            const sortedMessages = messagesData.sort((a: any, b: any) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            
            const lastMessage = sortedMessages[0];
            
            // Find P2P connection status
            const peerConnection = connections.find(conn => conn.userId === otherUserId);
            
            chatUsers.push({
              ...userData,
              isOnline: !!peerConnection,
              connectionStrength: peerConnection?.strength,
              lastMessage: {
                content: lastMessage.content,
                timestamp: new Date(lastMessage.createdAt),
                isRead: lastMessage.isRead || lastMessage.senderId === user.id
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching chat for user ${otherUserId}:`, error);
        }
      }
      
      // Sort by most recent message
      chatUsers.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
      });
      
      setChats(chatUsers);
    };
    
    fetchChats();
  }, [user, connectionsData, connections]);

  // Filter chats based on search query
  const filteredChats = searchQuery
    ? chats.filter(chat => 
        chat.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats;

  return (
    <div className="max-w-lg mx-auto bg-white md:my-4 md:rounded-lg md:shadow-sm min-h-screen md:min-h-0">
      {/* Header */}
      <div className="border-b border-border p-4 sticky top-0 bg-white z-10">
        <h1 className="text-lg font-semibold">Messages</h1>
        
        {/* Search */}
        <div className="mt-3 relative">
          <input 
            type="text"
            placeholder="Search messages..."
            className="w-full py-2 px-4 pr-10 rounded-full bg-gray-100 text-sm focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-3 top-2.5 text-gray-400">
            <i className="fas fa-search"></i>
          </div>
        </div>
      </div>
      
      {/* Chats list */}
      <div className="pb-16">
        {loadingConnections ? (
          // Loading skeleton
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center p-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="ml-3 flex-1">
                <div className="h-4 bg-gray-200 animate-pulse w-32 mb-2"></div>
                <div className="h-3 bg-gray-100 animate-pulse w-48"></div>
              </div>
            </div>
          ))
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <a className="flex items-center p-4 border-b border-border hover:bg-gray-50">
                <div className="relative">
                  <img 
                    src={chat.avatar || `https://ui-avatars.com/api/?name=${chat.displayName}&background=random`} 
                    alt={chat.displayName}
                    className={`w-12 h-12 rounded-full object-cover ${
                      chat.connectionStrength === 'strong' 
                        ? 'peer-strong' 
                        : chat.connectionStrength === 'medium' 
                          ? 'peer-medium' 
                          : chat.connectionStrength === 'weak' 
                            ? 'peer-weak' 
                            : ''
                    }`}
                  />
                  {chat.isOnline && (
                    <div className="online-dot"></div>
                  )}
                </div>
                
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-semibold text-sm">{chat.displayName}</h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(chat.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  
                  {chat.lastMessage && (
                    <div className="flex">
                      <p className={`text-sm truncate ${!chat.lastMessage.isRead && chat.lastMessage.content ? 'font-semibold' : 'text-gray-500'}`}>
                        {chat.lastMessage.content}
                      </p>
                      
                      {!chat.lastMessage.isRead && (
                        <span className="ml-2 w-2 h-2 rounded-full bg-primary"></span>
                      )}
                    </div>
                  )}
                </div>
              </a>
            </Link>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <i className="far fa-comment-dots text-4xl mb-3"></i>
            <p>No messages yet</p>
            <p className="text-sm mt-1">Connect with others to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
