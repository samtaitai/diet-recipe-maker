import React from 'react';
import { useTranslation } from "react-i18next";

const RecipeDisplay = ({ recipe, onDownloadPdf, onSaveFavorite, isFavorited, isSaving, isLoggedIn }) => {
  const { t } = useTranslation();

  if (!recipe) return null;

  const handleSaveClick = () => {
    if (!isLoggedIn) {
      alert(t('signin_to_save') || "Sign in to save this recipe");
      return;
    }
    onSaveFavorite();
  };

  const shareText = encodeURIComponent(`Check out this recipe: ${recipe.title} #SwitchOnDiet`);
  const shareUrl = "https://twitter.com/intent/tweet?text=" + shareText;

  return (
    <div className="recipe-display" style={{ marginTop: '2rem', padding: '2rem', maxWidth: '800px', margin: '2rem auto', position: 'relative' }}>
      {/* US-6: Floating Favourite Button */}
      <button
        className={`favorite-float-btn ${isFavorited ? 'favorited' : ''} ${!isLoggedIn ? 'logged-out' : ''}`}
        onClick={handleSaveClick}
        disabled={isSaving || isFavorited}
        title={!isLoggedIn ? t('signin_to_save') : (isFavorited ? t('favorites_saved') : t('favorites_save'))}
        aria-label={isFavorited ? t('favorites_saved') : t('favorites_save')}
      >
        <span className="favorite-float-icon">{isFavorited ? '♥' : '♡'}</span>
        <span className="favorite-float-label">{isFavorited ? t('favorites_saved') : t('favorites_save')}</span>
      </button>

      <header style={{ textAlign: 'center', marginBottom: '2rem', paddingTop: '2.5rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#1c1917' }}>{recipe.title}</h2>
        {recipe.health_benefit && (
          <p style={{ fontSize: '1.2rem', color: '#10b981', fontStyle: 'italic', margin: 0 }}>
            {recipe.health_benefit}
          </p>
        )}

        <div className="meta-row" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem', color: '#78716c', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {recipe.prep_time && <span>🕒 Prep: {recipe.prep_time}</span>}
          {recipe.cook_time && <span>🍳 Cook: {recipe.cook_time}</span>}
          {recipe.servings && <span>👥 Serves: {recipe.servings}</span>}
        </div>
      </header>

      {recipe.macros && (
        <div className="macro-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {Object.entries(recipe.macros).map(([key, val]) => (
            <div key={key} className="macro-card" style={{ background: '#fafaf9', padding: '1rem', borderRadius: '16px', textAlign: 'center', border: '1px solid #e7e5e4' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#78716c', textTransform: 'uppercase' }}>{key}</span>
              <strong style={{ display: 'block', fontSize: '1.2rem', color: '#10b981' }}>
                {typeof val === 'string'
                  ? val.split(' ').map(word => (word.length > 5 && !/\d/.test(word)) ? 'About' : word).join(' ')
                  : val}
              </strong>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', md: { gridTemplateColumns: '1fr 2fr' }, gap: '2rem' }}>
        <div>
          <h3>Ingredients</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {Array.isArray(recipe.ingredients) ? (
              recipe.ingredients.map((item, idx) => (
                <li key={idx} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f5f5f4' }}>{item}</li>
              ))
            ) : (
              <li style={{ padding: '0.5rem 0' }}>{recipe.ingredients || "No ingredients listed."}</li>
            )}
          </ul>
        </div>

        <div>
          <h3>Instructions</h3>
          <ol style={{ paddingLeft: '1.5rem' }}>
            {Array.isArray(recipe.instructions) ? (
              recipe.instructions.map((step, idx) => (
                <li key={idx} style={{ marginBottom: '1rem', paddingLeft: '0.5rem' }}>{step}</li>
              ))
            ) : (
              <li>{recipe.instructions || "No instructions provided."}</li>
            )}
          </ol>
        </div>
      </div>

      {recipe.wellness_tip && (
        <div className="wellness-tip" style={{ background: '#ecfdf5', padding: '1.5rem', borderRadius: '16px', marginTop: '2rem', border: '1px solid #10b981' }}>
          <h4 style={{ color: '#047857', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ✨ Switch-On Wellness Tip
          </h4>
          <p style={{ margin: 0, color: '#065f46' }}>{recipe.wellness_tip}</p>
        </div>
      )}

      <div className="actions" style={{ display: 'flex', gap: '10px', marginTop: '2rem', justifyContent: 'center' }}>
        <button onClick={onDownloadPdf}>{t('print_pdf')}</button>
        <a href={shareUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '0.6em 1.2em', backgroundColor: '#10b981', color: 'white', textDecoration: 'none', borderRadius: '9999px', fontWeight: 500, fontSize: '0.9em' }}>
          {t('share')}
        </a>
      </div>

    </div>
  );
};

export default RecipeDisplay;
