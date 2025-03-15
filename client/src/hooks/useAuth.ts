import { useState, useEffect, useCallback } from 'react';
import { signInWithGoogle, signOut, getCurrentUser, onAuthChange } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from 'firebase/auth';

// Types
export type AuthUser = {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  firebaseUid: string;
};

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Get user profile from API
  const fetchUserProfile = useCallback(async (firebaseUid: string) => {
    try {
      const response = await fetch(`/api/users/firebase/${firebaseUid}`);
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 404) {
        setUser(null);
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user profile. Please try again.',
        variant: 'destructive',
      });
      setUser(null);
    }
  }, [toast]);

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      setFirebaseUser(authUser);
      
      if (authUser) {
        await fetchUserProfile(authUser.uid);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [fetchUserProfile]);

  // Login with Google
  const login = async () => {
    try {
      setLoading(true);
      const authUser = await signInWithGoogle();
      setFirebaseUser(authUser);
      
      // Check if user exists in our system
      await fetchUserProfile(authUser.uid);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: 'An error occurred during login. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      await signOut();
      setUser(null);
      setFirebaseUser(null);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout Failed',
        description: 'An error occurred during logout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Register new user profile
  const register = async (username: string) => {
    if (!firebaseUser) {
      toast({
        title: 'Authentication Error',
        description: 'You need to sign in with Google first.',
        variant: 'destructive',
      });
      return null;
    }
    
    try {
      const response = await apiRequest('POST', '/api/auth/register', {
        username,
        displayName: firebaseUser.displayName || username,
        password: `firebase_${Date.now()}`, // Not used for auth, just for schema
        avatar: firebaseUser.photoURL || undefined,
        firebaseUid: firebaseUser.uid,
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        toast({
          title: 'Registration Successful',
          description: 'Your account has been created. Welcome to PeerGram!',
        });
        return userData;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'An error occurred during registration',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    user,
    firebaseUser,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
    refetchProfile: firebaseUser ? () => fetchUserProfile(firebaseUser.uid) : undefined,
  };
};
