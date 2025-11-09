import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// User type
type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  isAnonymous?: boolean;
  photoURL?: string;
} | null;

// Auth context type
type AuthContextType = {
  user: User;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  confirmPasswordReset: (code: string, newPassword: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  updateProfile: (displayName: string, photoURL?: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  reloadUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data
const MOCK_USER: User = {
  uid: 'mock-user-id',
  email: 'dev@caretrek.app',
  displayName: 'Dev User',
  emailVerified: true,
  isAnonymous: false,
};

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation();

  // Simulate auth state check
  useEffect(() => {
    const timer = setTimeout(() => {
      setUser(MOCK_USER);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Mock sign in
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUser({
        ...MOCK_USER,
        email,
        displayName: email.split('@')[0],
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock sign up
  const signUp = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUser({
        ...MOCK_USER,
        email,
        displayName,
        emailVerified: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock sign out
  const signOut = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Mock password reset
  const sendPasswordResetEmail = async (email: string) => {
    console.log(`Password reset email sent to: ${email}`);
    return Promise.resolve();
  };

  // Mock confirm password reset
  const confirmPasswordReset = async (code: string, newPassword: string) => {
    console.log(`Password reset confirmed with code: ${code}`);
    return Promise.resolve();
  };

  // Mock anonymous sign in
  const signInAnonymously = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser({
        uid: 'anonymous-user-id',
        email: null,
        displayName: 'Guest',
        emailVerified: false,
        isAnonymous: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock update profile
  const updateProfile = async (displayName: string, photoURL?: string) => {
    if (user) {
      setUser({
        ...user,
        displayName,
        photoURL,
      });
    }
    return Promise.resolve();
  };

  // Mock update email
  const updateEmail = async (email: string) => {
    if (user) {
      setUser({
        ...user,
        email,
        emailVerified: false,
      });
    }
    return Promise.resolve();
  };

  // Mock update password
  const updatePassword = async (password: string) => {
    console.log('Password updated');
    return Promise.resolve();
  };

  // Mock reload user
  const reloadUser = async () => {
    return Promise.resolve();
  };

  // Mock delete account
  const deleteAccount = async () => {
    await signOut();
    return Promise.resolve();
  };

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        sendPasswordResetEmail,
        confirmPasswordReset,
        signInAnonymously,
        updateProfile,
        updateEmail,
        updatePassword,
        reloadUser,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
