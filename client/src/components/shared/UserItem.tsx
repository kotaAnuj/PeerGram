import { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type User = {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  isOnline?: boolean;
  connectionStrength?: 'strong' | 'medium' | 'weak';
  connectionId?: number;
  connectionStatus?: string;
  mutualConnections?: number;
};

type UserItemProps = {
  user: User;
  onAction?: () => void;
  showConnectionButton?: boolean;
  showAcceptRejectButtons?: boolean;
  compact?: boolean;
};

export default function UserItem({ 
  user, 
  onAction, 
  showConnectionButton = false,
  showAcceptRejectButtons = false,
  compact = false
}: UserItemProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSent, setConnectionSent] = useState(user.connectionStatus === 'pending');
  const [isConnected, setIsConnected] = useState(user.connectionStatus === 'accepted');

  const handleConnect = async () => {
    if (!currentUser || isConnecting) return;
    
    setIsConnecting(true);
    
    try {
      await apiRequest('POST', '/api/connections', {
        userId: currentUser.id,
        connectedUserId: user.id,
        status: 'pending'
      });
      
      setConnectionSent(true);
      toast({
        description: `Connection request sent to ${user.displayName}`,
      });
      
      if (onAction) onAction();
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send connection request',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAccept = async () => {
    if (!currentUser || !user.connectionId || isConnecting) return;
    
    setIsConnecting(true);
    
    try {
      await apiRequest('PATCH', `/api/connections/${user.connectionId}`, {
        status: 'accepted'
      });
      
      setIsConnected(true);
      toast({
        description: `You are now connected with ${user.displayName}`,
      });
      
      if (onAction) onAction();
    } catch (error) {
      console.error('Error accepting connection request:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept connection request',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleReject = async () => {
    if (!currentUser || !user.connectionId || isConnecting) return;
    
    setIsConnecting(true);
    
    try {
      await apiRequest('PATCH', `/api/connections/${user.connectionId}`, {
        status: 'rejected'
      });
      
      toast({
        description: `Connection request from ${user.displayName} rejected`,
      });
      
      if (onAction) onAction();
    } catch (error) {
      console.error('Error rejecting connection request:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject connection request',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Determine connection border class
  let connectionBorderClass = '';
  if (user.connectionStrength === 'strong') {
    connectionBorderClass = 'peer-strong';
  } else if (user.connectionStrength === 'medium') {
    connectionBorderClass = 'peer-medium';
  } else if (user.connectionStrength === 'weak') {
    connectionBorderClass = 'peer-weak';
  }

  return (
    <div className={`flex items-center ${compact ? 'py-2' : 'py-3'}`}>
      <Link href={`/profile/${user.id}`}>
        <a className="relative">
          <img 
            src={user.avatar || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} 
            className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full object-cover ${connectionBorderClass}`} 
            alt={user.displayName} 
          />
          {user.isOnline && (
            <div className="online-dot"></div>
          )}
        </a>
      </Link>
      
      <div className="ml-3 flex-1">
        <Link href={`/profile/${user.id}`}>
          <a className="block">
            <h4 className="font-semibold text-sm">{user.displayName}</h4>
            <p className="text-xs text-gray-500">
              {user.username}
              {user.mutualConnections !== undefined && ` • ${user.mutualConnections} mutual connection${user.mutualConnections !== 1 ? 's' : ''}`}
              {user.connectionStrength && (
                <span className={`ml-1 ${
                  user.connectionStrength === 'strong' 
                    ? 'text-success' 
                    : user.connectionStrength === 'medium' 
                      ? 'text-yellow-500' 
                      : 'text-danger'
                }`}>
                  • {user.connectionStrength} connection
                </span>
              )}
            </p>
          </a>
        </Link>
      </div>
      
      {showConnectionButton && !showAcceptRejectButtons && !isConnected && (
        <button 
          onClick={handleConnect}
          disabled={isConnecting || connectionSent}
          className={`text-xs py-1 px-3 rounded-lg ${
            connectionSent 
              ? 'bg-gray-200 text-gray-500' 
              : 'bg-primary text-white hover:bg-blue-600'
          }`}
        >
          {connectionSent ? 'Requested' : 'Connect'}
        </button>
      )}

      {showAcceptRejectButtons && (
        <div className="flex space-x-2">
          <button 
            onClick={handleAccept}
            disabled={isConnecting || isConnected}
            className={`text-xs py-1 px-3 rounded-lg ${
              isConnected 
                ? 'bg-gray-200 text-gray-500' 
                : 'bg-primary text-white hover:bg-blue-600'
            }`}
          >
            {isConnected ? 'Connected' : 'Accept'}
          </button>
          {!isConnected && (
            <button 
              onClick={handleReject}
              disabled={isConnecting}
              className="bg-gray-200 text-gray-700 text-xs py-1 px-3 rounded-lg hover:bg-gray-300"
            >
              Decline
            </button>
          )}
        </div>
      )}

      {isConnected && !showAcceptRejectButtons && !showConnectionButton && (
        <Link href={`/chat/${user.id}`}>
          <a className="text-xs py-1 px-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">
            Message
          </a>
        </Link>
      )}
    </div>
  );
}
