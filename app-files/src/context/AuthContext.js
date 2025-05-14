// src/context/AuthContext.js
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // User object or null
  const [isLoading, setIsLoading] = useState(true); // To handle initial auth check
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/me'); // API to get current user
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        setUser(null); // Not authenticated or error
        // If on a protected route and not authenticated, redirect to login
        if (!['/auth/login', '/auth/register'].includes(pathname) && pathname.startsWith('/dashboard')) { // Example protected path
            // router.push('/auth/login'); // Commented out for now, will handle in ProtectedRoute
        }
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [pathname]); // router removed from dependencies as it caused too many re-fetches

  useEffect(() => {
    fetchUser();
  }, [fetchUser]); // Fetch user on initial load and when fetchUser changes (e.g. after login/logout)

  const login = async (email, password) => {
    // API call to /api/auth/login
    // On success:
    //   await fetchUser(); // Re-fetch user data to update context
    //   router.push('/dashboard');
    // On failure:
    //   throw new Error('Login failed');
    // This logic is currently in LoginPage, can be centralized here later
    // For now, LoginPage will call fetchUser after its own successful login API call
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null); // Clear user from context
      router.push('/auth/login'); // Redirect to login
    } catch (error) {
      console.error("Logout failed", error);
      // Handle logout error if needed
    }
  };
  
  const register = async (name, email, password, role) => {
    // API call to /api/auth/register
    // This logic is currently in RegisterPage
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, register, isLoading, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};