import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Building2, 
  UtensilsCrossed, 
  Camera, 
  ShoppingBag, 
  TreePine,
  Coffee,
  Car
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ActionIconsProps {
  onActionClick: (action: string) => void;
  disabled?: boolean;
}

export default function ActionIcons({ onActionClick, disabled = false }: ActionIconsProps) {
  const { t } = useTranslation();
  
  // Categories that are currently not working
  const disabledCategories = ['shopping', 'parks', 'cafes', 'transport'];
  
  const actions = [
    { id: 'hotels', icon: Building2, color: 'bg-blue-100 hover:bg-blue-200 text-blue-700', disabled: false },
    { id: 'restaurants', icon: UtensilsCrossed, color: 'bg-orange-100 hover:bg-orange-200 text-orange-700', disabled: false },
    { id: 'attractions', icon: Camera, color: 'bg-purple-100 hover:bg-purple-200 text-purple-700', disabled: false },
    { id: 'shopping', icon: ShoppingBag, color: 'bg-pink-100 hover:bg-pink-200 text-pink-700', disabled: true },
    { id: 'parks', icon: TreePine, color: 'bg-green-100 hover:bg-green-200 text-green-700', disabled: true },
    { id: 'cafes', icon: Coffee, color: 'bg-amber-100 hover:bg-amber-200 text-amber-700', disabled: true },
    { id: 'transport', icon: Car, color: 'bg-gray-100 hover:bg-gray-200 text-gray-700', disabled: true },
    { id: 'nearby', icon: MapPin, color: 'bg-red-100 hover:bg-red-200 text-red-700', disabled: false },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-white/95 backdrop-blur-sm shadow-lg w-full justify-center">
      {actions.map((action) => {
        const IconComponent = action.icon;
        const isDisabled = disabled || action.disabled;
        const colorClass = action.disabled 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : action.color;
        
        return (
          <Button
            key={action.id}
            variant="ghost"
            size="sm"
            disabled={isDisabled}
            onClick={() => !action.disabled && onActionClick(action.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              action.disabled ? '' : 'hover:scale-105'
            } ${colorClass} border border-transparent ${
              action.disabled ? '' : 'hover:border-current/20'
            }`}
          >
            <IconComponent className="h-3.5 w-3.5" />
            {t(`actionIcons.${action.id}`)}
          </Button>
        );
      })}
    </div>
  );
}