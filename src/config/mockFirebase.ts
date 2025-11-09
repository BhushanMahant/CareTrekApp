// Mock Firebase implementation for development
const MOCK_USER = {
  uid: 'mock-user-id',
  email: 'dev@caretrek.app',
  displayName: 'Dev User',
  emailVerified: true,
  isAnonymous: false,
  sendEmailVerification: async () => Promise.resolve(),
  updateProfile: async (updates: any) => {
    Object.assign(MOCK_USER, updates);
    return Promise.resolve();
  },
  updateEmail: async (email: string) => {
    MOCK_USER.email = email;
    MOCK_USER.emailVerified = false;
    return Promise.resolve();
  },
  updatePassword: async (password: string) => Promise.resolve(),
  delete: async () => Promise.resolve(),
  reload: async () => Promise.resolve(),
};

// Mock auth
const auth = {
  currentUser: MOCK_USER,
  signInWithEmailAndPassword: async (email: string, password: string) => {
    return {
      user: {
        ...MOCK_USER,
        email,
        displayName: email.split('@')[0],
      },
    };
  },
  createUserWithEmailAndPassword: async (email: string, password: string) => {
    return {
      user: {
        ...MOCK_USER,
        email,
        displayName: email.split('@')[0],
        emailVerified: false,
      },
    };
  },
  signOut: async () => {
    // No-op
    return Promise.resolve();
  },
  signInAnonymously: async () => ({
    user: {
      uid: 'anonymous-user-id',
      email: null,
      displayName: 'Guest',
      emailVerified: false,
      isAnonymous: true,
    },
  }),
  sendPasswordResetEmail: async (email: string) => {
    console.log(`[MOCK] Password reset email sent to: ${email}`);
    return Promise.resolve();
  },
  confirmPasswordReset: async (code: string, newPassword: string) => {
    console.log(`[MOCK] Password reset confirmed with code: ${code}`);
    return Promise.resolve();
  },
  onAuthStateChanged: (callback: any) => {
    // Simulate auth state change
    setTimeout(() => {
      callback(MOCK_USER);
    }, 1000);
    
    // Return unsubscribe function
    return () => {};
  },
};

// Mock Firestore
const firestore = () => {
  const collection = (path: string) => ({
    doc: (id: string) => ({
      get: async () => ({
        exists: true,
        data: () => ({
          id,
          ...(path === 'users' ? MOCK_USER : {}),
        }),
      }),
      set: async (data: any) => {
        console.log(`[MOCK] Firestore set ${path}/${id}:`, data);
        return Promise.resolve();
      },
      update: async (data: any) => {
        console.log(`[MOCK] Firestore update ${path}/${id}:`, data);
        return Promise.resolve();
      },
      delete: async () => {
        console.log(`[MOCK] Firestore delete ${path}/${id}`);
        return Promise.resolve();
      },
      collection: (subPath: string) => collection(`${path}/${id}/${subPath}`),
    }),
    where: (field: string, op: string, value: any) => ({
      get: async () => ({
        docs: [],
        empty: true,
        forEach: (callback: any) => {},
      }),
    }),
  });

  return { collection };
};

// Mock Storage
const storage = () => ({
  ref: (path: string) => ({
    putFile: async (uri: string) => {
      console.log(`[MOCK] Uploaded file to ${path}: ${uri}`);
      return {
        ref: {
          getDownloadURL: async () => `https://mock-storage.com/${path}`,
        },
      };
    },
  }),
});

// Mock Firebase app
const initializeApp = () => ({
  name: '[DEFAULT]',
  options: {},
  automaticDataCollectionEnabled: false,
});

// Export mocks
export default {
  // Core
  initializeApp,
  app: initializeApp(),
  
  // Auth
  auth: () => auth,
  getAuth: () => auth,
  
  // Firestore
  firestore,
  getFirestore: firestore,
  
  // Storage
  storage,
  getStorage: storage,
  
  // Other common Firebase services can be added here
};
