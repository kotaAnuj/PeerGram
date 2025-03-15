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
      <div className="max-w-lg mx-auto bg-white md:my-4 md:rounded-lg md:shadow-sm min-h-screen md:min-h-0 flex items-center justify-center">
        <div className="text-center p-4">
          <i className="far fa-frown text-4xl text-gray-400 mb-3"></i>
          <p>Invalid chat selected</p>
        </div>
      </div>
    );
  }

  const handleMessageSent = () => {
    // Refresh messages after sending
    refetch();
  };

  return (
    <div className="max-w-lg mx-auto bg-white md:my-4 md:rounded-lg md:shadow-sm min-h-screen md:min-h-0 md:flex md:flex-col md:h-[calc(100vh-2rem)]">
      <ChatHeader recipientId={recipientId} />
      <ChatMessages recipientId={recipientId} />
      <ChatInput recipientId={recipientId} onMessageSent={handleMessageSent} />
    </div>
  );
}
