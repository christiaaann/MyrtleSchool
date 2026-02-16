// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      const doc = await db.collection("users").doc(firebaseUser.uid).get();
      if (doc.exists) {
        setUser(firebaseUser);
        setRole(doc.data().role);
      } else {
        setUser(firebaseUser);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
