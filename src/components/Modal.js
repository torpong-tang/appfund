
"use client";
import React, { useEffect, useState } from "react";

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-2xl", className = "" }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            setShow(true);
        } else {
            document.body.style.overflow = "unset";
            const timer = setTimeout(() => setShow(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !show) return null;

    return (
        <div className={`modal-backdrop fixed inset-0 z-[9990] flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`glass-modal-content w-full ${maxWidth} p-8 relative flex flex-col shadow-2xl transition-all duration-200 transform ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"} ${className}`} style={{ maxHeight: '90vh' }}>
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h3 className="text-2xl font-black flex items-center gap-3 text-white">
                        {title}
                    </h3>
                    <button onClick={onClose} className="text-slate-300 hover:text-red-400 text-4xl transition-colors leading-none">&times;</button>
                </div>
                <div className="overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}
