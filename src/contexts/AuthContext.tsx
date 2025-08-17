// src/contexts/AuthContext.tsx
"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthUser {
    uid: string;
    email: string | null;
    name: string;
    avatar: string;
    role: 'client' | 'lawyer';
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
            if (firebaseUser) {
                // User is signed in, now fetch their profile to get the role
                let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                let role: 'lawyer' | 'client' | null = null;
                let userData;

                if (userDoc.exists()) {
                    role = 'lawyer';
                    userData = userDoc.data();
                } else {
                    userDoc = await getDoc(doc(db, 'clients', firebaseUser.uid));
                    if (userDoc.exists()) {
                        role = 'client';
                        userData = userDoc.data();
                    }
                }

                if (role && userData) {
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        name: userData.name,
                        avatar: userData.avatar,
                        role: role
                    });
                } else {
                    // Profile doesn't exist yet, which can happen for a brief moment after registration.
                    // Or it's a login for a user whose profile creation failed.
                    console.error("User profile not found in Firestore.");
                    setUser(null);
                }
            } else {
                // User is signed out
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);
    
    const signOut = async () => {
        await auth.signOut();
        router.push('/login');
    };

    const value = { user, loading, signOut };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
