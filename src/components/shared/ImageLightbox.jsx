import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function ImageLightbox({ src, onClose }) {
    const { t } = useTranslation();
    return (
        <AnimatePresence>
            {src && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <button
                        className="absolute top-4 right-4 w-[44px] h-[44px] bg-white/20 rounded-full hover:bg-white/30 active:scale-95 transition-transform flex items-center justify-center flex-shrink-0"
                        onClick={onClose}
                        aria-label={t("close")}
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                    <motion.img
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        src={src}
                        alt={t("enlarged_image")}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
