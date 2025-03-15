import { useState, useEffect } from 'react';

type LinkEmbedProps = {
  url: string;
};

type LinkMetadata = {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
};

export default function LinkEmbed({ url }: LinkEmbedProps) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // For a real application, you would use an API to fetch link metadata
        // For example: const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
        
        // For this demo, we'll create a simplified version
        // This would normally come from an API or backend that can parse Open Graph tags
        
        // Determine what kind of embed to show based on the URL
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          setMetadata({
            title: 'YouTube Video',
            description: 'A video from YouTube',
            image: 'https://i.imgur.com/IG5Umqt.jpg',
            siteName: 'YouTube'
          });
        } else if (url.includes('twitter.com')) {
          setMetadata({
            title: 'Twitter Post',
            description: 'A post from Twitter',
            image: 'https://i.imgur.com/RXDGhnU.jpg',
            siteName: 'Twitter'
          });
        } else if (url.includes('instagram.com')) {
          setMetadata({
            title: 'Instagram Post',
            description: 'A post from Instagram',
            image: 'https://i.imgur.com/7jdFmhY.jpg',
            siteName: 'Instagram'
          });
        } else {
          // Generic website
          const domain = new URL(url).hostname.replace('www.', '');
          setMetadata({
            title: domain,
            description: url,
            siteName: domain,
            image: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
          });
        }
      } catch (error) {
        console.error('Error fetching link metadata:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchMetadata();
    }
  }, [url]);

  if (loading) {
    return (
      <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 animate-pulse">
        <div className="h-32 bg-zinc-200 dark:bg-zinc-800 w-full"></div>
        <div className="p-3">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-600 dark:text-blue-400 hover:underline break-all text-sm flex items-center"
      >
        <svg className="w-4 h-4 mr-1 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        {url}
      </a>
    );
  }

  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors"
    >
      {metadata.image && (
        <div className="bg-zinc-100 dark:bg-zinc-800 overflow-hidden h-32">
          <img 
            src={metadata.image} 
            alt={metadata.title || 'Link preview'} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // If image fails to load, show a fallback
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-3">
        <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
          {metadata.title || 'Website'}
        </h4>
        {metadata.description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
            {metadata.description}
          </p>
        )}
        {metadata.siteName && (
          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 flex items-center">
            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {metadata.siteName}
          </div>
        )}
      </div>
    </a>
  );
}
