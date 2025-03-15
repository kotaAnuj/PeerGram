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
      <div className="border-b border-zinc-200 dark:border-zinc-800 p-3 flex items-center bg-white dark:bg-zinc-900 z-10 shadow-sm">
        <button onClick={handleBack} className="p-2 md:hidden mr-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse mr-3"></div>
        <div className="flex-1">
          <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded mb-2"></div>
          <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  // Connection strength indicators
  const strengthColors = {
    strong: "bg-green-500 text-green-500",
    medium: "bg-yellow-500 text-yellow-500",
    weak: "bg-red-500 text-red-500"
  };

  const getConnectionIcon = () => {
    if (!connectionStrength) return null;
    
    return (
      <div className="flex items-center gap-1 ml-1 text-xs">
        <span className="w-1 h-1 rounded-full" 
          style={{ backgroundColor: connectionStrength === 'strong' ? '#22c55e' : 
                                  connectionStrength === 'medium' ? '#eab308' : 
                                  '#ef4444' }}></span>
        <span className={connectionStrength === 'strong' ? 'text-green-500 dark:text-green-400' : 
                         connectionStrength === 'medium' ? 'text-yellow-500 dark:text-yellow-400' : 
                         'text-red-500 dark:text-red-400'}>
          P2P
        </span>
      </div>
    );
  };

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center sticky top-0 bg-white dark:bg-zinc-900 z-10 shadow-sm">
      <button 
        onClick={handleBack} 
        className="p-2 md:hidden mr-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <Link href={`/profile/${recipient.id}`}>
        <a className="flex items-center flex-1 py-1.5">
          <div className="relative mr-3">
            <img 
              src={recipient.avatar || `https://ui-avatars.com/api/?name=${recipient.displayName}&background=random`} 
              className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" 
              alt={recipient.displayName} 
            />
            {recipient.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">{recipient.displayName}</h3>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center">
              <span className="truncate">{recipient.isOnline ? 'Active now' : 'Offline'}</span>
              {getConnectionIcon()}
            </div>
          </div>
        </a>
      </Link>
      
      <div className="flex items-center gap-1">
        <button className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </button>
        <button className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
