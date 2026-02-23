import React from 'react';
import { useTranslation } from "react-i18next";

const DeactivateModal = ({ onConfirm, onCancel, isLoading }) => {
    const { t } = useTranslation();

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>⚠️ {t('deactivate_title')}</h2>
                </div>

                <div className="modal-body">
                    <p style={{
                        fontSize: '0.925rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '1.5rem',
                        lineHeight: '1.6'
                    }}>
                        {t('deactivate_warning')}
                    </p>
                </div>

                <div className="modal-footer">
                    <button
                        className="btn-deactivate-confirm"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            if (!isLoading) onConfirm();
                        }}
                        disabled={isLoading}
                    >
                        {isLoading ? t('deactivating') : t('deactivate_confirm')}
                    </button>
                    <button
                        className="btn-cancel"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        {t('deactivate_cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeactivateModal;
