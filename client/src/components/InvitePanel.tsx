import React, { useState, useRef, useEffect } from 'react';
import { X, Copy, Lock, Link, Users, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useTripPlanning } from '@/contexts/TripPlanningContext';
import { useTranslation } from 'react-i18next';

interface InvitePanelProps {
  isOpen: boolean;
  onClose: () => void;
  tripTitle?: string;
  tripDuration?: string;
  tripImage?: string;
  tripPlanId?: number;
}

interface InvitedPerson {
  id: number;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
  accessLevel: string;
  createdAt: string;
}

interface SharingSettings {
  id: number;
  tripPlanId: number;
  accessLevel: string;
  allowAnonymousAccess: boolean;
  accessToken: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function InvitePanel({ 
  isOpen, 
  onClose, 
  tripTitle = "Your Amazing Trip",
  tripDuration = "5 days",
  tripImage = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=200&fit=crop",
  tripPlanId
}: InvitePanelProps) {
  const [emailInput, setEmailInput] = useState('');
  const [emailTags, setEmailTags] = useState<string[]>([]);
  const [accessLevel, setAccessLevel] = useState<'invite-only' | 'anyone-with-link'>('invite-only');
  const [linkCopied, setLinkCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { currentChatId } = useTripPlanning();
  const { t } = useTranslation();

  // Use current chat ID for sharing (independent of trip plans)
  const activeChatId = currentChatId;

  // Fetch sharing settings and invitations (only for valid chats)
  const { data: sharingData, isLoading: isLoadingSharing } = useQuery({
    queryKey: ['chat-sharing', activeChatId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/chats/${activeChatId}/sharing`);
      return response.json();
    },
    enabled: !!activeChatId && activeChatId !== -1 && isOpen
  });

  // Create or update sharing settings
  const createSharingMutation = useMutation({
    mutationFn: async (data: { accessLevel: string; allowAnonymousAccess: boolean }) => {
      if (!activeChatId || activeChatId === -1) {
        throw new Error('No chat available to share');
      }
      const response = await apiRequest('POST', `/api/chats/${activeChatId}/sharing`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sharing', activeChatId] });
    },
    onError: () => {
      toast({
        title: t("invitePanel.unableToCreateSharing"),
        description: t("invitePanel.selectChatFirst"),
        variant: "destructive"
      });
    }
  });

  // Send invitation mutation (handles both chat and platform invites)
  const sendInvitationMutation = useMutation({
    mutationFn: async (email: string) => {
      if (activeChatId && activeChatId !== -1) {
        // Chat-specific invitation
        const response = await apiRequest('POST', `/api/chats/${activeChatId}/invite`, { email, accessLevel: 'viewer' });
        return response.json();
      } else {
        // Platform invitation (general invite to join the platform)
        const response = await apiRequest('POST', '/api/platform/invite', { email });
        return response.json();
      }
    },
    onSuccess: () => {
      if (activeChatId && activeChatId !== -1) {
        queryClient.invalidateQueries({ queryKey: ['chat-sharing', activeChatId] });
      }
      toast({
        title: t("invitePanel.invitationSent"),
        description: (activeChatId && activeChatId !== -1)
          ? t("invitePanel.chatInvitationSent")
          : t("invitePanel.platformInvitationSent")
      });
    },
    onError: () => {
      toast({
        title: t("invitePanel.failedToSend"),
        description: t("invitePanel.failedToSendDesc"),
        variant: "destructive"
      });
    }
  });

  // Generate shareable link (only for valid chats)
  const shareableLink = (sharingData?.settings?.accessToken && activeChatId && activeChatId !== -1)
    ? `${window.location.origin}/chat/${activeChatId}?access=${sharingData.settings.accessToken}`
    : "";

  // Email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  // Handle email input
  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmailInput(value);

    // Auto-create tags on comma or enter
    if (value && value.includes(',')) {
      const emails = value.split(',').map(email => email.trim()).filter(Boolean);
      emails.forEach(email => {
        if (isValidEmail(email) && !emailTags.includes(email)) {
          setEmailTags(prev => [...prev, email]);
        }
      });
      setEmailInput('');
    }
  };

  // Handle key press for email input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const email = emailInput.trim();
      if (email && isValidEmail(email) && !emailTags.includes(email)) {
        setEmailTags(prev => [...prev, email]);
        setEmailInput('');
      }
    } else if (e.key === 'Backspace' && !emailInput && emailTags.length > 0) {
      // Remove last tag on backspace if input is empty
      setEmailTags(prev => prev.slice(0, -1));
    }
  };

  // Remove email tag
  const removeEmailTag = (emailToRemove: string) => {
    setEmailTags(prev => prev.filter(email => email !== emailToRemove));
  };

  // Update access level when settings load
  useEffect(() => {
    if (sharingData?.settings) {
      setAccessLevel(sharingData.settings.allowAnonymousAccess ? 'anyone-with-link' : 'invite-only');
    }
  }, [sharingData]);

  // Copy link to clipboard
  const copyLink = async () => {
    if (!shareableLink) {
      // Create sharing settings first if they don't exist
      await createSharingMutation.mutateAsync({
        accessLevel: 'invite-only',
        allowAnonymousAccess: accessLevel === 'anyone-with-link'
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(shareableLink);
      setLinkCopied(true);
      toast({
        title: t("invitePanel.linkCopied"),
        description: t("invitePanel.linkCopiedDesc"),
        duration: 2000,
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast({
        title: t("invitePanel.failedToCopy"),
        description: t("invitePanel.failedToCopyDesc"),
        variant: "destructive",
      });
    }
  };

  // Send invitations
  const sendInvitations = async () => {
    if (emailTags.length === 0) return;

    for (const email of emailTags) {
      try {
        await sendInvitationMutation.mutateAsync(email);
      } catch (error) {
        console.error(`Failed to send invitation to ${email}`, error);
      }
    }

    setEmailTags([]);
  };

  // Update access level
  const updateAccessLevel = async (newLevel: 'invite-only' | 'anyone-with-link') => {
    setAccessLevel(newLevel);
    
    await createSharingMutation.mutateAsync({
      accessLevel: 'invite-only',
      allowAnonymousAccess: newLevel === 'anyone-with-link'
    });

    toast({
      title: "Access level updated",
      description: newLevel === 'anyone-with-link' 
        ? "Anyone with the link can now view this trip" 
        : "Only invited people can access this trip"
    });
  };

  if (!isOpen) return null;

  // Determine if we have active trip data
  const hasActiveTripData = tripTitle !== "Your Amazing Trip" && tripTitle !== "Trip";
  const displayTitle = hasActiveTripData ? tripTitle : "Your next adventure";
  const displayDuration = hasActiveTripData ? tripDuration : "Plan together";

  // Get invitations from sharing data
  const invitedPeople: InvitedPerson[] = sharingData?.invitations || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl mx-4 shadow-xl overflow-hidden">
        <div className="flex h-96">
          {/* Left Column - Trip Image */}
          <div className="w-2/5 relative">
            <div className="h-full bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
              <img 
                src={tripImage} 
                alt="Trip preview" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="font-semibold text-xl mb-1">{displayTitle}</h3>
                <p className="text-sm text-white/80">{displayDuration}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-3 left-3 p-1.5 bg-black/20 hover:bg-black/40 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Right Column - Content */}
          <div className="w-3/5 p-8 flex flex-col">
            <div className="flex-1">
              {/* Title */}
              <h2 className="text-2xl font-semibold mb-3">
                {(activeChatId && activeChatId !== -1) ? t("invitePanel.shareTrip") : t("invitePanel.title")}
              </h2>
              <p className="text-base text-gray-600 mb-8">
                {(activeChatId && activeChatId !== -1)
                  ? t("invitePanel.shareTrip")
                  : t("invitePanel.title")
                }
              </p>

              {/* Email Input with Tags */}
              <div className="mb-8">
                <div className="bg-gray-50 rounded-lg p-3 min-h-[44px] flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white border-0">
                  {emailTags.map((email, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ${
                        isValidEmail(email) 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}
                    >
                      {email}
                      <button
                        onClick={() => removeEmailTag(email)}
                        className="hover:bg-white/50 rounded-sm p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={inputRef}
                    type="email"
                    placeholder={emailTags.length === 0 ? t("invitePanel.emailPlaceholder") : ""}
                    value={emailInput}
                    onChange={handleEmailInput}
                    onKeyDown={handleKeyPress}
                    className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
                  />
                </div>
                
                {/* Invite Button */}
                <Button
                  onClick={sendInvitations}
                  disabled={emailTags.length === 0 || sendInvitationMutation.isPending}
                  className="w-full mt-3 bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50 rounded-lg h-10 font-medium text-sm"
                >
                  {sendInvitationMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {t("common.sending")}...
                    </>
                  ) : (
                    t("invite")
                  )}
                </Button>
              </div>

              {/* Invited People List - only for chat invitations */}
              {(activeChatId && activeChatId !== -1) && invitedPeople.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-base font-medium mb-3 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    {t("invitePanel.invitedPeople")} ({invitedPeople.length})
                  </h4>
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {invitedPeople.map((person, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg">
                        <span className="text-gray-700 truncate">{person.email}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          person.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          person.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {person.status === 'pending' ? t("invitePanel.pending") :
                           person.status === 'accepted' ? t("invitePanel.accepted") :
                           t("invitePanel.declined")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions - only show if chat exists */}
            {(activeChatId && activeChatId !== -1) && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyLink}
                  className="text-sm text-gray-600 hover:text-gray-800 p-1 h-auto flex items-center"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {t("invitePanel.copyLink")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateAccessLevel(accessLevel === 'invite-only' ? 'anyone-with-link' : 'invite-only')}
                  className="text-sm text-gray-600 hover:text-gray-800 p-1 h-auto flex items-center"
                >
                  {accessLevel === 'invite-only' ? (
                    <>
                      <Lock className="h-4 w-4 mr-1" />
                      Invite only ▼
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-1" />
                      Anyone ▼
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}