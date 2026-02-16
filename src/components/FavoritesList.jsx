import React from 'react';
import { useTranslation } from 'react-i18next';

const FavoritesList = ({ favorites, onSelect, onDelete, isLoading }) => {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className="favorites-panel">
                <h3 className="favorites-title">
                    <span className="favorites-icon">♥</span> {t('favorites_title')}
                </h3>
                <div className="favorites-loading">
                    <div className="favorites-loading-spinner" />
                    <p>{t('favorites_loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="favorites-panel">
            <h3 className="favorites-title">
                <span className="favorites-icon">♥</span> {t('favorites_title')}
            </h3>

            {(!favorites || favorites.length === 0) ? (
                <div className="favorites-empty">
                    <span className="favorites-empty-icon">🍽️</span>
                    <p>{t('favorites_empty')}</p>
                    <p className="favorites-empty-hint">{t('favorites_empty_hint')}</p>
                </div>
            ) : (
                <div className="favorites-grid">
                    {favorites.map((fav, idx) => (
                        <div
                            key={fav.id}
                            className="favorite-card animate-fade-up"
                            style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                            <div
                                className="favorite-card-body"
                                onClick={() => onSelect(fav)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && onSelect(fav)}
                            >
                                <div className="favorite-card-header">
                                    <h4 className="favorite-card-title">{fav.recipe_title}</h4>
                                    {fav.week && (
                                        <span className="favorite-card-week">
                                            {t('week_label')} {fav.week}
                                        </span>
                                    )}
                                </div>

                                {fav.recipe_content?.health_benefit && (
                                    <p className="favorite-card-benefit">
                                        {fav.recipe_content.health_benefit}
                                    </p>
                                )}

                                <div className="favorite-card-meta">
                                    {fav.recipe_content?.macros?.calories && (
                                        <span className="favorite-card-macro">
                                            🔥 {fav.recipe_content.macros.calories}
                                        </span>
                                    )}
                                    {fav.recipe_content?.prep_time && (
                                        <span className="favorite-card-macro">
                                            🕒 {fav.recipe_content.prep_time}
                                        </span>
                                    )}
                                    {fav.created_at && (
                                        <span className="favorite-card-date">
                                            {new Date(fav.created_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                className="favorite-card-delete"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(fav.id);
                                }}
                                title={t('favorites_remove')}
                                aria-label={`${t('favorites_remove')} ${fav.recipe_title}`}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FavoritesList;
