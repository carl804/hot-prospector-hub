import { useState, useEffect, useCallback } from 'react';

interface User {
  email: string;
  name: string;
  picture?: string;
  ghlUserId?: string;
  ghlRole?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isDevMode: boolean;
}

// Check if we're in Lovable preview (not deployed to Vercel)
const isLovablePreview = () => {
  const hostname = window.location.hostname;
  return hostname.includes('lovableproject.com') || hostname.includes('localhost');
};

// Dev mode user for testing in Lovable preview
const DEV_USER: User = {
  email: 'dev@hotprospector.com',
  name: 'Dev User',
  ghlRole: 'admin',
};

export function useAuth() {
  const devMode = isLovablePreview();
  
  const [state, setState] = useState<AuthState>({
    user: devMode ? DEV_USER : null,
    isAuthenticated: devMode,
    isLoading: !devMode,
    error: null,
    isDevMode: devMode,
  });

  const checkAuth = useCallback(async () => {
    // In dev mode, skip API check
    if (devMode) {
      setState({
        user: DEV_USER,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isDevMode: true,
      });
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      // Check if response is JSON (API exists) or HTML (API doesn't exist)
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        // API route doesn't exist - we're not on Vercel
        setState({
          user: DEV_USER,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          isDevMode: true,
        });
        return;
      }
      
      const data = await response.json();
      
      setState({
        user: data.user,
        isAuthenticated: data.authenticated,
        isLoading: false,
        error: data.error || null,
        isDevMode: false,
      });
    } catch (error) {
      // If API fails, fall back to dev mode
      setState({
        user: DEV_USER,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isDevMode: true,
      });
    }
  }, [devMode]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(() => {
    if (devMode) {
      // In dev mode, just set authenticated
      setState(prev => ({ ...prev, isAuthenticated: true, user: DEV_USER }));
      return;
    }
    window.location.href = '/api/auth/google';
  }, [devMode]);

  const logout = useCallback(async () => {
    if (devMode) {
      // In dev mode, we don't actually log out (for easier testing)
      return;
    }
    window.location.href = '/api/auth/logout';
  }, [devMode]);

  return {
    ...state,
    login,
    logout,
    refetch: checkAuth,
  };
}
