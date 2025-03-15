import { useState, useRef, ChangeEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useP2P } from '@/hooks/useP2P';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { detectLinks, generateId } from '@/lib/utils';
import { localDB, DataTypes } from '@/lib/storage';

type ChatInputProps = {
  recipientId: number;
  onMessageSent?: () => void;
};

export default function ChatInput({ recipientId, onMessageSent }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { initialized, connections, peerId, sendToPeer } = useP2P();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find recipient connection if available
  const recipientConnection = connections.find(conn => conn.userId === recipientId);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!message.trim() || !user) return;
    
    try {
      // Detect links in message
      const links = detectLinks(message);
      let embedData = undefined;
      
      if (links.length > 0) {
        // For now, just store the first link
        // In a full implementation, you would fetch metadata for the link here
        embedData = { url: links[0] };
      }
      
      // First send via API to ensure persistence
      const response = await apiRequest('POST', '/api/messages', {
        senderId: user.id,
        receiverId: recipientId,
        content: message,
        embedData,
        isRead: false,
        deliveryStatus: 'sent'
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const messageData = await response.json();
      
      // Then send via P2P for instant delivery if connection exists
      if (initialized && recipientConnection) {
        sendToPeer(recipientConnection.peerId, {
          type: 'MESSAGE',
          messageId: messageData.id,
          senderId: user.id,
          receiverId: recipientId,
          content: message,
          embedData,
          timestamp: new Date(),
        });
      }
      
      // Clear input
      setMessage('');
      
      // Callback after sending
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setIsUploading(true);
      
      // In a real P2P application, we would:
      // 1. Convert file to ArrayBuffer or Base64
      // 2. Generate a unique content hash
      // 3. Store it locally and send notification to peers
      
      // For this demo, we'll:
      // 1. Create a blob URL to simulate file attachment
      // 2. Send a link to that "file"
      
      const fileUrl = URL.createObjectURL(file);
      const messageText = `Shared a file: ${file.name}`;
      
      // Create a message that references the file
      const response = await apiRequest('POST', '/api/messages', {
        senderId: user.id,
        receiverId: recipientId,
        content: messageText,
        embedData: {
          type: 'file',
          name: file.name,
          size: file.size,
          mimeType: file.type
        },
        isRead: false,
        deliveryStatus: 'sent'
      });
      
      if (!response.ok) {
        throw new Error('Failed to send file');
      }
      
      const messageData = await response.json();
      
      // Also send via P2P if connected
      if (initialized && recipientConnection) {
        sendToPeer(recipientConnection.peerId, {
          type: 'MESSAGE',
          messageId: messageData.id,
          senderId: user.id,
          receiverId: recipientId,
          content: messageText,
          embedData: {
            type: 'file',
            name: file.name,
            size: file.size,
            mimeType: file.type
          },
          timestamp: new Date(),
        });
      }
      
      // Store file in local DB for P2P sharing
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
            await localDB.saveItem({
              type: DataTypes.MESSAGE,
              data: {
                fileData: event.target.result,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                messageId: messageData.id
              },
              hash: `file_${messageData.id}`,
              userId: user.id
            });
          }
        };
        reader.readAsDataURL(file);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Callback after sending
      if (onMessageSent) {
        onMessageSent();
      }
      
      toast({
        description: 'File sent successfully',
      });
    } catch (error) {
      console.error('Error sending file:', error);
      toast({
        title: 'Error',
        description: 'Failed to send file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-2">
        {/* Attachment button */}
        <button 
          type="button" 
          className="p-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          onClick={handleAttach}
          disabled={isUploading}
        >
          {isUploading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </button>

        {/* Message form */}
        <form onSubmit={handleSubmit} className="flex-1 flex">
          <div className="flex items-center w-full bg-zinc-100 dark:bg-zinc-800 rounded-full">
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Message..." 
              className="bg-transparent flex-1 outline-none text-sm px-4 py-2 min-w-0"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isUploading}
            />
            
            <div className="flex items-center gap-1 pr-1">
              {/* Emoji button */}
              <button 
                type="button" 
                className="p-2 rounded-full text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              {/* Send button */}
              <button 
                type="submit" 
                className={`p-2 rounded-full ${message.trim() ? 'text-primary hover:bg-primary/10' : 'text-zinc-400'}`}
                disabled={!message.trim() || isUploading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </form>

        {/* Hidden file input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
          accept="image/*,video/*,application/pdf"
        />
      </div>

      {/* Connection status indicator */}
      <div className="mt-2 px-1 flex justify-center">
        <div className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
          recipientConnection 
            ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' 
            : 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${recipientConnection ? 'bg-green-500' : 'bg-zinc-400'}`}></span>
          <span className="text-[10px] uppercase tracking-wider font-medium">
            {recipientConnection ? 'P2P Connected' : 'Server Connection'}
          </span>
        </div>
      </div>
    </div>
  );
}
