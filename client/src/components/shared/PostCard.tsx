import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useP2P } from '@/hooks/useP2P';
import { formatDate } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import LinkEmbed from '@/components/chat/LinkEmbed';
import { detectLinks } from '@/lib/utils';

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

type PostCardProps = {
  post: Post;
  onRefresh?: () => void;
};

export default function PostCard({ post, onRefresh }: PostCardProps) {
  const { user } = useAuth();
  const { sendToPeer } = useP2P();
  const { toast } = useToast();
  const [likes, setLikes] = useState<number>(0);
  const [comments, setComments] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [postUser, setPostUser] = useState<User | null>(null);
  const [links, setLinks] = useState<string[]>([]);

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

    // Fetch comments count
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/posts/${post.id}/comments`);
        if (res.ok) {
          const commentsData = await res.json();
          setComments(commentsData.length);
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

  return (
    <div className="bg-white border border-border rounded-md mb-4 overflow-hidden">
      {/* Post header */}
      <div className="p-3 border-b border-border flex items-center">
        <Link href={`/profile/${postUser?.id || post.userId}`}>
          <a className="flex items-center">
            <img
              src={postUser?.avatar || `https://ui-avatars.com/api/?name=${postUser?.displayName || 'User'}&background=random`}
              alt={postUser?.displayName || 'User'}
              className="w-8 h-8 rounded-full mr-2 object-cover"
            />
            <span className="text-sm font-semibold">{postUser?.username || 'user'}</span>
          </a>
        </Link>
        <div className="ml-auto text-gray-500">
          <button className="p-1">
            <i className="fas fa-ellipsis-h"></i>
          </button>
        </div>
      </div>

      {/* Post media */}
      {post.mediaUrl && (
        <div className="bg-gray-100">
          {post.mediaType?.startsWith('image') ? (
            <img
              src={post.mediaUrl}
              alt="Post"
              className="w-full max-h-96 object-contain"
            />
          ) : post.mediaType?.startsWith('video') ? (
            <video
              src={post.mediaUrl}
              controls
              className="w-full max-h-96"
            ></video>
          ) : null}
        </div>
      )}

      {/* Post actions */}
      <div className="p-3">
        <div className="flex space-x-4 mb-2">
          <button onClick={handleLike} className="focus:outline-none">
            <i className={`${isLiked ? 'fas text-red-500' : 'far'} fa-heart`}></i>
          </button>
          <button onClick={() => setShowComments(!showComments)} className="focus:outline-none">
            <i className="far fa-comment"></i>
          </button>
          <button onClick={handleShare} className="focus:outline-none">
            <i className="far fa-paper-plane"></i>
          </button>
        </div>

        {/* Likes count */}
        <p className="text-sm font-semibold mb-1">{likes} likes</p>

        {/* Post content */}
        {post.content && (
          <p className="text-sm mb-1">
            <Link href={`/profile/${postUser?.id || post.userId}`}>
              <a className="font-semibold">{postUser?.username || 'user'}</a>
            </Link>{' '}
            {post.content}
          </p>
        )}

        {/* Embedded links */}
        {links.map((link, index) => (
          <LinkEmbed key={index} url={link} />
        ))}

        {/* Comments count */}
        {comments > 0 && (
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-sm text-gray-500 mt-1 focus:outline-none"
          >
            View all {comments} comments
          </button>
        )}

        {/* Post timestamp */}
        <p className="text-xs text-gray-400 mt-1">{formatDate(post.createdAt)}</p>
      </div>
    </div>
  );
}
