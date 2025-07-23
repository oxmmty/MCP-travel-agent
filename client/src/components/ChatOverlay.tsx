import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Plus, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Chat } from "@shared/schema";

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onChatSelect: (chatId: number) => void;
  selectedChatId?: number;
  isSidebarExpanded?: boolean;
}

export default function ChatOverlay({ 
  isOpen, 
  onClose, 
  onNewChat, 
  onChatSelect, 
  selectedChatId,
  isSidebarExpanded = false
}: ChatOverlayProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "trips">("all");

  const { data: chats = [] } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
  });

  // Filter chats based on search query
  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group chats by date
  const groupChatsByDate = (chats: Chat[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const recent = chats.filter(chat => new Date(chat.updatedAt) >= today);
    const lastMonthChats = chats.filter(chat => {
      const chatDate = new Date(chat.updatedAt);
      return chatDate < today && chatDate >= lastMonth;
    });
    const older = chats.filter(chat => new Date(chat.updatedAt) < lastMonth);

    return { recent, lastMonth: lastMonthChats, older };
  };

  const { recent, lastMonth, older } = groupChatsByDate(filteredChats);

  const handleChatClick = (chatId: number) => {
    onChatSelect(chatId);
    onClose();
  };

  const handleNewChatClick = () => {
    onNewChat();
    onClose();
  };

  // Calculate positions based on sidebar state
  const sidebarWidth = isSidebarExpanded ? 288 : 64; // w-72 = 288px, w-16 = 64px
  const overlayLeft = isSidebarExpanded ? 288 : 64;
  const backdropLeft = isSidebarExpanded ? 608 : 384; // sidebar + overlay width

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - starts after the sidebar + overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed top-0 right-0 bottom-0 bg-black/20 z-[999]"
            style={{ left: `${backdropLeft}px` }}
            onClick={onClose}
          />
          
          {/* Chat Overlay - seamlessly attached to sidebar */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
            className="fixed top-0 bottom-0 w-80 bg-background border-r border-border z-[1000] flex flex-col"
            style={{
              left: `${overlayLeft}px`,
              boxShadow: "4px 0 12px rgba(0, 0, 0, 0.1)"
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">{t("chats")}</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* New Chat Button */}
              <Button 
                onClick={handleNewChatClick}
                className="btn-primary w-full mb-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("newChat")}
              </Button>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chat titles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="p-4 border-b border-border">
              <div className="flex space-x-1 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "all"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
All
                </button>
                <button
                  onClick={() => setActiveTab("trips")}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "trips"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
Trips
                </button>
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 px-4">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{searchQuery ? "No chats found" : t("noMessages")}</p>
                  <p className="text-sm mt-1">
                    {searchQuery ? "Try different keywords" : t("startConversation")}
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-6">
                  {/* Recent */}
                  {recent.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Recent
                      </h3>
                      <div className="space-y-2">
                        {recent.map((chat) => (
                          <div
                            key={chat.id}
                            onClick={() => handleChatClick(chat.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                              selectedChatId === chat.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground truncate text-sm">
                                  {chat.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(chat.updatedAt).toLocaleDateString()} • {chat.language.toUpperCase()}
                                </p>
                              </div>
                              <MessageSquare className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last Month */}
                  {lastMonth.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Last Month
                      </h3>
                      <div className="space-y-2">
                        {lastMonth.map((chat) => (
                          <div
                            key={chat.id}
                            onClick={() => handleChatClick(chat.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                              selectedChatId === chat.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground truncate text-sm">
                                  {chat.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(chat.updatedAt).toLocaleDateString()} • {chat.language.toUpperCase()}
                                </p>
                              </div>
                              <MessageSquare className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Older */}
                  {older.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Older
                      </h3>
                      <div className="space-y-2">
                        {older.map((chat) => (
                          <div
                            key={chat.id}
                            onClick={() => handleChatClick(chat.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                              selectedChatId === chat.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground truncate text-sm">
                                  {chat.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(chat.updatedAt).toLocaleDateString()} • {chat.language.toUpperCase()}
                                </p>
                              </div>
                              <MessageSquare className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}