import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function MobileNavbar() {
  const [location] = useLocation();
  const { user } = useAuth();

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
      
      <Link href={`/profile/${user?.id}`}>
        <a className={`flex flex-col items-center justify-center flex-1 ${location === `/profile/${user?.id}` ? 'text-primary' : ''}`}>
          <img 
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.displayName}&background=random`} 
            className="w-6 h-6 rounded-full" 
            alt="Profile" 
          />
        </a>
      </Link>
    </nav>
  );
}
