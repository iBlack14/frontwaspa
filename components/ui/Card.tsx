/**
 * CARD COMPONENT
 * ====================================
 * Componente de tarjeta reutilizable con efecto glassmorphism.
 * Perfecto para agrupar contenido con un estilo premium.
 */

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
    /** Contenido de la tarjeta */
    children: React.ReactNode;
    /** Variante de glassmorphism */
    variant?: 'light' | 'medium' | 'dark';
    /** Padding interno */
    padding?: 'none' | 'sm' | 'md' | 'lg';
    /** Muestra un hover effect */
    hoverable?: boolean;
    /** Clases CSS adicionales */
    className?: string;
    /** Callback al hacer clic */
    onClick?: () => void;
}

/**
 * Componente Card con efecto glassmorphism y animaciones.
 * 
 * @example
 * <Card variant="medium" padding="lg" hoverable>
 *   <h2>Título</h2>
 *   <p>Contenido de la tarjeta</p>
 * </Card>
 */
export const Card: React.FC<CardProps> = ({
    children,
    variant = 'medium',
    padding = 'md',
    hoverable = false,
    className = '',
    onClick,
}) => {
    // ────────────────────────────────────────────────────────
    // 🎨 VARIANTES DE GLASSMORPHISM
    // ────────────────────────────────────────────────────────
    const variantStyles = {
        light: 'bg-white/5 border-white/10',
        medium: 'bg-white/10 border-white/20',
        dark: 'bg-black/20 border-white/10',
    };

    // ────────────────────────────────────────────────────────
    // 📏 PADDING
    // ────────────────────────────────────────────────────────
    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    // ────────────────────────────────────────────────────────
    // 🔨 CONSTRUIR CLASES
    // ────────────────────────────────────────────────────────
    const baseStyles = `
    backdrop-blur-xl rounded-3xl border
    shadow-2xl shadow-black/50
    ${hoverable ? 'cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-glow' : ''}
  `;

    const cardClasses = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${paddingStyles[padding]}
    ${className}
  `.replace(/\s+/g, ' ').trim();

    return (
        <motion.div
            className={cardClasses}
            onClick={onClick}
            initial={hoverable ? { opacity: 0, y: 20 } : undefined}
            animate={hoverable ? { opacity: 1, y: 0 } : undefined}
            whileHover={hoverable ? { y: -5 } : undefined}
            transition={{ duration: 0.3 }}
        >
            {children}
        </motion.div>
    );
};
