/**
 * INPUT COMPONENT
 * ====================================
 * Componente de input reutilizable con estados y variantes.
 * Soporta íconos, validación visual y diferentes tipos.
 */

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Label del input */
    label?: string;
    /** Mensaje de error */
    error?: string;
    /** Ícono a mostrar en el lado izquierdo */
    leftIcon?: React.ReactNode;
    /** Ícono a mostrar en el lado derecho */
    rightIcon?: React.ReactNode;
    /** Callback cuando se hace clic en el ícono derecho */
    onRightIconClick?: () => void;
    /** Ancho completo */
    fullWidth?: boolean;
}

/**
 * Componente Input con soporte para labels, errores e íconos.
 * 
 * @example
 * <Input
 *   label="Email"
 *   type="email"
 *   error={errors.email}
 *   leftIcon={<EnvelopeIcon className="h-5 w-5" />}
 * />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            leftIcon,
            rightIcon,
            onRightIconClick,
            fullWidth = true,
            className = '',
            ...props
        },
        ref
    ) => {
        return (
            <div className={`${fullWidth ? 'w-full' : ''}`}>
                {/* ────────────────────────────────────────────────────────
         🏷️ LABEL
        ──────────────────────────────────────────────────────── */}
                {label && (
                    <label
                        htmlFor={props.id}
                        className="block text-lg font-semibold text-slate-100 mb-2"
                    >
                        {label}
                    </label>
                )}

                {/* ────────────────────────────────────────────────────────
         📝 INPUT CONTAINER
        ──────────────────────────────────────────────────────── */}
                <div className="relative group">
                    {/* Ícono izquierdo */}
                    {leftIcon && (
                        <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-300 opacity-60 group-focus-within:text-brand-primary-400 group-focus-within:opacity-100 transition-all">
                            {leftIcon}
                        </span>
                    )}

                    {/* Input */}
                    <input
                        ref={ref}
                        className={`
              w-full px-4 py-3
              ${leftIcon ? 'pl-12' : ''}
              ${rightIcon ? 'pr-12' : ''}
              placeholder-zinc-400 
              bg-white/10 text-lg text-slate-100 
              border ${error ? 'border-error' : 'border-white/20'} 
              rounded-xl 
              focus:outline-none focus:ring-2 
              ${error ? 'focus:ring-error' : 'focus:ring-brand-primary-400'} 
              focus:border-transparent 
              placeholder-opacity-70 
              backdrop-blur-sm 
              transition-all duration-300 
              hover:bg-white/15
              ${className}
            `}
                        {...props}
                    />

                    {/* Ícono derecho */}
                    {rightIcon && (
                        <span
                            className={`
                absolute inset-y-0 right-4 flex items-center 
                text-slate-300 opacity-60 
                hover:text-brand-primary-400 hover:opacity-100 
                transition-all
                ${onRightIconClick ? 'cursor-pointer' : 'pointer-events-none'}
              `}
                            onClick={onRightIconClick}
                        >
                            {rightIcon}
                        </span>
                    )}
                </div>

                {/* ────────────────────────────────────────────────────────
         ❌ MENSAJE DE ERROR
        ──────────────────────────────────────────────────────── */}
                {error && (
                    <p className="mt-2 text-sm text-error animate-slideDown">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
