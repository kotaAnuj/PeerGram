import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar } from '@/components/ui/avatar';

// Emoji data
const EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘'] },
  { name: 'Gestures', emojis: ['👍', '👎', '👌', '🤌', '👋', '🤝', '🙏', '✌️', '🤟', '🤘', '👊', '✊', '👏', '🙌', '👐', '🤲'] },
  { name: 'People', emojis: ['👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👵', '🧓', '👴', '👳', '👲', '👸', '🤴', '🦸', '🦹'] },
  { name: 'Animals', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'] },
  { name: 'Food', emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝'] },
  { name: 'Objects', emojis: ['⌚️', '📱', '💻', '⌨️', '🖥', '🖨', '🖱', '💽', '💾', '💿', '📀', '📷', '📸', '📹', '🎥', '📞'] }
];

// Sample GIF categories
const GIF_CATEGORIES = [
  { name: 'Trending', id: 'trending' },
  { name: 'Reactions', id: 'reactions' },
  { name: 'Emotions', id: 'emotions' },
  { name: 'Memes', id: 'memes' },
  { name: 'TV', id: 'tv' }
];

// Sample image categories
const IMAGE_CATEGORIES = [
  { name: 'Nature', id: 'nature' },
  { name: 'Animals', id: 'animals' },
  { name: 'Travel', id: 'travel' },
  { name: 'Food', id: 'food' },
  { name: 'Abstract', id: 'abstract' }
];

// Placeholder data for GIFs and images
const PLACEHOLDER_GIFS = [
  { id: 1, url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMnJ2MHZjNjBobzUzcmRhbXo3eTJ3MjM5cDUyZGk1dTlkMXR5djZhZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Cmr1OMJ2FN0B2/giphy.gif', alt: 'Typing cat' },
  { id: 2, url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOGo2MWw1a2N1dHB3MmdrOWx2Z2k3MnhvcGxxanF4aWw1ZXNwMW40MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/10LKovKon8DENq/giphy.gif', alt: 'Thumbs up' },
  { id: 3, url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDVqaHB0eTZnY3NzYmhsajVtaTB0OXVhOWpsZHM4c3AyYnYyOTF5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/8JW82ndaYfmNoYAekM/giphy-downsized-large.gif', alt: 'Shocked' },
  { id: 4, url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdzU3MmdtenhlbWF1c3E3MzV5enpjejdkdGI2eWNpb2pjdW43Y3pkZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26FPOogenQv5eOZHO/giphy.gif', alt: 'Laughing' }
];

const PLACEHOLDER_IMAGES = [
  { id: 1, url: 'https://source.unsplash.com/random/300x200?nature', alt: 'Nature image 1' },
  { id: 2, url: 'https://source.unsplash.com/random/300x200?mountain', alt: 'Mountain image' },
  { id: 3, url: 'https://source.unsplash.com/random/300x200?ocean', alt: 'Ocean image' },
  { id: 4, url: 'https://source.unsplash.com/random/300x200?forest', alt: 'Forest image' }
];

interface MediaSearchProps {
  onSelect: (content: string, type: 'emoji' | 'gif' | 'image') => void;
}

export default function MediaSearch({ onSelect }: MediaSearchProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('emoji');
  const [emojiCategory, setEmojiCategory] = useState('Smileys');
  const [gifCategory, setGifCategory] = useState('trending');
  const [imageCategory, setImageCategory] = useState('nature');
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState(PLACEHOLDER_GIFS);
  const [images, setImages] = useState(PLACEHOLDER_IMAGES);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset search when tab changes
  useEffect(() => {
    setSearchQuery('');
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeTab, open]);

  // Mock search function - in a real app, this would call an API
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate API call
    setTimeout(() => {
      if (activeTab === 'gif') {
        // In a real app, this would fetch from Giphy or similar
        setGifs(PLACEHOLDER_GIFS);
      } else if (activeTab === 'image') {
        // In a real app, this would fetch from Unsplash or similar
        setImages(PLACEHOLDER_IMAGES);
      }
      setIsSearching(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    onSelect(emoji, 'emoji');
    setOpen(false);
  };

  const handleSelectGif = (gif: { url: string, alt: string }) => {
    onSelect(gif.url, 'gif');
    setOpen(false);
  };

  const handleSelectImage = (image: { url: string, alt: string }) => {
    onSelect(image.url, 'image');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-full text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 p-2"
        >
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
          <span className="sr-only">Open media search</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={5}>
        <Tabs defaultValue="emoji" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="emoji" className="text-xs">Emoji</TabsTrigger>
              <TabsTrigger value="gif" className="text-xs">GIF</TabsTrigger>
              <TabsTrigger value="image" className="text-xs">Image</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Search box - shown for all tabs except emoji */}
          {activeTab !== 'emoji' && (
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <Input
                  ref={searchInputRef}
                  className="pr-10 text-sm h-8 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  placeholder={`Search ${activeTab}s...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 absolute right-1 top-0.5"
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* Emoji tab */}
          <TabsContent value="emoji" className="focus-visible:outline-none">
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto py-1 px-2 scrollbar-thin">
              {EMOJI_CATEGORIES.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setEmojiCategory(category.name)}
                  className={`px-3 py-1 text-xs rounded-full whitespace-nowrap mx-1 ${
                    emojiCategory === category.name 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <div className="h-[320px] overflow-y-auto p-3">
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_CATEGORIES.find(c => c.name === emojiCategory)?.emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectEmoji(emoji)}
                    className="text-xl p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* GIF tab */}
          <TabsContent value="gif" className="focus-visible:outline-none">
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto py-1 px-2 scrollbar-thin">
              {GIF_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setGifCategory(category.id)}
                  className={`px-3 py-1 text-xs rounded-full whitespace-nowrap mx-1 ${
                    gifCategory === category.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <div className="h-[320px] overflow-y-auto p-3">
              <div className="grid grid-cols-2 gap-2">
                {isSearching ? (
                  <div className="col-span-2 h-full flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-primary/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : gifs.length === 0 ? (
                  <div className="col-span-2 h-full flex items-center justify-center text-center p-4">
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">No GIFs found</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Try a different search term</p>
                    </div>
                  </div>
                ) : (
                  gifs.map((gif) => (
                    <button
                      key={gif.id}
                      onClick={() => handleSelectGif(gif)}
                      className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-800 hover:border-primary/30 transition-colors"
                    >
                      <img 
                        src={gif.url} 
                        alt={gif.alt} 
                        className="w-full h-24 object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Image tab */}
          <TabsContent value="image" className="focus-visible:outline-none">
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto py-1 px-2 scrollbar-thin">
              {IMAGE_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setImageCategory(category.id)}
                  className={`px-3 py-1 text-xs rounded-full whitespace-nowrap mx-1 ${
                    imageCategory === category.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <div className="h-[320px] overflow-y-auto p-3">
              <div className="grid grid-cols-2 gap-2">
                {isSearching ? (
                  <div className="col-span-2 h-full flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-primary/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : images.length === 0 ? (
                  <div className="col-span-2 h-full flex items-center justify-center text-center p-4">
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">No images found</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Try a different search term</p>
                    </div>
                  </div>
                ) : (
                  images.map((image) => (
                    <button
                      key={image.id}
                      onClick={() => handleSelectImage(image)}
                      className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-800 hover:border-primary/30 transition-colors"
                    >
                      <img 
                        src={image.url} 
                        alt={image.alt} 
                        className="w-full h-24 object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-500 text-center">
          Search for emoji, GIFs and images to share
        </div>
      </PopoverContent>
    </Popover>
  );
}