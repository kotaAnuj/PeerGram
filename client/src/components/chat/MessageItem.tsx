import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { formatMessageTime } from '@/lib/utils';
import { detectLinks } from '@/lib/utils';
import LinkEmbed from './LinkEmbed';
import { localDB } from '@/lib/storage';

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  embedData?: any;
  isRead: boolean;
  deliveryStatus?: string;
  createdAt: Date;
};

type MessageItemProps = {
  message: Message;
  isSender: boolean;
  recipientId: number;
};

export default function MessageItem({ message, isSender, recipientId }: MessageItemProps) {
  const { user } = useAuth();
  const [senderInfo, setSenderInfo] = useState<any>(null);
  const [links, setLinks] = useState<string[]>([]);
  const [fileData, setFileData] = useState<any>(null);
  
  useEffect(() => {
    // Detect links in message content
    if (message.content) {
      setLinks(detectLinks(message.content));
    }
    
    // Fetch sender info if not the current user
    const fetchSenderInfo = async () => {
      if (!isSender) {
        try {
          const response = await fetch(`/api/users/${message.senderId}`);
          if (response.ok) {
            const data = await response.json();
            setSenderInfo(data);
          }
        } catch (error) {
          console.error('Error fetching sender info:', error);
        }
      }
    };
    
    // If message has file embed, try to retrieve from local storage
    const fetchFileData = async () => {
      if (message.embedData?.type === 'file') {
        try {
          const fileItems = await localDB.getItemsByType('message');
          const fileItem = fileItems.find(item => item.hash === `file_${message.id}`);
          if (fileItem) {
            setFileData(fileItem.data.fileData);
          }
        } catch (error) {
          console.error('Error retrieving file data:', error);
        }
      }
    };
    
    fetchSenderInfo();
    fetchFileData();
  }, [message, isSender, recipientId]);

  // Display a skeleton while loading sender info
  if (!isSender && !senderInfo) {
    return (
      <div className="flex mb-4">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse mr-2 self-end"></div>
        <div className="max-w-[70%]">
          <div className="bg-gray-100 rounded-2xl rounded-bl-none p-3">
            <div className="h-4 bg-gray-200 animate-pulse w-24 mb-1"></div>
            <div className="h-4 bg-gray-200 animate-pulse w-32"></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isSender ? 'justify-end' : 'mb-4'}`}>
      {!isSender && (
        <img 
          src={senderInfo?.avatar || `https://ui-avatars.com/api/?name=${senderInfo?.displayName || 'User'}&background=random`} 
          alt={senderInfo?.displayName || 'User'} 
          className="w-8 h-8 rounded-full mr-2 self-end"
        />
      )}
      
      <div className={`max-w-[70%] ${isSender ? 'text-right' : ''}`}>
        <div className={`${
          isSender 
            ? 'bg-primary text-white rounded-2xl rounded-br-none' 
            : 'bg-gray-100 rounded-2xl rounded-bl-none'
        } p-3`}>
          {/* Message content */}
          <p className="text-sm">{message.content}</p>
          
          {/* File attachment */}
          {message.embedData?.type === 'file' && (
            <div className="mt-2 border rounded overflow-hidden">
              {fileData && message.embedData.mimeType?.startsWith('image/') ? (
                <img src={fileData} alt="Shared file" className="max-w-full" />
              ) : fileData && message.embedData.mimeType?.startsWith('video/') ? (
                <video src={fileData} controls className="max-w-full"></video>
              ) : (
                <div className="p-2 bg-gray-50 flex items-center">
                  <i className="fas fa-file mr-2"></i>
                  <div>
                    <div className="text-xs font-medium">{message.embedData.name}</div>
                    <div className="text-xs text-gray-500">
                      {Math.round(message.embedData.size / 1024)} KB
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Link embeds */}
          {links.map((link, index) => (
            <div className="mt-2" key={index}>
              <LinkEmbed url={link} />
            </div>
          ))}
        </div>
        
        {/* Timestamp and delivery status */}
        <div className="text-xs text-gray-500 mt-1">
          {formatMessageTime(message.createdAt)}
          {isSender && (
            <>
              <span className="ml-1">•</span>
              <span className={message.deliveryStatus === 'read' ? 'text-primary' : 'text-success'}>
                {' '}
                {message.deliveryStatus === 'read' ? 'Read' : 'Delivered'}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
