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
      <div className="flex animate-pulse space-x-2 my-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
        <div className="flex-1 max-w-[70%]">
          <div className="bg-gray-100 rounded-xl p-3">
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-2 w-12 bg-gray-100 rounded mt-1 ml-1"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isSender ? 'justify-end' : ''} my-2 group`}>
      {!isSender && (
        <img 
          src={senderInfo?.avatar || `https://ui-avatars.com/api/?name=${senderInfo?.displayName || 'User'}&background=random`} 
          alt={senderInfo?.displayName || 'User'} 
          className="w-8 h-8 rounded-full mr-2 self-end flex-shrink-0"
        />
      )}
      
      <div className={`max-w-[70%] ${isSender ? 'text-right' : ''}`}>
        <div className={`${
          isSender 
            ? 'bg-primary text-white rounded-xl rounded-br-none shadow-sm' 
            : 'bg-white dark:bg-zinc-800 shadow-sm rounded-xl rounded-bl-none'
        } p-3 transition-all relative`}>
          {/* Message content */}
          <p className="text-sm break-words">{message.content}</p>
          
          {/* File attachment */}
          {message.embedData?.type === 'file' && (
            <div className="mt-2 border rounded-lg overflow-hidden">
              {fileData && message.embedData.mimeType?.startsWith('image/') ? (
                <img src={fileData} alt="Shared file" className="max-w-full rounded-lg" />
              ) : fileData && message.embedData.mimeType?.startsWith('video/') ? (
                <video src={fileData} controls className="max-w-full rounded-lg"></video>
              ) : (
                <div className="p-3 flex items-center dark:bg-zinc-700/50 bg-zinc-50">
                  <div className="bg-primary/10 rounded-full p-2 mr-3 text-primary">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium">{message.embedData.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
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

          {/* Reaction button (visible on hover) */}
          <button className="absolute -right-2 -bottom-2 bg-white text-zinc-400 hover:text-zinc-600 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hidden">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        
        {/* Timestamp and delivery status */}
        <div className="text-xs text-zinc-400 mt-1 ml-1 flex items-center">
          {formatMessageTime(message.createdAt)}
          {isSender && (
            <span className="ml-1 flex items-center">
              {message.deliveryStatus === 'read' ? (
                <svg className="w-3 h-3 text-primary ml-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-zinc-400 ml-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
