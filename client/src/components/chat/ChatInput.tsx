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

  return (
    <div className="border-t border-border p-3">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <button type="button" className="mr-2 text-gray-500">
            <i className="far fa-smile"></i>
          </button>
          <input 
            type="text" 
            placeholder="Message..." 
            className="bg-transparent flex-1 outline-none text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isUploading}
          />
          <button 
            type="submit" 
            className="ml-2 text-primary font-semibold text-sm"
            disabled={!message.trim() || isUploading}
          >
            Send
          </button>
        </div>
      </form>
      
      <div className="flex justify-between mt-2 px-1 text-xs text-gray-500">
        <span className="flex items-center">
          <i className={`fas fa-circle text-${recipientConnection ? 'success' : 'gray-400'} mr-1 text-[8px]`}></i>
          {recipientConnection ? 'P2P Direct Connection' : 'Server Connection'}
        </span>
        <button 
          className="flex items-center"
          onClick={handleAttach}
          disabled={isUploading}
        >
          {isUploading ? (
            <><i className="fas fa-spinner fa-spin mr-1"></i> Uploading...</>
          ) : (
            <><i className="fas fa-paperclip mr-1"></i> Attach</>
          )}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
          accept="image/*,video/*"
        />
      </div>
    </div>
  );
}
