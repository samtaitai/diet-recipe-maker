import React, { useState } from 'react';
import { useTranslation } from "react-i18next";

const DietForm = ({ onSubmit, isLoading }) => {
    const { t } = useTranslation();
    const [week, setWeek] = useState(1);
    const [ingredients, setIngredients] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(week, ingredients);
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px', margin: '0 auto' }}>
            <label>
                {t('week_label')}
                <select
                    value={week}
                    onChange={(e) => setWeek(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                >
                    <option value={1}>Week 1</option>
                    <option value={2}>Week 2</option>
                    <option value={3}>Week 3</option>
                    <option value={4}>Week 4</option>
                </select>
            </label>

            <label>
                {t('ingredients_label')}
                <textarea
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    placeholder={t('ingredients_placeholder')}
                    rows={4}
                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    required
                />
            </label>

            <button type="submit" disabled={isLoading} style={{ padding: '10px', fontSize: '1rem' }}>
                {isLoading ? t('generating') : t('generate_button')}
            </button>
        </form>
    );
};

export default DietForm;
