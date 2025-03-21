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
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  
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
    
    // Reset media states when message changes
    setMediaLoaded(false);
    setMediaError(false);
  }, [message, isSender, recipientId]);

  // Handle media load events
  const handleMediaLoad = () => {
    setMediaLoaded(true);
    setMediaError(false);
  };

  const handleMediaError = () => {
    setMediaLoaded(true);
    setMediaError(true);
  };

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

  // Determine if the message bubble should have padding
  // Remove padding for media-only messages
  const isMediaOnly = (message.embedData?.type === 'gif' || message.embedData?.type === 'image') && !message.content;
  const showPadding = !isMediaOnly;

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
        } ${showPadding ? 'p-3' : 'overflow-hidden'} transition-all relative`}>
          {/* Message content */}
          {message.content && (
            <p className="text-sm break-words">{message.content}</p>
          )}
          
          {/* File attachment */}
          {message.embedData?.type === 'file' && (
            <div className={`${message.content ? 'mt-2' : ''} border rounded-lg overflow-hidden`}>
              {fileData && message.embedData.mimeType?.startsWith('image/') ? (
                <img 
                  src={fileData} 
                  alt="Shared file" 
                  className="max-w-full rounded-lg" 
                  onLoad={handleMediaLoad}
                  onError={handleMediaError}
                />
              ) : fileData && message.embedData.mimeType?.startsWith('video/') ? (
                <video 
                  src={fileData} 
                  controls 
                  className="max-w-full rounded-lg"
                  onLoadedData={handleMediaLoad}
                  onError={handleMediaError}
                ></video>
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
          
          {/* GIF */}
          {message.embedData?.type === 'gif' && (
            <div className={`${message.content ? 'mt-2' : ''} overflow-hidden ${isMediaOnly ? 'rounded-xl' : 'rounded-lg'}`}>
              {!mediaLoaded && (
                <div className="bg-zinc-100 dark:bg-zinc-700 animate-pulse h-40 w-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
              )}
              <img 
                src={message.embedData.url} 
                alt="GIF" 
                className={`max-w-full w-full ${mediaLoaded ? 'block' : 'hidden'}`}
                onLoad={handleMediaLoad}
                onError={handleMediaError}
              />
              {mediaError && (
                <div className="bg-zinc-100 dark:bg-zinc-700 p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  <svg className="w-6 h-6 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  Failed to load GIF
                </div>
              )}
            </div>
          )}
          
          {/* Image */}
          {message.embedData?.type === 'image' && (
            <div className={`${message.content ? 'mt-2' : ''} overflow-hidden ${isMediaOnly ? 'rounded-xl' : 'rounded-lg'}`}>
              {!mediaLoaded && (
                <div className="bg-zinc-100 dark:bg-zinc-700 animate-pulse h-40 w-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
              )}
              <img 
                src={message.embedData.url} 
                alt="Image" 
                className={`max-w-full w-full ${mediaLoaded ? 'block' : 'hidden'}`}
                onLoad={handleMediaLoad}
                onError={handleMediaError}
              />
              {mediaError && (
                <div className="bg-zinc-100 dark:bg-zinc-700 p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  <svg className="w-6 h-6 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  Failed to load image
                </div>
              )}
            </div>
          )}
          
          {/* Link embeds */}
          {links.map((link, index) => (
            <div className={`${message.content ? 'mt-2' : ''}`} key={index}>
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
                <span className="flex items-center" title="Read">
                  <svg className="w-3 h-3 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 7l-8.5 8.5-4-4L4 13l5.5 5.5L20 9l-2-2z" />
                  </svg>
                  <svg className="w-3 h-3 text-primary -ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 7l-8.5 8.5-4-4L4 13l5.5 5.5L20 9l-2-2z" />
                  </svg>
                </span>
              ) : message.deliveryStatus === 'delivered' ? (
                <span title="Delivered">
                  <svg className="w-3 h-3 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 7l-8.5 8.5-4-4L4 13l5.5 5.5L20 9l-2-2z" />
                  </svg>
                </span>
              ) : message.isRead ? (
                <span className="flex items-center" title="Read">
                  <svg className="w-3 h-3 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 7l-8.5 8.5-4-4L4 13l5.5 5.5L20 9l-2-2z" />
                  </svg>
                  <svg className="w-3 h-3 text-primary -ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 7l-8.5 8.5-4-4L4 13l5.5 5.5L20 9l-2-2z" />
                  </svg>
                </span>
              ) : (
                <span title="Sent">
                  <svg className="w-3 h-3 text-zinc-400 ml-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
