import React, { useState } from 'react';
import { useTranslation } from "react-i18next";

const DietForm = ({ week, onWeekChange, onSubmit, isLoading, hasIngredients, isLoggedIn }) => {
    const { t } = useTranslation();

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(week);
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px', margin: '2rem auto 0' }}>
            <label className="form-label-native">
                {t('week_label') || "Select Diet Week"}
                <select
                    value={week}
                    onChange={(e) => onWeekChange(Number(e.target.value))}
                    className="form-select-native"
                >
                    <option value={1}>{t('week_1') || "Week 1"}</option>
                    <option value={2}>{t('week_2') || "Week 2"}</option>
                    <option value={3}>{t('week_3') || "Week 3"}</option>
                    <option value={4}>{t('week_4') || "Week 4"}</option>
                </select>
            </label>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                {isLoggedIn && (
                    <button
                        type="button"
                        onClick={() => onSubmit(week, false)}
                        disabled={isLoading}
                        className="btn-generate"
                        style={{ flex: 1, marginTop: 0 }}
                    >
                        {isLoading ? (t('generating') || "Generating...") : (`✨ ${t('generate_button') || "Generate Recipe"}`)}
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => onSubmit(week, true)}
                    disabled={isLoading || hasIngredients}
                    className="btn-generate btn-chef"
                    style={{ flex: 1, marginTop: 0 }}
                >
                    {isLoading ? (t('generating') || "Generating...") : (`🧑‍🍳 ${t('chef_button') || "Chef, up to you"}`)}
                </button>
            </div>
        </form>
    );
};

export default DietForm;
