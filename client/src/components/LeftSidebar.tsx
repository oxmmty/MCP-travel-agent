import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, Compass, Bookmark, Bell, Lightbulb, PlusCircle, Route, Settings, Plus, Grid3X3, Luggage, ChevronLeft, Globe, MapPin, Navigation, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Chat } from "@shared/schema";

interface LeftSidebarProps {
  onNewChat: () => void;
  onChatSelect: (chatId: number) => void;
  selectedChatId?: number;
  isCollapsed?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  onChatOverlayToggle?: () => void;
  isChatOverlayOpen?: boolean;
}

export default function LeftSidebar({ onNewChat, onChatSelect, selectedChatId, isCollapsed = false, onExpand, onCollapse, onChatOverlayToggle, isChatOverlayOpen = false }: LeftSidebarProps) {
  const { t, i18n } = useTranslation();
  const { user, logoutMutation } = useAuth();

  const [location, navigate] = useLocation();



  const languages = [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' }
  ];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const { data: chats = [] } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
  });

  // Generate user initials
  const getUserInitials = (firstName?: string | null, lastName?: string | null, email?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  // Generate display name
  const getDisplayName = (user?: any): string => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) return user.firstName;
    if (user?.lastName) return user.lastName;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const navigationItems = [
    { icon: MessageSquare, label: t("chats"), badge: chats.length, active: location === "/" || isChatOverlayOpen, enabled: true, onClick: () => { navigate("/"); onChatOverlayToggle?.(); } },
    { icon: Compass, label: t("explore"), enabled: false },
    { icon: Bookmark, label: t("saved"), active: location === "/saved", enabled: true, onClick: () => navigate("/saved") },
    { icon: Luggage, label: t("Trips"), enabled: false },
    { icon: Bell, label: t("updates"), enabled: false },
    { icon: Lightbulb, label: t("inspiration"), enabled: false },
    { icon: PlusCircle, label: t("create"), enabled: false }
  ];



  if (isCollapsed) {
    return (
      <TooltipProvider>
        <div className="w-full h-full bg-background border-r border-border flex flex-col">
          {/* Header - Collapsed with Icon Only */}
          <div className="p-3 flex items-center justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onExpand}
                  className="p-2 rounded-lg hover:bg-muted transition-colors group"
                >
                  <Navigation className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                <span className="font-semibold">takemeto</span>
              </TooltipContent>
            </Tooltip>
          </div>
          
          {/* Navigation - Collapsed Icons Only */}
          <nav className="px-2 space-y-2">
            {navigationItems.map((item, index) => (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <button
                    onClick={item.onClick}
                    disabled={!item.enabled}
                    className={`relative flex items-center justify-center w-full h-12 rounded-lg transition-colors group ${
                      item.enabled 
                        ? `text-foreground hover:bg-muted ${item.active ? 'bg-primary/10 border-l-4 border-primary text-primary' : ''}` 
                        : 'text-muted-foreground opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.badge && item.enabled && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-medium">{item.badge}</span>
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ))}
            
            {/* New Chat Button - Collapsed */}
            <div className="mt-4 pt-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={onNewChat}
                    className="w-full h-12 btn-primary px-0"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {t("newChat")}
                </TooltipContent>
              </Tooltip>
            </div>
          </nav>

          {/* Vertical Logo - bottom aligned */}
          <div className="flex-1 relative">
            <div 
              className="absolute left-1/2 bottom-8"
              style={{ 
                transform: 'translateX(-50%) rotate(270deg)',
                transformOrigin: 'center center',
                fontSize: '24px',
                fontWeight: '700',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(90deg, #E85A4F 0%, #C4527A 40%, #8B4AA3 70%, #5B7BD6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                whiteSpace: 'nowrap',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              takemeto
            </div>
          </div>

          {/* Language Selector - Collapsed */}
          <div className="p-2">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  {languages.find(l => l.code === i18n.language)?.label}
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent side="right" className="ml-2">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={i18n.language === lang.code ? 'bg-muted' : ''}
                  >
                    <span>{lang.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Profile - Collapsed */}
          <div className="p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                    <span className="text-primary-foreground text-sm font-medium">
                      {getUserInitials(user?.firstName, user?.lastName, user?.email)}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                <div>
                  <p className="font-medium">{getDisplayName(user)}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || "user@example.com"}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="w-full h-full bg-background border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-center relative group">
          <img
            src="/takemeto-logo.svg"
            alt="takemeto"
            className="h-8 w-auto"
          />
          {/* Collapse Arrow - appears on hover */}
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="absolute -right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
              title="Sidebar zusammenklappen"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      
      {/* Navigation - Takes remaining space */}
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {navigationItems.map((item, index) => (
          <button
            key={item.label}
            onClick={item.onClick}
            disabled={!item.enabled}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group w-full text-left ${
              item.enabled 
                ? `text-foreground hover:bg-muted ${item.active ? 'bg-muted' : ''}` 
                : 'text-muted-foreground opacity-50 cursor-not-allowed'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium flex-1">{item.label}</span>
            {item.badge && item.enabled && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </button>
        ))}
        
        {/* New Chat Button at end of navigation */}
        <div className="mt-4 pt-4">
          <Button 
            onClick={onNewChat}
            className="btn-primary w-full px-3 py-2 text-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("newChat")}
          </Button>
        </div>
      </nav>

      {/* Language Selector - Expanded */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full gap-2 justify-start bg-transparent hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm font-normal flex items-center">
            <Globe className="h-4 w-4" />
            {languages.find(l => l.code === i18n.language)?.label}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={i18n.language === lang.code ? 'bg-muted' : ''}
              >
                <span>{lang.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* User Profile - Fixed at bottom */}
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-medium">
              {user ? getUserInitials(user.firstName, user.lastName, user.email) : "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {getDisplayName(user)}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.email || "user@example.com"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  logoutMutation.mutate();
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? t("loggingOut") : t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}