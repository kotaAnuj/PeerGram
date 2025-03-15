import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useP2P } from '@/hooks/useP2P';
import { useQuery } from '@tanstack/react-query';
import MessageItem from './MessageItem';
import { useToast } from '@/hooks/use-toast';

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  embedData?: any;
  isRead: boolean;
  deliveryStatus: string;
  createdAt: Date;
};

type ChatMessagesProps = {
  recipientId: number;
};

export default function ChatMessages({ recipientId }: ChatMessagesProps) {
  const { user } = useAuth();
  const { initialized, sendToPeer, onMessage } = useP2P();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newP2PMessages, setNewP2PMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch messages from API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/messages', user?.id, recipientId],
    enabled: !!user && !!recipientId,
  });

  useEffect(() => {
    if (data) {
      setMessages(data);
    }
  }, [data]);

  // Listen for new messages via P2P
  useEffect(() => {
    if (!initialized || !user) return;

    const unsubscribe = onMessage((message: any) => {
      if (message.data.type === 'MESSAGE' && 
          ((message.data.senderId === recipientId && message.data.receiverId === user.id) ||
           (message.data.senderId === user.id && message.data.receiverId === recipientId))) {
        
        // Add message to UI immediately via P2P
        setNewP2PMessages(prev => [...prev, message.data]);
        
        // Send delivery acknowledgment
        if (message.data.senderId === recipientId && message.peerId) {
          sendToPeer(message.peerId, {
            type: 'MESSAGE_DELIVERED',
            messageId: message.data.messageId,
            receiverId: user.id
          });
        }
        
        // Refresh messages from API to get server recorded version
        setTimeout(() => {
          refetch();
        }, 500);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [initialized, user, recipientId, onMessage, sendToPeer, refetch]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, newP2PMessages]);

  // Mark messages as read
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!user) return;
      
      const unreadMessages = messages.filter(
        msg => msg.senderId === recipientId && !msg.isRead
      );
      
      for (const msg of unreadMessages) {
        try {
          await fetch(`/api/messages/${msg.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true }),
          });
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      }
    };

    markMessagesAsRead();
  }, [messages, recipientId, user]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center bg-zinc-900/5 dark:bg-zinc-50/5">
        <div className="animate-pulse flex space-x-2 justify-center">
          <div className="h-2 w-2 bg-primary rounded-full"></div>
          <div className="h-2 w-2 bg-primary rounded-full"></div>
          <div className="h-2 w-2 bg-primary rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center bg-zinc-900/5 dark:bg-zinc-50/5">
        <div className="text-red-500">Error loading messages. Please try again.</div>
      </div>
    );
  }

  // Combine API messages and new P2P messages
  const allMessages = [...messages];
  
  // Add P2P messages that aren't yet in the API responses
  newP2PMessages.forEach(p2pMsg => {
    const exists = allMessages.some(msg => 
      (msg.id === p2pMsg.id) || 
      (msg.content === p2pMsg.content && 
       new Date(msg.createdAt).getTime() - new Date(p2pMsg.timestamp).getTime() < 10000)
    );
    
    if (!exists) {
      allMessages.push({
        id: p2pMsg.messageId || -Math.random(), // Temporary negative ID for new messages
        senderId: p2pMsg.senderId,
        receiverId: p2pMsg.receiverId,
        content: p2pMsg.content,
        embedData: p2pMsg.embedData,
        isRead: false,
        deliveryStatus: 'sent',
        createdAt: new Date(p2pMsg.timestamp || Date.now()),
      });
    }
  });

  // Sort messages by timestamp
  allMessages.sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Group messages by date
  const groupedMessages: { [key: string]: Message[] } = {};
  allMessages.forEach((message) => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  return (
    <div 
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto bg-zinc-900/5 dark:bg-zinc-50/5" 
      id="chatMessages"
    >
      {allMessages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-500">
          <svg className="w-12 h-12 mb-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          <p className="text-sm">No messages yet. Say hello!</p>
        </div>
      ) : (
        <div className="px-4 py-5 space-y-6">
          {Object.entries(groupedMessages).map(([date, messagesForDate]) => (
            <div key={date} className="space-y-3">
              <div className="flex justify-center">
                <div className="bg-zinc-100 dark:bg-zinc-800 text-xs px-3 py-1 rounded-full">
                  {new Date(date).toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </div>
              </div>

              {messagesForDate.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isSender={message.senderId === user?.id}
                  recipientId={recipientId}
                />
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
