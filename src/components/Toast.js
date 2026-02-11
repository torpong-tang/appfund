
"use client";
import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!message) return null;

    return (
        <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 px-10 py-5 glass-panel text-white rounded-[3rem] shadow-2xl z-[10050] transition-all font-black border-2 border-white/40 text-lg flex items-center gap-3 animate-bounce">
            {type === 'success' ? <i className="fas fa-check-circle text-emerald-400"></i> : <i className="fas fa-exclamation-circle text-red-400"></i>}
            <span>{message}</span>
        </div>
    );
}
