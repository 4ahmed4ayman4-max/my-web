import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AuthResponseDto,
  UserDto,
  LoginRequestDto,
  RegisterRequestDto,
  RefreshTokenRequestDto,
  AccessTokenDto,
  RefreshTokenDto,
} from "@/shared/types/api";
import { API_ENDPOINTS } from "@/api/api-endpoints";
import { createApiClient, apiFetch } from "@/api/apiClient";

interface AuthContextType {
  user: UserDto | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequestDto) => Promise<AuthResponseDto>;
  register: (data: RegisterRequestDto) => Promise<AuthResponseDto>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  isInRole: (role: string) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "storeapp_access_token";
const REFRESH_TOKEN_KEY = "storeapp_refresh_token";
const USER_KEY = "storeapp_user";

// Shared axios client - the same one every other service uses, so auth works
// with and without the Vite dev proxy.
const client = createApiClient();

/**
 * AuthProvider - Manages authentication state, token storage, and refresh logic
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedRefreshToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);
          setUser(parsedUser);

          // Verify token hasn't expired by trying to refresh
          await refreshAccessToken();
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const saveAuth = useCallback((authResponse: AuthResponseDto) => {
    if (
      authResponse.accessToken &&
      authResponse.refreshToken &&
      authResponse.user
    ) {
      const newToken = authResponse.accessToken.token;
      const newRefreshToken = authResponse.refreshToken.token;

      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user));

      setToken(newToken);
      setRefreshToken(newRefreshToken);
      setUser(authResponse.user);
    }
  }, []);

  const login = useCallback(
    async (credentials: LoginRequestDto) => {
      const data = await apiFetch<AuthResponseDto>(
        client,
        "post",
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }

      saveAuth(data);

      return data;
    },
    [saveAuth],
  );

  const register = useCallback(
    async (payload: RegisterRequestDto) => {
      const result = await apiFetch<AuthResponseDto>(
        client,
        "post",
        API_ENDPOINTS.AUTH.REGISTER,
        payload
      );

      if (!result.success) {
        throw new Error(result.message || "Registration failed");
      }

      saveAuth(result);

      return result;
    },
    [saveAuth],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch(
        client,
        "post",
        API_ENDPOINTS.AUTH.LOGOUT,
        undefined,
        token ?? undefined
      );
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuth();
      navigate("/login");
    }
  }, [token, clearAuth, navigate]);

  const refreshAccessToken = useCallback(async () => {
    const currentRefreshToken =
      refreshToken || localStorage.getItem(REFRESH_TOKEN_KEY);
    const currentAccessToken = token || localStorage.getItem(TOKEN_KEY);

    if (!currentRefreshToken || !currentAccessToken) {
      throw new Error("No tokens available");
    }

    let data: AuthResponseDto;

    try {
      data = await apiFetch<AuthResponseDto>(
        client,
        "post",
        API_ENDPOINTS.AUTH.REFRESH,
        {
          accessToken: currentAccessToken,
          refreshToken: currentRefreshToken,
        }
      );
    } catch (error: any) {
      clearAuth();
      navigate("/login");
      throw new Error(error?.message || "Token refresh failed");
    }

    if (!data.success) {
      clearAuth();
      navigate("/login");
      throw new Error(data.message || "Token refresh failed");
    }

    saveAuth(data);
  }, [token, refreshToken, saveAuth, clearAuth, navigate]);

  const isInRole = useCallback(
    (role: string) => {
      if (!user) return false;
      return user.roles.includes(role);
    },
    [user],
  );

  const isAdmin = useCallback(() => isInRole("Admin"), [isInRole]);

  const value: AuthContextType = {
    user,
    token,
    refreshToken,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    refreshAccessToken,
    isInRole,
    isAdmin: isAdmin(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

/**
 * Hook for protected routes - returns loading state while auth initializes
 */
export function useAuthInit() {
  const { isLoading, isAuthenticated } = useAuth();
  return { isLoading, isAuthenticated };
}
