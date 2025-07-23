import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import type { User, RegisterData, LoginData } from '@shared/schema';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginData) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyResetToken: (token: string) => Promise<boolean>;
  logoutMutation: any;
}

const AuthContext = createContext<AuthContextType | null>(null);

// API functions
const authAPI = {
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          return null;
        }
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.warn('Auth error (non-critical):', error);
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('Network error during auth check - likely due to connection issues');
        return null;
      }
      throw error;
    }
  },

  async register(userData: RegisterData): Promise<{ user: User; sessionToken: string }> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return await response.json();
  },

  async login(credentials: LoginData): Promise<{ user: User; sessionToken: string }> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return await response.json();
  },

  async loginWithGoogle(idToken: string): Promise<{ user: User; sessionToken: string }> {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Google login failed');
    }

    return await response.json();
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('authToken');
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }
    localStorage.removeItem('authToken');
  },

  async updateProfile(updates: Partial<User>): Promise<{ user: User }> {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Profile update failed');
    }

    return await response.json();
  },

  async requestPasswordReset(email: string): Promise<void> {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password reset request failed');
    }
  },

  async verifyResetToken(token: string): Promise<boolean> {
    const response = await fetch(`/api/auth/verify-reset-token/${token}`);
    
    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.valid;
  },

  async resetPassword(token: string, password: string): Promise<void> {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password reset failed');
    }
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Query current user
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['auth', 'currentUser'],
    queryFn: authAPI.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Initialize auth state
  useEffect(() => {
    if (!isLoading) {
      setIsInitialized(true);
    }
  }, [isLoading]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.sessionToken);
      queryClient.setQueryData(['auth', 'currentUser'], data.user);
      toast({
        title: t('auth.toasts.loginSuccess'),
        description: t('auth.toasts.loginWelcomeBack', { name: data.user.firstName }),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.toasts.loginFailed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.sessionToken);
      queryClient.setQueryData(['auth', 'currentUser'], data.user);
      toast({
        title: t('auth.toasts.registerSuccess'),
        description: t('auth.toasts.registerWelcome', { name: data.user.firstName }),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.toasts.registerFailed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Google login mutation
  const googleLoginMutation = useMutation({
    mutationFn: authAPI.loginWithGoogle,
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.sessionToken);
      queryClient.setQueryData(['auth', 'currentUser'], data.user);
      toast({
        title: t('auth.toasts.googleLoginSuccess'),
        description: t('auth.toasts.googleLoginWelcome', { name: data.user.firstName }),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.toasts.googleLoginFailed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'currentUser'], null);
      queryClient.clear(); // Clear all cached data
      toast({
        title: t('auth.toasts.logoutSuccess'),
        description: t('auth.toasts.logoutGoodbye'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.toasts.logoutFailed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'currentUser'], data.user);
      toast({
        title: t('auth.toasts.profileUpdateSuccess'),
        description: t('auth.toasts.profileUpdateDescription'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.toasts.profileUpdateFailed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Password reset mutations
  const requestPasswordResetMutation = useMutation({
    mutationFn: authAPI.requestPasswordReset,
    onSuccess: () => {
      toast({
        title: 'E-Mail gesendet',
        description: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) => 
      authAPI.resetPassword(token, password),
    onSuccess: () => {
      toast({
        title: 'Passwort zurückgesetzt',
        description: 'Dein Passwort wurde erfolgreich zurückgesetzt. Du kannst dich jetzt mit dem neuen Passwort anmelden.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler beim Zurücksetzen',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const contextValue: AuthContextType = {
    user: user || null,
    isLoading: !isInitialized || isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    loginWithGoogle: googleLoginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    requestPasswordReset: requestPasswordResetMutation.mutateAsync,
    resetPassword: (token: string, password: string) => resetPasswordMutation.mutateAsync({ token, password }),
    verifyResetToken: authAPI.verifyResetToken,
    logoutMutation,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}