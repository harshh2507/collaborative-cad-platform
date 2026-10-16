import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type {
  AuthContextType,
  User,
  LoginPayload,
  RegisterPayload,
} from '../types';
import { authApi, getToken, setToken, clearToken } from '../services/api';

// Extended type so we can update the user state in real time
interface ExtendedAuthContextType extends AuthContextType {
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On app load, if a token exists, restore session
  useEffect(() => {
    const existingToken = getToken();
    if (!existingToken) {
      setIsLoading(false);
      return;
    }

    authApi
      .getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        setTokenState(existingToken);
      })
      .catch(() => {
        clearToken();
        setUser(null);
        setTokenState(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(payload: LoginPayload) {
    const { token: newToken, user: loggedInUser } = await authApi.login(payload);
    setToken(newToken);
    setTokenState(newToken);
    setUser(loggedInUser);
  }

  async function register(payload: RegisterPayload) {
    const { token: newToken, user: newUser } = await authApi.register(payload);
    setToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
  }

  function logout() {
    clearToken();
    setTokenState(null);
    setUser(null);
  }

  function updateUser(updatedData: Partial<User>) {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  }

  const value: ExtendedAuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): ExtendedAuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}