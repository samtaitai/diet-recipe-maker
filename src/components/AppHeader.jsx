import { useState, useRef, useEffect } from "react";
import { Globe, LogIn, Heart, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";

const AppHeader = ({ user }) => {
    const { t, i18n } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

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
            setIsMenuOpen(false);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const toggleLanguage = () => {
        const nextLang = i18n.language === 'en' ? 'ko' : 'en';
        i18n.changeLanguage(nextLang);
    };

    const scrollToFavorites = () => {
        const element = document.querySelector(".favorites-panel");
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
        setIsMenuOpen(false);
    };

    const currentLang = i18n.language.toUpperCase();

    const getInitials = (email) => {
        if (!email) return "?";
        return email[0].toUpperCase();
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="app-header">
            <div className="app-header-container">
                {/* App name */}
                <div className="app-header-logo">
                    <span className="app-header-logo-icon">🥗</span>
                    <span className="app-header-logo-text">
                        {t('app_title') || "Switch-On Diet"}
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
                        <div className="user-profile-container" ref={menuRef}>
                            <button
                                className="user-avatar"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                title={user.email}
                            >
                                {getInitials(user.email)}
                            </button>

                            {isMenuOpen && (
                                <div className="user-dropdown-menu animate-fade-up">
                                    <div className="dropdown-header">
                                        <span className="dropdown-email">{user.email}</span>
                                    </div>
                                    <button className="dropdown-item" onClick={scrollToFavorites}>
                                        <Heart size={16} />
                                        {t('favorites_title') || "Favourites"}
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item logout" onClick={handleLogout}>
                                        <LogOut size={16} />
                                        {t('logout') || "Sign out"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className="btn-signin" onClick={handleLogin}>
                            <LogIn size={14} />
                            <span className="btn-signin-text">{t('login_google') || "Sign in"}</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
