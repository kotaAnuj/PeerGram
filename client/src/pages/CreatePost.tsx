import { useState, useRef, ChangeEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useP2P } from '@/hooks/useP2P';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { resizeImage, generateHash } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreatePost() {
  const { user } = useAuth();
  const { storeContent, broadcast } = useP2P();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type and size
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image or video file',
        variant: 'destructive',
      });
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: 'File too large',
        description: 'Please select a file smaller than 50MB',
        variant: 'destructive',
      });
      return;
    }
    
    setMedia(file);
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setMediaPreview(objectUrl);
  };

  const handleRemoveMedia = () => {
    setMedia(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    if (!content.trim() && !media) {
      toast({
        title: 'Empty post',
        description: 'Please add text or media to your post',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let mediaUrl = '';
      let mediaType = '';
      let contentHash = '';
      
      // Handle media if present
      if (media) {
        try {
          // Create content hash based on file content + timestamp
          contentHash = generateHash(media.name + media.size + Date.now());
          
          // For images, resize before storing
          if (media.type.startsWith('image/')) {
            const resizedImage = await resizeImage(media);
            // Convert to data URL for P2P sharing
            const reader = new FileReader();
            reader.readAsDataURL(resizedImage);
            await new Promise<void>((resolve) => {
              reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                  mediaUrl = reader.result;
                  mediaType = media.type;
                }
                resolve();
              };
            });
          } else {
            // For videos, just convert to data URL
            const reader = new FileReader();
            reader.readAsDataURL(media);
            await new Promise<void>((resolve) => {
              reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                  mediaUrl = reader.result;
                  mediaType = media.type;
                }
                resolve();
              };
            });
          }
        } catch (error) {
          console.error('Error processing media:', error);
          toast({
            title: 'Media error',
            description: 'Failed to process media file',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Create post via API
      const response = await apiRequest('POST', '/api/posts', {
        userId: user.id,
        content: content.trim() || undefined,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || undefined,
        contentHash: contentHash || undefined,
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      const postData = await response.json();
      
      // Store content in P2P network
      if (storeContent) {
        await storeContent('post', {
          id: postData.id,
          userId: user.id,
          content: content.trim() || undefined,
          mediaUrl: mediaUrl || undefined,
          mediaType: mediaType || undefined,
          contentHash: contentHash || undefined,
          createdAt: new Date(),
        });
      }
      
      // Broadcast to connected peers
      if (broadcast) {
        broadcast({
          type: 'NEW_POST',
          postId: postData.id,
          userId: user.id,
          timestamp: new Date()
        });
      }
      
      // Success message
      toast({
        title: 'Post created',
        description: 'Your post has been shared with your network',
      });
      
      // Redirect to home
      setLocation('/');
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto md:my-4 pb-16">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Create Post</CardTitle>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="flex items-center mb-4">
              <img 
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}&background=random`} 
                alt={user?.displayName || 'User'} 
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <p className="font-semibold text-sm">{user?.displayName}</p>
                <p className="text-xs text-gray-500">
                  <i className="fas fa-globe-americas mr-1"></i>
                  P2P Network
                </p>
              </div>
            </div>
            
            <Textarea
              placeholder="What's on your mind?"
              className="min-h-[120px] resize-none mb-3"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
            />
            
            {mediaPreview && (
              <div className="relative mb-3 border rounded overflow-hidden">
                {media?.type.startsWith('image/') ? (
                  <img 
                    src={mediaPreview} 
                    alt="Media preview" 
                    className="max-h-96 w-full object-contain bg-gray-100"
                  />
                ) : media?.type.startsWith('video/') ? (
                  <video 
                    src={mediaPreview} 
                    controls 
                    className="max-h-96 w-full" 
                  />
                ) : null}
                
                <button 
                  type="button"
                  className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full p-1"
                  onClick={handleRemoveMedia}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,video/*"
              onChange={handleMediaSelect}
              disabled={isSubmitting}
            />
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <div>
              <button 
                type="button"
                className="p-2 text-primary mr-2 hover:bg-gray-100 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
              >
                <i className="fas fa-image"></i>
              </button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || (!content.trim() && !media)}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="mt-4 px-4 text-center text-xs text-gray-500">
        <p>Your content will be shared via P2P network</p>
        <p>Your connections will receive your post directly</p>
      </div>
    </div>
  );
}
