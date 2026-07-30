/**
 * KORA Role-Based Access Control (RBAC) — Frontend
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Master Prompt Architecture — Section 3 & Section 32
 * 
 * Principe transversal — divulgation progressive par rôle :
 * Une seule application, plusieurs niveaux de surface exposée selon le rôle.
 */

import React, { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type UserRole = 'listener' | 'creator' | 'developer' | 'label_admin' | 'admin';

export type ModuleAccess = 'invisible' | 'read_only' | 'full_access';

export interface User {
  id: string;
  frek_id: string;
  email: string;
  display_name: string;
  role: UserRole;
  is_creator: boolean;
  is_developer: boolean;
  is_premium: boolean;
  onboarding_completed: boolean;
  territories: string[];
  genres: string[];
  avatar_url?: string;
}

export interface AccessCheckResult {
  allowed: boolean;
  message?: string;
  redirect_to?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERMISSIONS MATRIX (Mirror of backend/models/rbac.py)
// ═══════════════════════════════════════════════════════════════════════════════

const ROLE_PERMISSIONS: Record<UserRole, Record<string, ModuleAccess>> = {
  listener: {
    fondation: 'full_access',
    catalogue: 'read_only',
    lecteur: 'full_access',
    bibliotheque: 'full_access',
    recherche: 'full_access',
    social: 'full_access',
    editorial: 'read_only',
    notifications: 'full_access',
    publication: 'invisible',
    monetisation: 'invisible',
    statistiques: 'invisible',
    administration: 'invisible',
    api_ecosystem: 'invisible',
    kora_creators: 'invisible',
    kora_developers: 'invisible',
  },
  creator: {
    fondation: 'full_access',
    catalogue: 'read_only',
    lecteur: 'full_access',
    bibliotheque: 'full_access',
    recherche: 'full_access',
    social: 'full_access',
    editorial: 'read_only',
    notifications: 'full_access',
    publication: 'full_access',
    monetisation: 'read_only',
    statistiques: 'read_only',
    kora_creators: 'full_access',
    administration: 'invisible',
    api_ecosystem: 'invisible',
    kora_developers: 'invisible',
  },
  developer: {
    fondation: 'full_access',
    catalogue: 'read_only',
    lecteur: 'full_access',
    bibliotheque: 'full_access',
    recherche: 'full_access',
    social: 'full_access',
    editorial: 'read_only',
    notifications: 'full_access',
    api_ecosystem: 'full_access',
    kora_developers: 'full_access',
    publication: 'invisible',
    monetisation: 'invisible',
    statistiques: 'invisible',
    kora_creators: 'invisible',
    administration: 'invisible',
  },
  label_admin: {
    fondation: 'full_access',
    catalogue: 'full_access',
    lecteur: 'full_access',
    bibliotheque: 'full_access',
    recherche: 'full_access',
    social: 'full_access',
    editorial: 'read_only',
    notifications: 'full_access',
    publication: 'full_access',
    monetisation: 'full_access',
    statistiques: 'full_access',
    kora_creators: 'full_access',
    administration: 'read_only',
    api_ecosystem: 'read_only',
    kora_developers: 'read_only',
  },
  admin: {
    fondation: 'full_access',
    catalogue: 'full_access',
    lecteur: 'full_access',
    bibliotheque: 'full_access',
    recherche: 'full_access',
    social: 'full_access',
    editorial: 'full_access',
    notifications: 'full_access',
    publication: 'full_access',
    monetisation: 'full_access',
    statistiques: 'full_access',
    administration: 'full_access',
    api_ecosystem: 'full_access',
    kora_creators: 'full_access',
    kora_developers: 'full_access',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

interface ProtectedRouteConfig {
  module: string;
  required_access: ModuleAccess;
  redirect_to: string;
  error_message: string;
}

export const PROTECTED_ROUTES: Record<string, ProtectedRouteConfig> = {
  '/creator-dashboard': {
    module: 'kora_creators',
    required_access: 'full_access',
    redirect_to: '/become-creator',
    error_message: 'Accès réservé aux créateurs vérifiés. Devenez créateur pour accéder à cette section.',
  },
  '/developers': {
    module: 'kora_developers',
    required_access: 'full_access',
    redirect_to: '/request-api-access',
    error_message: 'Accès réservé aux développeurs. Demandez un accès API pour utiliser cette section.',
  },
  '/upload': {
    module: 'publication',
    required_access: 'full_access',
    redirect_to: '/become-creator',
    error_message: 'Vous devez être créateur vérifié pour publier du contenu.',
  },
  '/admin': {
    module: 'administration',
    required_access: 'full_access',
    redirect_to: '/home',
    error_message: 'Accès réservé aux administrateurs.',
  },
  '/analytics': {
    module: 'statistiques',
    required_access: 'read_only',
    redirect_to: '/become-creator',
    error_message: 'Accès réservé aux créateurs.',
  },
  '/wallet': {
    module: 'monetisation',
    required_access: 'read_only',
    redirect_to: '/become-creator',
    error_message: 'Accès réservé aux créateurs.',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const ACCESS_HIERARCHY: Record<ModuleAccess, number> = {
  invisible: 0,
  read_only: 1,
  full_access: 2,
};

export function getModuleAccess(role: UserRole, module: string): ModuleAccess {
  return ROLE_PERMISSIONS[role]?.[module] || 'invisible';
}

export function canAccessModule(
  role: UserRole,
  module: string,
  requiredAccess: ModuleAccess = 'read_only'
): boolean {
  const access = getModuleAccess(role, module);
  return ACCESS_HIERARCHY[access] >= ACCESS_HIERARCHY[requiredAccess];
}

export function checkRouteAccess(role: UserRole | null, route: string): AccessCheckResult {
  // No user = no access to protected routes
  if (!role) {
    const config = PROTECTED_ROUTES[route];
    if (config) {
      return {
        allowed: false,
        message: 'Veuillez vous connecter pour accéder à cette section.',
        redirect_to: '/auth/login',
      };
    }
    return { allowed: true };
  }

  const config = PROTECTED_ROUTES[route];
  
  // Not a protected route
  if (!config) {
    return { allowed: true };
  }

  // Check access
  if (canAccessModule(role, config.module, config.required_access)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    message: config.error_message,
    redirect_to: config.redirect_to,
  };
}

export function getAccessibleRoutes(role: UserRole): string[] {
  const routeMapping: Record<string, string[]> = {
    fondation: ['/auth', '/settings', '/profile'],
    catalogue: ['/home', '/films', '/podcasts'],
    lecteur: ['/player'],
    bibliotheque: ['/playlists', '/favorites'],
    recherche: ['/search'],
    social: ['/creator'],
    editorial: ['/home', '/trending'],
    notifications: ['/notifications'],
    publication: ['/upload'],
    monetisation: ['/paywall', '/wallet'],
    statistiques: ['/analytics'],
    kora_creators: ['/creator-dashboard'],
    kora_developers: ['/developers'],
    administration: ['/admin'],
  };

  const accessible: string[] = [];
  
  for (const [module, routes] of Object.entries(routeMapping)) {
    if (canAccessModule(role, module)) {
      accessible.push(...routes);
    }
  }

  return accessible;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RBAC CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

interface RBACContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Access checks
  canAccess: (module: string, requiredAccess?: ModuleAccess) => boolean;
  checkRoute: (route: string) => AccessCheckResult;
  getAccessibleRoutes: () => string[];
  
  // Module visibility (for conditional rendering)
  isModuleVisible: (module: string) => boolean;
  isModuleActionable: (module: string) => boolean;
  
  // Auth actions
  setUser: (user: User | null) => void;
  logout: () => void;
}

const RBACContext = createContext<RBACContextType | null>(null);

export function RBACProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from storage on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('kora_user');
      if (storedUser) {
        setUserState(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = useCallback(async (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      await AsyncStorage.setItem('kora_user', JSON.stringify(newUser));
    } else {
      await AsyncStorage.removeItem('kora_user');
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('kora_user');
    await AsyncStorage.removeItem('kora_token');
    setUserState(null);
    router.replace('/landing');
  }, [router]);

  const role = user?.role || null;
  const isAuthenticated = !!user;

  const canAccess = useCallback(
    (module: string, requiredAccess: ModuleAccess = 'read_only') => {
      if (!role) return false;
      return canAccessModule(role, module, requiredAccess);
    },
    [role]
  );

  const checkRoute = useCallback(
    (route: string) => checkRouteAccess(role, route),
    [role]
  );

  const getAccessibleRoutesForUser = useCallback(() => {
    if (!role) return [];
    return getAccessibleRoutes(role);
  }, [role]);

  const isModuleVisible = useCallback(
    (module: string) => {
      if (!role) return false;
      const access = getModuleAccess(role, module);
      return access !== 'invisible';
    },
    [role]
  );

  const isModuleActionable = useCallback(
    (module: string) => {
      if (!role) return false;
      return canAccessModule(role, module, 'full_access');
    },
    [role]
  );

  return (
    <RBACContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        canAccess,
        checkRoute,
        getAccessibleRoutes: getAccessibleRoutesForUser,
        isModuleVisible,
        isModuleActionable,
        setUser,
        logout,
      }}
    >
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE GUARD HOC
// ═══════════════════════════════════════════════════════════════════════════════

interface RouteGuardProps {
  children: ReactNode;
  route: string;
  fallback?: ReactNode;
}

export function RouteGuard({ children, route, fallback }: RouteGuardProps) {
  const { checkRoute, isLoading, isAuthenticated } = useRBAC();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const result = checkRoute(route);
    
    if (!result.allowed) {
      // Show alert and redirect
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Accès Restreint',
          result.message || 'Vous n\'avez pas accès à cette section.',
          [
            {
              text: 'OK',
              onPress: () => router.replace(result.redirect_to || '/home'),
            },
          ]
        );
      } else {
        alert(result.message || 'Vous n\'avez pas accès à cette section.');
        router.replace(result.redirect_to || '/home');
      }
    } else {
      setChecked(true);
    }
  }, [isLoading, route, checkRoute, router]);

  if (isLoading || !checked) {
    return fallback || null;
  }

  return <>{children}</>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONDITIONAL RENDER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

interface ShowForRoleProps {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function ShowForRole({ roles, children, fallback = null }: ShowForRoleProps) {
  const { role } = useRBAC();
  
  if (!role || !roles.includes(role)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface ShowForModuleProps {
  module: string;
  requiredAccess?: ModuleAccess;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ShowForModule({ 
  module, 
  requiredAccess = 'read_only', 
  children, 
  fallback = null 
}: ShowForModuleProps) {
  const { canAccess } = useRBAC();
  
  if (!canAccess(module, requiredAccess)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
