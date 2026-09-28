import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('cw_token');
    const storedUser = localStorage.getItem('cw_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('cw_token', token);
    localStorage.setItem('cw_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('cw_token');
    localStorage.removeItem('cw_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
