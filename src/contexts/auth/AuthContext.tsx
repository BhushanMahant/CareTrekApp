import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';

// Mock user type for our simplified auth
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

// Mock UserCredential type
interface UserCredential {
  user: User;
}

// Mock ConfirmationResult type
interface ConfirmationResult {
  verificationId: string;
  confirm: (verificationCode: string) => Promise<UserCredential>;
}

// Define the shape of our auth context
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserCredential>;
  register: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  loginWithPhone: (phoneNumber: string) => Promise<ConfirmationResult>;
  verifyOtp: (verificationId: string, otp: string) => Promise<UserCredential>;
  guestLogin: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
  updateUserEmail: (newEmail: string, password: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  recaptchaVerifier: React.RefObject<{ verify: () => Promise<string> } | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock implementation of AuthProvider
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const recaptchaVerifier = useRef<{ verify: () => Promise<string> } | null>(null);

  const isAuthenticated = !!user;
  const isGuest = user?.isAnonymous || false;

  // Mock login function
  const login = async (email: string, password: string): Promise<UserCredential> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        uid: 'mock-user-123',
        email,
        displayName: email.split('@')[0],
        photoURL: null,
        isAnonymous: false
      };
      
      setUser(mockUser);
      return { user: mockUser };
    } catch (err) {
      setError('Failed to login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Mock register function
  const register = async (email: string, password: string, displayName: string): Promise<UserCredential> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        uid: `mock-user-${Date.now()}`,
        email,
        displayName,
        photoURL: null,
        isAnonymous: false
      };
      
      setUser(mockUser);
      return { user: mockUser };
    } catch (err) {
      setError('Failed to register');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Mock logout function
  const logout = async (): Promise<void> => {
    setUser(null);
    return Promise.resolve();
  };

  // Mock guest login
  const guestLogin = async (): Promise<UserCredential> => {
    const mockUser: User = {
      uid: `guest-${Date.now()}`,
      email: null,
      displayName: 'Guest',
      photoURL: null,
      isAnonymous: true
    };
    
    setUser(mockUser);
    return { user: mockUser };
  };

  // Mock phone login
  const loginWithPhone = async (phoneNumber: string): Promise<ConfirmationResult> => {
    return {
      verificationId: 'mock-verification-id',
      confirm: async (verificationCode: string) => {
        const mockUser: User = {
          uid: `phone-user-${Date.now()}`,
          email: null,
          displayName: phoneNumber,
          photoURL: null,
          isAnonymous: false
        };
        
        setUser(mockUser);
        return { user: mockUser };
      }
    };
  };

  // Mock verify OTP
  const verifyOtp = async (verificationId: string, otp: string): Promise<UserCredential> => {
    const mockUser: User = {
      uid: `phone-user-${Date.now()}`,
      email: null,
      displayName: 'Phone User',
      photoURL: null,
      isAnonymous: false
    };
    
    setUser(mockUser);
    return { user: mockUser };
  };

  // Mock update profile
  const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }): Promise<void> => {
    if (user) {
      setUser({
        ...user,
        displayName: updates.displayName || user.displayName,
        photoURL: updates.photoURL || user.photoURL
      });
    }
    return Promise.resolve();
  };

  // Mock update email
  const updateUserEmail = async (newEmail: string, password: string): Promise<void> => {
    if (user) {
      setUser({
        ...user,
        email: newEmail
      });
    }
    return Promise.resolve();
  };

  // Mock update password
  const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    // In a real app, verify current password and update to new one
    return Promise.resolve();
  };

  // Mock reset password
  const resetPassword = async (email: string): Promise<void> => {
    // In a real app, send password reset email
    return Promise.resolve();
  };

  // Mock delete account
  const deleteAccount = async (password: string): Promise<void> => {
    setUser(null);
    return Promise.resolve();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isGuest,
    isLoading,
    error,
    login,
    register,
    loginWithPhone,
    verifyOtp,
    guestLogin,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    deleteAccount,
    recaptchaVerifier
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
    return `+91${cleaned.substring(1)}`;
  }
  // If the number starts with country code, add +
  if (cleaned.length >= 10) {
    return `+${cleaned}`;
  }
  // Default to Indian number if no country code
  return `+91${cleaned}`;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);
  
  // Set up auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthenticated(!!user);
      setIsGuest(!!user?.isAnonymous);
      setIsLoading(false);
    });

    // Initialize reCAPTCHA verifier
    if (typeof window !== 'undefined') {
      recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }

    // Cleanup function
    return () => {
      unsubscribe();
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
      }
    };
  }, []);

  // Resend OTP
  const resendOtp = async (phoneNumber: string): Promise<ConfirmationResult> => {
    return loginWithPhone(phoneNumber);
  };

  // Login with phone number (sends OTP)
  const loginWithPhone = async (phoneNumber: string): Promise<ConfirmationResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
      
      if (!recaptchaVerifier.current) {
        throw new Error('reCAPTCHA verifier not initialized');
      }
      
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifier.current
      );
      
      setConfirmation(confirmationResult);
      return confirmationResult;
      
    } catch (error: any) {
      console.error('Phone login error:', error);
      let errorMessage = 'Failed to send verification code';
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later';
      }
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Email/Password Authentication
  const login = async (email: string, password: string): Promise<UserCredential> => {
    try {
      setIsLoading(true);
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setIsGuest(false);
      return userCredential;
    } catch (error: any) {
      let errorMessage = 'Failed to sign in';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
      }
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async (verificationId: string, otp: string): Promise<UserCredential> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!confirmation) {
        throw new Error('No confirmation found. Please request a new OTP.');
      }
      
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await signInWithCredential(auth, credential);
      
      setIsGuest(false);
      return userCredential;
      
    } catch (error: any) {
      console.error('OTP verification error:', error);
      let errorMessage = 'Failed to verify OTP';
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Verification code has expired';
      }
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Register new user
  const register = async (email: string, password: string, displayName: string): Promise<UserCredential> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName,
          createdAt: new Date().toISOString(),
          isGuest: false,
          phoneNumber: userCredential.user.phoneNumber || null,
          photoURL: userCredential.user.photoURL || null,
          emailVerified: userCredential.user.emailVerified,
        });
        
        // Update local user state
        setUser({ ...userCredential.user, displayName } as User);
      }
      
      setIsGuest(false);
      return userCredential;
      
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Failed to register';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await signOut(auth);
      setUser(null);
      setIsAuthenticated(false);
      setIsGuest(false);
      setConfirmation(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      setError('Failed to logout. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Guest login
  const guestLogin = async (): Promise<UserCredential> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Sign in anonymously
      const userCredential = await signInAnonymously(auth);
      
      // Create guest user document in Firestore
      if (userCredential.user) {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          isGuest: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        });
      }
      
      setIsGuest(true);
      return userCredential;
      
    } catch (error: any) {
      console.error('Guest login error:', error);
      setError('Failed to login as guest. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    isAuthenticated,
    isGuest,
    isLoading,
    error,
    login,
    register,
    loginWithPhone,
    verifyOtp,
    resendOtp,
    guestLogin,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    deleteAccount,
    recaptchaVerifier,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
