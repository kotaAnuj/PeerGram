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
      <div className="embedded-link animate-pulse">
        <div className="h-32 bg-gray-200 w-full"></div>
        <div className="p-2">
          <div className="h-4 bg-gray-200 w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 w-1/2"></div>
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
        className="text-primary underline break-all"
      >
        {url}
      </a>
    );
  }

  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="embedded-link block"
    >
      {metadata.image && (
        <div className="h-32 bg-gray-100 overflow-hidden">
          <img 
            src={metadata.image} 
            alt={metadata.title || 'Link preview'} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // If image fails to load, show a fallback
              (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;
            }}
          />
        </div>
      )}
      <div className="p-2">
        <h4 className="font-medium text-sm">{metadata.title || 'Website'}</h4>
        {metadata.description && (
          <p className="text-xs text-gray-500 truncate">{metadata.description}</p>
        )}
        {metadata.siteName && (
          <div className="text-xs text-gray-400 mt-1 flex items-center">
            <i className="fas fa-external-link-alt mr-1 text-[10px]"></i>
            {metadata.siteName}
          </div>
        )}
      </div>
    </a>
  );
}
