
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

import {
  authApi,
  getToken,
  setToken,
  clearToken,
} from '../services/api';

import {
  connectSocket,
  disconnectSocket,
} from '../services/socket';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore the previous login session when the app loads.
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

        // Connect Socket.IO after restoring the session.
        connectSocket();
      })
      .catch(() => {
        // The saved token is invalid or expired.
        disconnectSocket();
        clearToken();
        setUser(null);
        setTokenState(null);
      })
      .finally(() => setIsLoading(false));

    return () => {
      disconnectSocket();
    };
  }, []);

  async function login(payload: LoginPayload) {
    const { token: newToken, user: loggedInUser } =
      await authApi.login(payload);

    setToken(newToken);
    setTokenState(newToken);
    setUser(loggedInUser);

    // Connect after saving the new token.
    connectSocket();
  }

  async function register(payload: RegisterPayload) {
    const { token: newToken, user: newUser } =
      await authApi.register(payload);

    setToken(newToken);
    setTokenState(newToken);
    setUser(newUser);

    // Connect after saving the new token.
    connectSocket();
  }

  function logout() {
    disconnectSocket();
    clearToken();
    setTokenState(null);
    setUser(null);
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
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