import React, { createContext, useContext, useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import { View, ActivityIndicator } from 'react-native';

type User = {
  uid: string;
  email: string | null;
  isGuest: boolean;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
};

type SignInCredentials = {
  email: string;
  password: string;
};

type SignUpData = SignInCredentials & {
  displayName?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle user state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isGuest: firebaseUser.isAnonymous,
          emailVerified: firebaseUser.emailVerified,
          phoneNumber: firebaseUser.phoneNumber,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async ({ email, password }: SignInCredentials) => {
    try {
      setLoading(true);
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async ({ email, password, displayName }: SignUpData) => {
    try {
      setLoading(true);
      const { user: newUser } = await auth().createUserWithEmailAndPassword(email, password);
      
      if (newUser && displayName) {
        await newUser.updateProfile({ displayName });
      }
      
      // Send email verification
      if (newUser && !newUser.emailVerified) {
        await newUser.sendEmailVerification();
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  // Sign in as guest
  const signInAsGuest = async () => {
    try {
      setLoading(true);
      await auth().signInAnonymously();
    } catch (error: any) {
      console.error('Guest sign in error:', error);
      throw new Error(error.message || 'Failed to sign in as guest');
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      await auth().signOut();
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (data: { displayName?: string; photoURL?: string }) => {
    try {
      setLoading(true);
      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.updateProfile(data);
        // Update local user state
        setUser(prev => prev ? { ...prev, ...data } : null);
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Send email verification
  const sendEmailVerification = async () => {
    try {
      setLoading(true);
      const currentUser = auth().currentUser;
      if (currentUser && !currentUser.emailVerified) {
        await currentUser.sendEmailVerification();
      }
    } catch (error: any) {
      console.error('Send email verification error:', error);
      throw new Error(error.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInAsGuest,
    signOut,
    resetPassword,
    updateProfile,
    sendEmailVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      {loading && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
