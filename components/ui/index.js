// Exportaciones principales de componentes UI mejorados
export { default as SkeletonLoader, MessageSkeleton, ContactSkeleton, DashboardSkeleton } from './SkeletonLoader';
export { 
  ToastProvider, 
  useToast, 
  toast 
} from './Toast';
export { 
  ThemeProvider, 
  ThemeToggle, 
  Card, 
  Button 
} from './Theme';
export { 
  Modal, 
  Dropdown, 
  Accordion, 
  Tooltip, 
  useFocusTrap 
} from './Accessibility';
export { 
  InteractiveButton, 
  AnimatedCard, 
  ActionButtons, 
  AnimatedInput, 
  AnimatedSwitch 
} from './MicroInteractions';

// Configuración recomendada para _app.js
export const setupUIProviders = ({ children }) => {
  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
};
