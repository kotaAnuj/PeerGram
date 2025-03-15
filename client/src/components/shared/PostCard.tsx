import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useP2P } from '@/hooks/useP2P';
import { formatDate } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import LinkEmbed from '@/components/chat/LinkEmbed';
import { detectLinks } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { AvatarImage, AvatarFallback } from '@/components/ui/avatar';

type User = {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
};

type Post = {
  id: number;
  userId: number;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  contentHash?: string;
  createdAt: Date;
  user?: User;
};

type Comment = {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: Date;
  user?: User;
};

type PostCardProps = {
  post: Post;
  onRefresh?: () => void;
};

export default function PostCard({ post, onRefresh }: PostCardProps) {
  const { user } = useAuth();
  const { sendToPeer } = useP2P();
  const { toast } = useToast();
  const [likes, setLikes] = useState<number>(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [postUser, setPostUser] = useState<User | null>(null);
  const [links, setLinks] = useState<string[]>([]);
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Fetch user data if not available
    const fetchPostUser = async () => {
      if (post.user) {
        setPostUser(post.user);
      } else {
        try {
          const res = await fetch(`/api/users/${post.userId}`);
          if (res.ok) {
            const userData = await res.json();
            setPostUser(userData);
          }
        } catch (error) {
          console.error('Error fetching post user:', error);
        }
      }
    };

    // Fetch likes count
    const fetchLikes = async () => {
      try {
        const res = await fetch(`/api/posts/${post.id}/likes`);
        if (res.ok) {
          const likesData = await res.json();
          setLikes(likesData.length);
          setIsLiked(likesData.some((like: any) => like.userId === user?.id));
        }
      } catch (error) {
        console.error('Error fetching likes:', error);
      }
    };

    // Fetch comments
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/posts/${post.id}/comments`);
        if (res.ok) {
          const commentsData = await res.json();
          // Add user data to each comment
          const commentsWithUsers = await Promise.all(
            commentsData.map(async (comment: Comment) => {
              try {
                const userRes = await fetch(`/api/users/${comment.userId}`);
                if (userRes.ok) {
                  const userData = await userRes.json();
                  return { ...comment, user: userData };
                }
              } catch (error) {
                console.error('Error fetching comment user:', error);
              }
              return comment;
            })
          );
          setComments(commentsWithUsers);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    // Extract links from content
    if (post.content) {
      setLinks(detectLinks(post.content));
    }

    fetchPostUser();
    fetchLikes();
    fetchComments();
  }, [post, user?.id]);

  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        await apiRequest('DELETE', `/api/posts/${post.id}/likes/${user.id}`, undefined);
        setLikes((prev) => prev - 1);
        setIsLiked(false);
      } else {
        await apiRequest('POST', '/api/likes', {
          postId: post.id,
          userId: user.id
        });
        setLikes((prev) => prev + 1);
        setIsLiked(true);
      }

      // Broadcast like change to peers
      // This would be implemented in a real P2P system
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like status',
        variant: 'destructive',
      });
    }
  };

  const handleShare = () => {
    // Copy post link to clipboard
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast({
      description: 'Post link copied to clipboard',
    });
  };

  const handleAddComment = async () => {
    if (!user || !commentText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await apiRequest('POST', '/api/comments', {
        postId: post.id,
        userId: user.id,
        content: commentText.trim()
      });

      if (res.ok) {
        const newComment = await res.json();
        // Add user information
        const commentWithUser = {
          ...newComment,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar
          }
        };
        
        setComments((prev) => [...prev, commentWithUser]);
        setCommentText('');
        
        // Show comments if they were hidden
        if (!showComments) {
          setShowComments(true);
        }
        
        // Refresh the parent component if needed
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg mb-4 overflow-hidden shadow-sm">
      {/* Post header */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center">
        <Link href={`/profile/${postUser?.id || post.userId}`}>
          <a className="flex items-center">
            <img
              src={postUser?.avatar || `https://ui-avatars.com/api/?name=${postUser?.displayName || 'User'}&background=random`}
              alt={postUser?.displayName || 'User'}
              className="w-8 h-8 rounded-full mr-2 object-cover"
            />
            <div>
              <span className="text-sm font-semibold dark:text-zinc-100">{postUser?.username || 'user'}</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(post.createdAt)}</p>
            </div>
          </a>
        </Link>
        <div className="ml-auto text-zinc-500">
          <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Post media */}
      {post.mediaUrl && (
        <div className="bg-zinc-100 dark:bg-zinc-800">
          {post.mediaType?.startsWith('image') ? (
            <img
              src={post.mediaUrl}
              alt="Post"
              className="w-full max-h-[500px] object-contain"
            />
          ) : post.mediaType?.startsWith('video') ? (
            <video
              src={post.mediaUrl}
              controls
              className="w-full max-h-[500px]"
            ></video>
          ) : null}
        </div>
      )}

      {/* Post content */}
      <div className="p-4">
        {post.content && (
          <p className="text-sm mb-3 dark:text-zinc-200">
            <Link href={`/profile/${postUser?.id || post.userId}`}>
              <a className="font-semibold">{postUser?.displayName || 'User'}</a>
            </Link>{' '}
            {post.content}
          </p>
        )}

        {/* Embedded links */}
        {links.length > 0 && (
          <div className="mb-3">
            {links.map((link, index) => (
              <LinkEmbed key={index} url={link} />
            ))}
          </div>
        )}
      </div>

      {/* Post actions */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between mb-2 border-t border-zinc-200 dark:border-zinc-800 pt-2">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLike} 
              className="flex items-center space-x-1 text-zinc-700 dark:text-zinc-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <svg className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs font-medium">{likes}</span>
            </button>
            
            <button 
              onClick={() => setShowComments(!showComments)} 
              className="flex items-center space-x-1 text-zinc-700 dark:text-zinc-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs font-medium">{comments.length}</span>
            </button>
            
            <button 
              onClick={handleShare} 
              className="flex items-center space-x-1 text-zinc-700 dark:text-zinc-300 hover:text-green-500 dark:hover:text-green-400 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <h4 className="text-sm font-medium mb-2 dark:text-zinc-200">Comments</h4>
            
            <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
              {comments.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-2">
                    <Avatar className="w-7 h-7">
                      <AvatarImage 
                        src={comment.user?.avatar || `https://ui-avatars.com/api/?name=${comment.user?.displayName || 'User'}&background=random`} 
                        alt={comment.user?.displayName || 'User'} 
                      />
                      <AvatarFallback>{comment.user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2">
                        <p className="text-xs font-medium dark:text-zinc-200">
                          {comment.user?.username || 'user'}
                        </p>
                        <p className="text-sm dark:text-zinc-300">{comment.content}</p>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 ml-1">{formatDate(comment.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Add comment form */}
            {user && (
              <div className="flex items-start space-x-2 mt-3">
                <Avatar className="w-7 h-7">
                  <AvatarImage 
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`} 
                    alt={user.displayName || 'User'} 
                  />
                  <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">
                  <Textarea
                    ref={commentInputRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={handleCommentKeyDown}
                    placeholder="Add a comment..."
                    className="min-h-0 h-10 py-2 resize-none bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                  <button 
                    className={`absolute right-2 top-2 text-blue-500 dark:text-blue-400 text-sm font-medium ${!commentText.trim() || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-600'}`}
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || isSubmitting}
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
