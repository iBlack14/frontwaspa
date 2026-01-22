import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  ShareIcon, 
  BookmarkIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon
} from '@heroicons/react/24/solid';

// Botón con micro-interacciones
export const InteractiveButton = ({ 
  children, 
  icon, 
  onClick, 
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        ${variants[variant]}
        ${sizes[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      animate={{
        boxShadow: isPressed ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)'
      }}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <motion.div
          className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
};

// Tarjeta con hover effects
export const AnimatedCard = ({ 
  children, 
  className = '',
  hover = true,
  tilt = false,
  ...props 
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!tilt) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0.5, y: 0.5 });
  };

  return (
    <motion.div
      className={`
        bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700
        transition-all duration-300
        ${hover ? 'hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-600' : ''}
        ${className}
      `}
      whileHover={hover ? { 
        y: -4,
        transition: { duration: 0.2 }
      } : {}}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={tilt ? {
        rotateX: (mousePosition.y - 0.5) * 10,
        rotateY: (mousePosition.x - 0.5) * -10,
      } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Botones de acción social con animaciones
export const ActionButtons = ({ 
  likes = 0, 
  comments = 0, 
  shares = 0, 
  isLiked = false, 
  isBookmarked = false,
  onLike, 
  onComment, 
  onShare, 
  onBookmark,
  onEdit,
  onDelete 
}) => {
  const [likeAnimation, setLikeAnimation] = useState(false);

  const handleLike = () => {
    setLikeAnimation(true);
    setTimeout(() => setLikeAnimation(false), 600);
    onLike?.();
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Like Button */}
      <motion.button
        onClick={handleLike}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg
          transition-all duration-200
          ${isLiked 
            ? 'text-red-600 bg-red-50 dark:bg-red-900/20' 
            : 'text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
          }
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={likeAnimation ? {
            scale: [1, 1.3, 1],
            rotate: [0, -10, 10, -10, 10, 0]
          } : {}}
          transition={{ duration: 0.6 }}
        >
          {isLiked ? (
            <HeartSolidIcon className="h-5 w-5" />
          ) : (
            <HeartIcon className="h-5 w-5" />
          )}
        </motion.div>
        <span className="text-sm font-medium">{likes}</span>
      </motion.button>

      {/* Comment Button */}
      <motion.button
        onClick={onComment}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChatBubbleLeftIcon className="h-5 w-5" />
        <span className="text-sm font-medium">{comments}</span>
      </motion.button>

      {/* Share Button */}
      <motion.button
        onClick={onShare}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
        whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
        whileTap={{ scale: 0.95 }}
      >
        <ShareIcon className="h-5 w-5" />
        <span className="text-sm font-medium">{shares}</span>
      </motion.button>

      {/* Bookmark Button */}
      <motion.button
        onClick={onBookmark}
        className={`
          p-2 rounded-lg transition-all duration-200
          ${isBookmarked 
            ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' 
            : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
          }
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isBookmarked ? (
          <BookmarkSolidIcon className="h-5 w-5" />
        ) : (
          <BookmarkIcon className="h-5 w-5" />
        )}
      </motion.button>

      {/* Edit Button */}
      {onEdit && (
        <motion.button
          onClick={onEdit}
          className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
          whileHover={{ scale: 1.05, rotate: 15 }}
          whileTap={{ scale: 0.95 }}
        >
          <PencilIcon className="h-5 w-5" />
        </motion.button>
      )}

      {/* Delete Button */}
      {onDelete && (
        <motion.button
          onClick={onDelete}
          className="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <TrashIcon className="h-5 w-5" />
        </motion.button>
      )}
    </div>
  );
};

// Input con animaciones
export const AnimatedInput = ({ 
  label, 
  error, 
  icon, 
  loading = false,
  className = '',
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <motion.label
          htmlFor={props.id}
          className={`
            block text-sm font-medium mb-2
            ${error ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}
          `}
          animate={{
            scale: isFocused ? 1.02 : 1
          }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {loading ? (
              <motion.div
                className="animate-spin h-5 w-5"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <ArrowPathIcon />
              </motion.div>
            ) : (
              icon
            )}
          </div>
        )}
        
        <motion.input
          {...props}
          className={`
            w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2
            transition-all duration-200
            ${icon ? 'pl-10' : ''}
            ${error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
            }
            ${isFocused ? 'shadow-lg' : 'shadow-sm'}
            bg-white dark:bg-gray-900 text-gray-900 dark:text-white
          `}
          animate={{
            borderColor: isFocused ? '#3B82F6' : error ? '#EF4444' : '#D1D5DB'
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          whileFocus={{
            scale: 1.01,
            transition: { duration: 0.2 }
          }}
        />
      </div>
      
      {error && (
        <motion.p
          className="mt-1 text-sm text-red-600"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

// Switch animado
export const AnimatedSwitch = ({ 
  checked, 
  onChange, 
  disabled = false, 
  size = 'md',
  label 
}) => {
  const sizes = {
    sm: 'w-8 h-4',
    md: 'w-11 h-6',
    lg: 'w-14 h-8'
  };

  const dotSizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <label className="flex items-center cursor-pointer">
      <motion.div
        className={`
          relative rounded-full transition-colors duration-200
          ${sizes[size]}
          ${checked 
            ? 'bg-blue-600' 
            : 'bg-gray-300 dark:bg-gray-600'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !disabled && onChange(!checked)}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
      >
        <motion.div
          className={`
            absolute top-0.5 left-0.5 bg-white rounded-full shadow-md
            ${dotSizes[size]}
          `}
          animate={{
            x: checked 
              ? size === 'sm' ? 16 : size === 'md' ? 20 : 24
              : 0
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.div>
      
      {label && (
        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
    </label>
  );
};

export default {
  InteractiveButton,
  AnimatedCard,
  ActionButtons,
  AnimatedInput,
  AnimatedSwitch
};
