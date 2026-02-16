import { Globe, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";

const AppHeader = ({ user }) => {
    const { t, i18n } = useTranslation();

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

    const toggleLanguage = () => {
        const nextLang = i18n.language === 'en' ? 'ko' : 'en';
        i18n.changeLanguage(nextLang);
    };

    const currentLang = i18n.language.toUpperCase();

    return (
        <header className="app-header">
            <div className="app-header-container">
                {/* App name */}
                <div className="app-header-logo">
                    <span className="app-header-logo-icon">🥗</span>
                    <span className="app-header-logo-text">
                        {t('app_title') || "NourishAI"}
                    </span>
                </div>

                {/* Right side */}
                <div className="app-header-right">
                    {/* Language badge */}
                    <button className="lang-badge" onClick={toggleLanguage}>
                        <Globe size={13} />
                        {currentLang}
                    </button>

                    {user ? (
                        <>
                            <span className="user-email">
                                {user.email}
                            </span>
                            <button className="btn-signout" onClick={handleLogout}>
                                {t('logout') || "Sign out"}
                            </button>
                        </>
                    ) : (
                        <button className="btn-signin" onClick={handleLogin}>
                            <LogIn size={14} />
                            {t('login_google') || "Sign in"}
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
