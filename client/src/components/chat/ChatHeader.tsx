import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useP2P } from '@/hooks/useP2P';

type User = {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
};

type ChatHeaderProps = {
  recipientId: number;
};

export default function ChatHeader({ recipientId }: ChatHeaderProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { connections } = useP2P();
  const [recipient, setRecipient] = useState<User | null>(null);
  const [connectionStrength, setConnectionStrength] = useState<'strong' | 'medium' | 'weak' | null>(null);

  useEffect(() => {
    const fetchRecipient = async () => {
      try {
        const response = await fetch(`/api/users/${recipientId}`);
        if (response.ok) {
          const userData = await response.json();
          setRecipient(userData);

          // Find connection strength if connected via P2P
          const peerConnection = connections.find(conn => conn.userId === recipientId);
          if (peerConnection) {
            setConnectionStrength(peerConnection.strength);
          }
        }
      } catch (error) {
        console.error('Error fetching recipient:', error);
      }
    };

    fetchRecipient();
  }, [recipientId, connections]);

  const handleBack = () => {
    setLocation('/messages');
  };

  if (!recipient) {
    return (
      <div className="border-b border-border p-4 flex items-center sticky top-0 bg-white z-10">
        <button onClick={handleBack} className="md:hidden mr-2">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse mr-3"></div>
        <div className="flex-1">
          <div className="h-4 w-24 bg-gray-200 animate-pulse mb-1"></div>
          <div className="h-3 w-16 bg-gray-100 animate-pulse"></div>
        </div>
      </div>
    );
  }

  let connectionBorderClass = '';
  let connectionText = '';
  let connectionIcon = '';
  
  if (connectionStrength === 'strong') {
    connectionBorderClass = 'peer-strong';
    connectionText = 'Strong connection';
    connectionIcon = 'text-success';
  } else if (connectionStrength === 'medium') {
    connectionBorderClass = 'peer-medium';
    connectionText = 'Medium connection';
    connectionIcon = 'text-yellow-500';
  } else if (connectionStrength === 'weak') {
    connectionBorderClass = 'peer-weak';
    connectionText = 'Weak connection';
    connectionIcon = 'text-danger';
  }

  return (
    <div className="border-b border-border p-4 flex items-center sticky top-0 bg-white z-10">
      <button onClick={handleBack} className="md:hidden mr-2">
        <i className="fas fa-arrow-left"></i>
      </button>
      
      <Link href={`/profile/${recipient.id}`}>
        <a className="flex items-center flex-1">
          <div className="relative mr-3">
            <img 
              src={recipient.avatar || `https://ui-avatars.com/api/?name=${recipient.displayName}&background=random`} 
              className={`w-10 h-10 rounded-full object-cover ${connectionBorderClass}`} 
              alt={recipient.displayName} 
            />
            {recipient.isOnline && (
              <div className="online-dot"></div>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold text-sm">{recipient.displayName}</h3>
            <div className="text-xs text-gray-500 flex items-center">
              <span>{recipient.isOnline ? 'Active now' : 'Offline'}</span>
              {connectionStrength && (
                <>
                  <span className="mx-1">•</span>
                  <span className={`flex items-center ${connectionIcon}`}>
                    <i className="fas fa-signal text-xs mr-1"></i>
                    {connectionText}
                  </span>
                </>
              )}
            </div>
          </div>
        </a>
      </Link>
      
      <div className="flex">
        <button className="p-2 text-primary">
          <i className="fas fa-phone"></i>
        </button>
        <button className="p-2 text-primary">
          <i className="fas fa-video"></i>
        </button>
        <button className="p-2">
          <i className="fas fa-info-circle"></i>
        </button>
      </div>
    </div>
  );
}
