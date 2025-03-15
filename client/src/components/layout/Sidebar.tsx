import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useP2P } from "@/hooks/useP2P";
import NetworkVisualizer from "@/components/shared/NetworkVisualizer";

type SidebarProps = {
  onShowFriendRequests: () => void;
};

export default function Sidebar({ onShowFriendRequests }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { networkStats } = useP2P();

  return (
    <aside className="hidden md:flex md:flex-col w-64 fixed h-full border-r border-border bg-white p-4">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold">PeerGram</h1>
        <div className="text-xs text-gray-500 flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-success mr-1"></span>
          Connected to {networkStats.totalPeers} peers
        </div>
      </div>
      
      <nav className="flex-1 space-y-1">
        <Link href="/">
          <a className={`flex items-center p-3 rounded-md text-sm font-medium ${location === '/' ? 'text-primary bg-blue-50' : 'hover:bg-lightgray'}`}>
            <i className="fas fa-home w-6"></i>
            <span>Home</span>
          </a>
        </Link>
        
        <Link href="/search">
          <a className={`flex items-center p-3 rounded-md text-sm font-medium ${location === '/search' ? 'text-primary bg-blue-50' : 'hover:bg-lightgray'}`}>
            <i className="fas fa-search w-6"></i>
            <span>Search</span>
          </a>
        </Link>
        
        <Link href="/explore">
          <a className={`flex items-center p-3 rounded-md text-sm font-medium ${location === '/explore' ? 'text-primary bg-blue-50' : 'hover:bg-lightgray'}`}>
            <i className="fas fa-compass w-6"></i>
            <span>Explore</span>
          </a>
        </Link>
        
        <Link href="/messages">
          <a className={`flex items-center p-3 rounded-md text-sm font-medium ${location === '/messages' || location.startsWith('/chat') ? 'text-primary bg-blue-50' : 'hover:bg-lightgray'}`}>
            <i className="fas fa-paper-plane w-6"></i>
            <span>Messages</span>
            {/* Notification badge would go here when there are unread messages */}
          </a>
        </Link>
        
        <button 
          onClick={onShowFriendRequests}
          className="flex items-center p-3 rounded-md text-sm font-medium w-full text-left hover:bg-lightgray"
        >
          <i className="fas fa-heart w-6"></i>
          <span>Notifications</span>
        </button>
        
        <Link href="/create">
          <a className={`flex items-center p-3 rounded-md text-sm font-medium ${location === '/create' ? 'text-primary bg-blue-50' : 'hover:bg-lightgray'}`}>
            <i className="fas fa-plus-square w-6"></i>
            <span>Create</span>
          </a>
        </Link>
        
        <Link href="/network">
          <a className={`flex items-center p-3 rounded-md text-sm font-medium ${location === '/network' ? 'text-primary bg-blue-50' : 'hover:bg-lightgray'}`}>
            <i className="fas fa-network-wired w-6"></i>
            <span>My Network</span>
          </a>
        </Link>
      </nav>
      
      <div className="border-t border-border pt-4">
        <div className="p-2">
          <h3 className="font-semibold text-sm mb-2">P2P Status</h3>
          <NetworkVisualizer />
          <div className="flex justify-between text-xs mb-2">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-success rounded-full mr-1"></span>
              <span>Strong: {networkStats.strongConnections}</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
              <span>Medium: {networkStats.mediumConnections}</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-danger rounded-full mr-1"></span>
              <span>Weak: {networkStats.weakConnections}</span>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            <div className="flex justify-between mb-1">
              <span>Data Shared:</span>
              <span>{networkStats.dataShared.toFixed(1)} MB</span>
            </div>
            <div className="flex justify-between">
              <span>Data Received:</span>
              <span>{networkStats.dataReceived.toFixed(1)} MB</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-border">
        <Link href={`/profile/${user?.id}`}>
          <a className="flex items-center p-2 hover:bg-lightgray rounded-md">
            <img 
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.displayName}&background=random`} 
              className="w-8 h-8 rounded-full mr-2" 
              alt="Profile picture" 
            />
            <div>
              <div className="text-sm font-medium">{user?.displayName}</div>
              <div className="text-xs text-gray-500">View Profile</div>
            </div>
          </a>
        </Link>
        <button 
          onClick={logout}
          className="mt-2 p-2 w-full text-left text-sm text-gray-600 hover:text-primary hover:bg-blue-50 rounded-md"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Logout
        </button>
      </div>
    </aside>
  );
}
