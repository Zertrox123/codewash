import React from 'react';

const BugReportModal = ({ isOpen, onClose, t }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-stone-900 border-4 border-stone-600 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
                <div className="flex flex-col items-center text-center">
                    <h2 className="text-3xl font-bold text-slate-300 uppercase tracking-wider mb-4">{t('bugReport.title')}</h2>
                    <p className="text-stone-400 text-xl">{t('bugReport.subtitle')}</p>
                    <button
                        onClick={onClose}
                        className="mt-6 bg-stone-700 hover:bg-stone-600 text-white px-4 py-2 rounded border border-stone-500"
                    >
                        {t('bugReport.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BugReportModal;
