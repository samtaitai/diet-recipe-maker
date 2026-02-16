import React, { forwardRef } from 'react';
import RecipeQRCode from './RecipeQRCode';
import '../styles/print.css';

const PrintView = forwardRef(({ recipe, activeLanguage }, ref) => {
    if (!recipe) return null;

    return (
        <div className="print-view-container" id="recipe-print-view">
            <header className="print-header" style={{ borderBottom: '2px solid #1a1a1a', paddingBottom: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '28pt', margin: '0 0 5pt 0', color: '#000' }}>{recipe.title}</h1>
                        {recipe.health_benefit && (
                            <p style={{ fontSize: '14pt', color: '#059669', fontStyle: 'italic', margin: 0 }}>
                                {recipe.health_benefit}
                            </p>
                        )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '10pt', color: '#666', textTransform: 'uppercase' }}>
                            Switch-On Diet Journal
                        </span>
                    </div>
                </div>

                <div className="meta-row" style={{ display: 'flex', gap: '20pt', marginTop: '15pt', color: '#444', fontSize: '10pt', textTransform: 'uppercase' }}>
                    {recipe.prep_time && <span>🕒 Prep: {recipe.prep_time}</span>}
                    {recipe.cook_time && <span>🍳 Cook: {recipe.cook_time}</span>}
                    {recipe.servings && <span>👥 Serves: {recipe.servings}</span>}
                    <span>🌐 Lang: {activeLanguage === 'ko' ? '한국어' : 'English'}</span>
                </div>
            </header>

            <section className="macros-section" style={{ marginBottom: '30px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15pt' }}>
                    {recipe.macros && Object.entries(recipe.macros).map(([key, val]) => (
                        <div key={key} className="macro-card" style={{ border: '1px solid #ddd', padding: '10pt', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: '8pt', color: '#666', textTransform: 'uppercase', marginBottom: '4pt' }}>{key}</span>
                            <strong style={{ display: 'block', fontSize: '14pt', color: '#000' }}>{val}</strong>
                        </div>
                    ))}
                </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30pt' }}>
                <section className="ingredients-section">
                    <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5pt', marginBottom: '10pt' }}>Ingredients</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {recipe.ingredients?.map((item, idx) => (
                            <li key={idx} style={{ padding: '4pt 0', borderBottom: '1px solid #fafafa', fontSize: '11pt' }}>
                                {item}
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="instructions-section">
                    <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5pt', marginBottom: '10pt' }}>Instructions</h3>
                    <ol style={{ paddingLeft: '15pt' }}>
                        {recipe.instructions?.map((step, idx) => (
                            <li key={idx} className="instruction-step" style={{ marginBottom: '12pt', paddingLeft: '5pt', fontSize: '11pt' }}>
                                {step}
                            </li>
                        ))}
                    </ol>
                </section>
            </div>

            {recipe.wellness_tip && (
                <section className="wellness-section" style={{ marginTop: '30px', padding: '15pt', border: '1px solid #10b981', background: '#f0fdf4' }}>
                    <h4 style={{ color: '#047857', margin: '0 0 5pt 0', fontSize: '12pt' }}>✨ Wellness Tip</h4>
                    <p style={{ margin: 0, color: '#065f46', fontSize: '11pt', lineHeight: '1.5' }}>{recipe.wellness_tip}</p>
                </section>
            )}

            <footer style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '9pt', color: '#999' }}>
                    Generated on {new Date().toLocaleDateString()} • © Switch-On Diet
                </div>
                <RecipeQRCode recipeId={recipe.id} />
            </footer>
        </div>
    );
});

export default PrintView;
