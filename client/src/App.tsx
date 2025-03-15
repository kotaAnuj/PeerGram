import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Messages from "@/pages/Messages";
import Chat from "@/pages/Chat";
import Search from "@/pages/Search";
import Profile from "@/pages/Profile";
import Explore from "@/pages/Explore";
import Network from "@/pages/Network";
import CreatePost from "@/pages/CreatePost";
import Founder from "@/pages/Founder";
import NotFound from "@/pages/not-found";

// Layouts and components
import Sidebar from "@/components/layout/Sidebar";
import MobileNavbar from "@/components/layout/MobileNavbar";
import FriendRequests from "@/components/modals/FriendRequests";

function App() {
  const { user, loading } = useAuth();
  const [showFriendRequests, setShowFriendRequests] = useState(false);

  useEffect(() => {
    // Set up event listener for friend request notifications
    const handleFriendRequestNotification = (event: CustomEvent) => {
      // Show friend request modal or notification
    };

    window.addEventListener('friendRequest' as any, handleFriendRequestNotification);

    return () => {
      window.removeEventListener('friendRequest' as any, handleFriendRequestNotification);
    };
  }, []);

  const toggleFriendRequests = () => {
    setShowFriendRequests(!showFriendRequests);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lightgray">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Loading PeerGram...</h2>
          <div className="animate-pulse mt-4 flex space-x-4 justify-center">
            <div className="h-3 w-3 bg-primary rounded-full"></div>
            <div className="h-3 w-3 bg-primary rounded-full"></div>
            <div className="h-3 w-3 bg-primary rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // If no user, show login page
  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <Login />
        <Toaster />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-lightgray">
        <Sidebar onShowFriendRequests={toggleFriendRequests} />
        
        <div className="flex-1 md:ml-64">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/messages" component={Messages} />
            <Route path="/chat/:id" component={Chat} />
            <Route path="/search" component={Search} />
            <Route path="/profile/:id?" component={Profile} />
            <Route path="/explore" component={Explore} />
            <Route path="/network" component={Network} />
            <Route path="/create" component={CreatePost} />
            <Route path="/founder" component={Founder} />
            <Route component={NotFound} />
          </Switch>
        </div>
        
        <MobileNavbar />
        
        {showFriendRequests && (
          <FriendRequests onClose={toggleFriendRequests} />
        )}
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
