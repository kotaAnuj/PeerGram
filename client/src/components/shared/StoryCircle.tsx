import { Link } from 'wouter';

type StoryCircleProps = {
  userId: number;
  username: string;
  avatar?: string;
  hasUnseenStory?: boolean;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
};

export default function StoryCircle({ 
  userId, 
  username, 
  avatar, 
  hasUnseenStory = false,
  isActive = false,
  size = 'md',
  onClick
}: StoryCircleProps) {
  // Determine sizing
  const dimensions = {
    sm: {
      outer: 'w-14 h-14',
      inner: 'w-12 h-12'
    },
    md: {
      outer: 'w-16 h-16',
      inner: 'w-14 h-14'
    },
    lg: {
      outer: 'w-20 h-20',
      inner: 'w-18 h-18'
    }
  };

  const innerClasses = `story-avatar ${dimensions[size].inner}`;
  const outerClasses = `story-circle ${dimensions[size].outer} ${!hasUnseenStory && 'bg-gray-300'} ${isActive && 'ring-2 ring-primary ring-offset-2'}`;

  return (
    <div className="flex flex-col items-center">
      {onClick ? (
        <button 
          className={outerClasses}
          onClick={onClick}
          aria-label={`${username}'s story`}
        >
          <img 
            src={avatar || `https://ui-avatars.com/api/?name=${username}&background=random`} 
            alt={username} 
            className={innerClasses}
          />
        </button>
      ) : (
        <Link href={`/profile/${userId}`}>
          <a className={outerClasses}>
            <img 
              src={avatar || `https://ui-avatars.com/api/?name=${username}&background=random`} 
              alt={username} 
              className={innerClasses}
            />
          </a>
        </Link>
      )}
      <span className="text-xs mt-1 truncate max-w-[60px] text-center">{username}</span>
    </div>
  );
}
