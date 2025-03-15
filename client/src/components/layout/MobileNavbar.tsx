import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

export default function MobileNavbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <nav className="navbar-mobile py-2">
      <Link href="/">
        <a className={`flex flex-col items-center justify-center flex-1 ${location === '/' ? 'text-primary' : ''}`}>
          <i className="fas fa-home"></i>
        </a>
      </Link>
      
      <Link href="/search">
        <a className={`flex flex-col items-center justify-center flex-1 ${location === '/search' ? 'text-primary' : ''}`}>
          <i className="fas fa-search"></i>
        </a>
      </Link>
      
      <Link href="/create">
        <a className={`flex flex-col items-center justify-center flex-1 ${location === '/create' ? 'text-primary' : ''}`}>
          <i className="fas fa-plus-square"></i>
        </a>
      </Link>
      
      <Link href="/messages">
        <a className={`flex flex-col items-center justify-center flex-1 ${location === '/messages' || location.startsWith('/chat') ? 'text-primary' : ''}`}>
          <i className="fas fa-paper-plane"></i>
        </a>
      </Link>
      
      <Popover>
        <PopoverTrigger className="flex-1 bg-transparent border-0">
          <div className={`flex flex-col items-center justify-center ${location === `/profile/${user?.id}` ? 'text-primary' : ''}`}>
            <img 
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.displayName}&background=random`} 
              className="w-6 h-6 rounded-full" 
              alt="Profile" 
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0">
          <div className="py-2">
            <div className="px-3 py-2">
              <div className="font-medium">{user?.displayName}</div>
              <div className="text-xs text-muted-foreground">@{user?.username}</div>
            </div>
            
            <Separator className="my-1" />
            
            <div className="grid gap-1 p-1">
              <Link href={`/profile/${user?.id}`}>
                <a className="flex items-center p-2 hover:bg-muted rounded-md">
                  <i className="fas fa-user mr-2"></i>
                  <span>My Profile</span>
                </a>
              </Link>
              <Link href="/explore">
                <a className="flex items-center p-2 hover:bg-muted rounded-md">
                  <i className="fas fa-compass mr-2"></i>
                  <span>Explore</span>
                </a>
              </Link>
              <Link href="/network">
                <a className="flex items-center p-2 hover:bg-muted rounded-md">
                  <i className="fas fa-network-wired mr-2"></i>
                  <span>My Network</span>
                </a>
              </Link>
              <Link href="/founder">
                <a className="flex items-center p-2 hover:bg-muted rounded-md">
                  <i className="fas fa-info-circle mr-2"></i>
                  <span>About Founder</span>
                </a>
              </Link>
              
              <Separator className="my-1" />
              
              <button 
                onClick={logout}
                className="flex items-center p-2 hover:bg-red-50 text-red-600 rounded-md w-full text-left"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </nav>
  );
}
