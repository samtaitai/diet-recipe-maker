import React from 'react';
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { useTranslation } from "react-i18next";

const AuthButton = ({ user }) => {
    const { t } = useTranslation();

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    if (user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{user.email}</span>
                <button onClick={handleLogout}>{t('logout')}</button>
            </div>
        );
    }

    return (
        <button onClick={handleLogin}>{t('login_google')}</button>
    );
};

export default AuthButton;
