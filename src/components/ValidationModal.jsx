import React from 'react';
import { useTranslation } from "react-i18next";

const ValidationModal = ({ results, onProceed, onCancel }) => {
    const { t } = useTranslation();
    const { prohibited, unknown } = results;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>⚠️ {t('validation_warning_title') || "Recipe Compliance Check"}</h2>
                </div>

                <div className="modal-body">
                    <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        {t('validation_warning_desc') || "Some ingredients you entered are not fully compliant with the diet rules for this week."}
                    </p>

                    {prohibited.length > 0 && (
                        <div className="warning-section">
                            <h3 className="warning-title prohibited-title">
                                🚫 {t('prohibited_ingredients') || "Prohibited Ingredients"}
                            </h3>
                            <ul className="warning-list">
                                {prohibited.map((ing, i) => (
                                    <li key={i} className="warning-item" style={{ borderColor: 'hsl(0 84% 60% / 0.3)', background: 'hsl(0 84% 60% / 0.05)' }}>
                                        {ing}
                                    </li>
                                ))}
                            </ul>
                            <p style={{ fontSize: '0.75rem', color: 'hsl(0 84% 60%)', marginTop: '0.5rem' }}>
                                {t('prohibited_hint') || "These items are strictly forbidden in this phase."}
                            </p>
                        </div>
                    )}

                    {unknown.length > 0 && (
                        <div className="warning-section">
                            <h3 className="warning-title unknown-title">
                                ❓ {t('unknown_ingredients') || "Not Explicitly Allowed"}
                            </h3>
                            <ul className="warning-list">
                                {unknown.map((ing, i) => (
                                    <li key={i} className="warning-item" style={{ borderColor: 'hsl(38 92% 50% / 0.3)', background: 'hsl(38 92% 50% / 0.05)' }}>
                                        {ing}
                                    </li>
                                ))}
                            </ul>
                            <p style={{ fontSize: '0.75rem', color: 'hsl(38 92% 50%)', marginTop: '0.5rem' }}>
                                {t('unknown_hint') || "These might not be part of the Switch-On program rules."}
                            </p>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-proceed" onClick={onProceed}>
                        {t('generate_anyway') || "Generate Anyway"}
                    </button>
                    <button className="btn-cancel" onClick={onCancel}>
                        {t('cancel_and_edit') || "Cancel and Edit"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ValidationModal;
