import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarContainerProps {
  isOpen: boolean;
  onClose: () => void;
  side: 'left' | 'right';
  width?: string;
  children: ReactNode;
  title?: string;
  className?: string;
}

export default function SidebarContainer({
  isOpen,
  onClose,
  side,
  width = 'w-96',
  children,
  title,
  className = ''
}: SidebarContainerProps) {
  const slideDirection = side === 'left' ? '-100%' : '100%';
  const positionClass = side === 'left' ? 'left-0' : 'right-0';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: slideDirection }}
            animate={{ x: 0 }}
            exit={{ x: slideDirection }}
            transition={{ 
              type: "tween", 
              duration: 0.3,
              ease: [0.4, 0.0, 0.2, 1]
            }}
            className={`fixed top-0 ${positionClass} ${width} h-full bg-white border-${side === 'left' ? 'r' : 'l'} border-gray-200 z-50 flex flex-col ${className}`}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}