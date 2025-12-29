import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/services/api';

interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { phone: string; name: string; email?: string; role?: string; otp: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestOTP: (phone: string, purpose: 'LOGIN' | 'REGISTRATION') => Promise<{ success: boolean; error?: string; otp?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (storedUser && accessToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    setIsLoading(false);
  }, []);

  const requestOTP = async (phone: string, purpose: 'LOGIN' | 'REGISTRATION') => {
    const response = await api.requestOTP(phone, purpose);
    if (response.success) {
      // In development, OTP might be returned
      return { success: true, otp: (response as { otp?: string }).otp };
    }
    return { success: false, error: response.error || 'Failed to send OTP' };
  };

  const login = async (phone: string, otp: string) => {
    const response = await api.login(phone, otp);
    if (response.success && response.data) {
      setUser(response.data.user as User);
      return { success: true };
    }
    return { success: false, error: response.error || 'Login failed' };
  };

  const register = async (data: { phone: string; name: string; email?: string; role?: string; otp: string }) => {
    const response = await api.register(data);
    if (response.success && response.data) {
      setUser(response.data.user as User);
      return { success: true };
    }
    return { success: false, error: response.error || 'Registration failed' };
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        requestOTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
