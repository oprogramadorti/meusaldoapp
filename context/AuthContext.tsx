
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Tentativa de obter o resultado de redirecionamento, caso o usuário tenha vindo de um Redirect
        // Embora tenhamos mudado para Popup na LoginPage, mantemos isso para compatibilidade se necessário.
        getRedirectResult(auth).catch((error) => {
            // Ignoramos erros comuns de cancelamento ou de falta de credencial pendente
            if (error.code !== 'auth/credential-already-in-use' && error.code !== 'auth/invalid-credential') {
                console.error("Error processing Google sign-in redirect:", error);
            }
        });

        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
