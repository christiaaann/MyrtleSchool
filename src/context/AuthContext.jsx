// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [branch, setBranch] = useState(null); 
  const [loading, setLoading] = useState(true);

  const setAuthUser = (firebaseUser, userRole, userBranch = "") => {
    setUser(firebaseUser);
    setRole(userRole);
    setBranch(userBranch); 
    setLoading(false);
  };

  useEffect(() => {
    let unsubscribeDoc;
    
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setBranch(null); 
        setLoading(false);
        if (unsubscribeDoc) unsubscribeDoc();
        return;
      }

      // Instantly set the user so the app knows we are logged in
      setUser(firebaseUser);

      // CRUCIAL FIX: Use onSnapshot instead of getDoc to catch real-time account creation!
      const docRef = doc(db, "users", firebaseUser.uid);
      unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setRole(userData.role);
          setBranch(userData.branch || ""); 
        } else {
          setRole(null);
          setBranch(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("AuthContext Snapshot Error:", error);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, branch, loading, setAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;