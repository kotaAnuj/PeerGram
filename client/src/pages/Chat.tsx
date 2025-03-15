import { useEffect } from 'react';
import { useRoute } from 'wouter';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import { useQuery } from '@tanstack/react-query';

export default function Chat() {
  const [match, params] = useRoute('/chat/:id');
  const recipientId = parseInt(params?.id || '0');
  
  // Fetch messages to ensure they're cached
  const { refetch } = useQuery({
    queryKey: ['/api/messages', recipientId],
    enabled: !!recipientId,
  });

  // Set up periodic refresh for messages
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch();
    }, 15000); // Refresh every 15 seconds
    
    return () => clearInterval(intervalId);
  }, [refetch]);

  if (!match || isNaN(recipientId) || recipientId <= 0) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-zinc-900 md:my-4 md:rounded-lg md:shadow-sm min-h-screen md:min-h-0 flex items-center justify-center">
        <div className="text-center p-6">
          <svg className="w-16 h-16 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
          </svg>
          <h3 className="text-xl font-medium text-zinc-700 dark:text-zinc-200 mb-2">No conversation selected</h3>
          <p className="text-zinc-500 dark:text-zinc-400">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const handleMessageSent = () => {
    // Refresh messages after sending
    refetch();
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-zinc-900 md:my-4 md:rounded-lg md:shadow-sm min-h-screen md:min-h-0 md:flex md:flex-col md:h-[calc(100vh-2rem)] overflow-hidden">
      <ChatHeader recipientId={recipientId} />
      <ChatMessages recipientId={recipientId} />
      <ChatInput recipientId={recipientId} onMessageSent={handleMessageSent} />
    </div>
  );
}
