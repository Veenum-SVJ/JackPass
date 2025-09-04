'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserProfile, createUser, getUserByEmail, updateUser, getOnlineStatus, syncToCloud } from '@/lib/hybrid-storage';

// Define the shape of the context
interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  online: boolean;
  register: (email: string, password: string, userData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  syncToCloud: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('jackpass_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          // Convert date strings back to Date objects
          userData.createdAt = new Date(userData.createdAt);
          userData.updatedAt = new Date(userData.updatedAt);
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to load user from localStorage:', error);
      }
    }
  }, []);

  // Effect to check online status and sync data
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const checkOnlineStatus = () => {
      try {
        // Safely call getOnlineStatus with error handling
        const isOnline = getOnlineStatus();
        setOnline(isOnline);
        
        // If we're online, try to sync local data to cloud
        if (isOnline) {
          // Use setTimeout to avoid blocking the main thread
          setTimeout(() => {
            try {
              // Call the imported syncToCloud function directly
              syncToCloud();
            } catch (error) {
              console.error('Failed to sync to cloud:', error);
            }
          }, 100);
        }
      } catch (error) {
        console.error('Failed to check online status:', error);
        setOnline(false);
      }
    };

    // Check initially with a small delay to ensure everything is initialized
    const initialCheck = setTimeout(checkOnlineStatus, 100);
    
    // Set up interval to check status
    const interval = setInterval(checkOnlineStatus, 5000);
    
    // Set up online/offline event listeners
    const handleOnline = () => {
      setOnline(true);
      // Use setTimeout to avoid blocking the main thread
      setTimeout(() => {
        try {
          // Call the imported syncToCloud function directly
          syncToCloud();
        } catch (error) {
          console.error('Failed to sync to cloud on online event:', error);
        }
      }, 100);
    };
    
    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const register = async (email: string, password: string, userData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>) => {
    try {
      const profile = await createUser(userData);
      setUser(profile);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('jackpass_user', JSON.stringify(profile));
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const profile = await getUserByEmail(email);
      if (!profile) {
        throw new Error('User not found. Please check your email or create an account.');
      }
      setUser(profile);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('jackpass_user', JSON.stringify(profile));
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      // Remove from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jackpass_user');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (user) {
        await updateUser(user.uid, updates);
        const updatedUser = { ...user, ...updates, updatedAt: new Date() };
        setUser(updatedUser);
        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('jackpass_user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Update failed:', error);
      throw error;
    }
  };

  // Wrapper function to call the imported syncToCloud
  const handleSyncToCloud = async () => {
    try {
      await syncToCloud();
    } catch (error) {
      console.error('Failed to sync to cloud:', error);
    }
  };

  // Set loading to false after initial setup
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, online, register, login, logout, updateUser: updateUserProfile, syncToCloud: handleSyncToCloud }}>
      {children}
    </AuthContext.Provider>
  );
};

