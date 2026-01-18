import React from 'react';
import { useTranslation } from "react-i18next";

const RecipeDisplay = ({ recipe, onDownloadPdf }) => {
  const { t } = useTranslation();

  if (!recipe) return null;

  const shareText = encodeURIComponent(`Check out this recipe: ${recipe.title} #SwitchOnDiet`);
  const shareUrl = "https://twitter.com/intent/tweet?text=" + shareText;

  return (
    <div className="recipe-display" style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #444', borderRadius: '8px' }}>
      <h2>{recipe.title}</h2>

      <h3>Ingredients</h3>
      <ul>
        {recipe.ingredients?.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>

      <h3>Instructions</h3>
      <ol>
        {recipe.instructions?.map((step, idx) => (
          <li key={idx}>{step}</li>
        ))}
      </ol>

      {recipe.macros && (
        <div className="macros">
          <h3>Macros</h3>
          <ul>
            {Object.entries(recipe.macros).map(([key, val]) => (
              <li key={key}><strong>{key}:</strong> {val}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="actions" style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
        <button onClick={onDownloadPdf}>{t('print_pdf')}</button>
        <a href={shareUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '0.6em 1.2em', backgroundColor: '#1DA1F2', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          {t('share')}
        </a>
      </div>
    </div>
  );
};

export default RecipeDisplay;
