import { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  isAuthenticated: false 
});

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('AuthContext: Auth state changed');
      console.log('AuthContext: Firebase user object:', firebaseUser);
      
      if (firebaseUser) {
        console.log('AuthContext: User authenticated');
        console.log('AuthContext: User UID:', firebaseUser.uid);
        console.log('AuthContext: User email:', firebaseUser.email);
        console.log('AuthContext: User displayName:', firebaseUser.displayName);
        console.log('AuthContext: User emailVerified:', firebaseUser.emailVerified);
        console.log('AuthContext: User created:', firebaseUser.metadata.creationTime);
        
        setUser(firebaseUser);
      } else {
        console.log('AuthContext: No user authenticated');
        setUser(null);
      }
      
      setLoading(false);
      console.log('AuthContext: Loading set to false');
    });

    return () => {
      console.log('AuthContext: Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const contextValue: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
  };

  console.log('AuthContext: Providing context:', {
    hasUser: !!user,
    userEmail: user?.email,
    loading,
    isAuthenticated: !!user
  });

  if (loading) {
    console.log('AuthContext: Still loading, showing loading state');
    return null; 
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};