import React, { useState } from 'react';
import { useTranslation } from "react-i18next";

const DietForm = ({ onSubmit, isLoading }) => {
    const { t } = useTranslation();
    const [week, setWeek] = useState(1);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(week);
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px', margin: '2rem auto 0' }}>
            <label style={{ fontWeight: 600 }}>
                {t('week_label') || "Select Diet Week"}
                <select
                    value={week}
                    onChange={(e) => setWeek(Number(e.target.value))}
                    style={{
                        width: '100%',
                        padding: '12px',
                        marginTop: '8px',
                        borderRadius: '12px',
                        border: '1px solid #e7e5e4',
                        backgroundColor: '#ffffff',
                        fontSize: '1rem'
                    }}
                >
                    <option value={1}>{t('week_1') || "Week 1"}</option>
                    <option value={2}>{t('week_2') || "Week 2"}</option>
                    <option value={3}>{t('week_3') || "Week 3"}</option>
                    <option value={4}>{t('week_4') || "Week 4"}</option>
                </select>
            </label>

            <button
                type="submit"
                disabled={isLoading}
                className="btn-generate"
            >
                {isLoading ? (t('generating') || "Generating...") : (`✨ ${t('generate_button') || "Generate Recipe"}`)}
            </button>
        </form>
    );
};

export default DietForm;
