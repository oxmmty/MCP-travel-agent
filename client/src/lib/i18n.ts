import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    saveMissing: false,
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: {
          // Navigation
          newTrip: "New trip",
          newChat: "New Chat",
          chats: "Chats",
          explore: "Explore",
          saved: "Saved",
          updates: "Updates",
          inspiration: "Inspiration",
          create: "Create",
          
          // Top Navigation
          where: "Where",
          when: "When",
          travelers: "travelers",
          budget: "Budget",
          invite: "Invite",
          createTrip: "Create a trip",
          
          // Budget Options
          budgetOptions: {
            any: "Any budget",
            budget: "On a budget",
            sensible: "Sensibly priced", 
            upscale: "Upscale",
            luxury: "Luxury"
          },
          
          // Common actions
          update: "Update",
          logout: "Logout",
          loggingOut: "Logging out...",
          sending: "Sending",
          
          // Sub Navigation
          chat: "Chat",
          search: "Search",
          social: "Social",
          agents: "Agents",
          
          // Chat Interface
          travelAssistant: "Travel Assistant",
          planningAdventure: "Planning your next adventure",
          askAnything: "Ask anything...",
          takeMe: "TakeMeTo.ai",
          canMakeMistakes: "can make mistakes",
          checkImportantInfo: "Check important info",
          whatCanIAsk: "What can I ask TakeMeTo.ai?",
          examplesTitle: "Examples of things TakeMeTo.ai can help you with",
          
          // Welcome Message
          welcomeGreeting: "Where can I take you to today, {{name}}?",
          assistantIntro: "Hey there, I'm here to assist you in planning your experience. Ask me anything travel related.",
          
          // Sidebar
          viewAllHotels: "View all hotels",
          topAttractions: "Top Attractions",
          travelTips: "Travel Tips",
          planItinerary: "Plan itinerary",
          bookHotels: "Book hotels",
          
          // Travel Tips
          bestTimeToVisit: "Best time to visit",
          gettingAround: "Getting around",
          
          // Map
          munichMap: "Munich Map",
          
          // Languages
          languages: {
            en: "🇺🇸 English",
            de: "🇩🇪 Deutsch", 
            es: "🇪🇸 Español",
            fr: "🇫🇷 Français"
          },
          
          // Common
          population: "Population",
          currentWeather: "Current weather",
          recommendedHotels: "Recommended Hotels",
          from: "From",
          night: "/night",
          favorites: "Favorites",
          addToTrip: "Add to Trip",
          addToFavorites: "Add to Favorites",
          addedToFavorites: "Added to favorites",
          addedToTrip: "Added to trip",
          errorAddingToFavorites: "Error adding to favorites",
          errorAddingToTrip: "Error adding to trip",
          
          // Place Types
          "Hotel": "Hotel",
          "Sehenswürdigkeit": "Attraction",
          "Restaurant": "Restaurant", 
          "Aktivität": "Activity",
          "Reiseziel": "Destination",
          hotel: "Hotel",
          restaurant: "Restaurant",
          attraction: "Attraction",
          
          // Saved Page
          "Your saved places": "Your saved places",
          "Places": "Places",
          "Collections": "Collections", 
          "Guides": "Guides",
          "Search my saved places": "Search my saved places",
          "All": "All",
          "Stays": "Stays",
          "Restaurants": "Restaurants",
          "Attractions": "Attractions",
          "Activities": "Activities",
          "Locations": "Locations",
          "No results found": "No results found",
          "No saved places yet": "No saved places yet",
          "Try adjusting your search or filters": "Try adjusting your search or filters",
          "Start saving places you'd like to visit": "Start saving places you'd like to visit",
          "No collections yet": "No collections yet",
          "Create collections to organize your saved places": "Create collections to organize your saved places",
          "No guides yet": "No guides yet",
          "Save guides to help plan your trips": "Save guides to help plan your trips",
          "Map": "Map",
          "Trips": "Trips",
          
          // Categories
          "Museum": "Museum",
          "Kunstgalerie": "Art Gallery",
          "Park": "Park",
          "Kirche": "Church",
          "Freizeitpark": "Amusement Park",
          "Zoo": "Zoo",
          "Aquarium": "Aquarium",
          "Historisches Wahrzeichen": "Historical Landmark",
          "Touristenattraktion": "Tourist Attraction",
          "Einkaufen": "Shopping",
          "Café": "Café",
          "Transport": "Transport",
          
          // Action Icons
          actionIcons: {
            hotels: "Hotels",
            restaurants: "Restaurants",
            attractions: "Attractions",
            shopping: "Shopping",
            parks: "Parks",
            cafes: "Cafés",
            transport: "Transport",
            nearby: "Nearby"
          },
          
          // Travel Mood Selector
          select_travel_style: "Select Your Travel Style",
          select_style_description: "Choose the style that best fits your planned trip.",
          selected: "Selected",
          demo_version: "Demo Version",
          demo_version_desc: "This is a mock-up version. Full implementation with map filtering will follow later.",
          selected_travel_style: "Selected Travel Style",
          mood_selected_title: "Travel Style Selected!",
          mood_selected_desc: "selected - This is a demo version. Full implementation follows later.",
          mood_selected_ai_desc: "selected - AI is now creating personalized recommendations!",
          for: "for",
          mood_selection_message: `🎯 I choose "{{moodName}}" as my travel style{{destination}}! {{icon}}

{{description}}

As a {{moodNameLower}}, what can you recommend for this trip? Which activities, places or experiences fit perfectly with this travel style?`,
          generating_recommendations: "✨ Generating personalized recommendations for {{moodName}}...",
          sending_to_ai: "Sending to AI...",
          error: "Error",
          mood_selection_error: "Failed to send travel style to AI. Please try again.",
          
          // Travel Mood Types
          culture_lover: "Culture Lover",
          culture_lover_desc: "Discover museums, historical sites and local traditions",
          culture_lover_short: "Museums, history",
          adventurer: "Adventurer", 
          adventurer_desc: "Exciting activities and outdoor experiences",
          adventurer_short: "Outdoor activities",
          relaxation: "Relaxation",
          relaxation_desc: "Wellness, peace and restorative moments",
          relaxation_short: "Wellness, rest",
          foodie: "Foodie",
          foodie_desc: "Culinary discoveries and local specialties",
          foodie_short: "Culinary discoveries",
          nature_lover: "Nature Lover",
          nature_lover_desc: "Parks, gardens and natural beauty",
          nature_lover_short: "Parks, landscapes",
          shopping_style: "Shopping & Style",
          shopping_style_desc: "Shopping, fashion and local markets",
          shopping_style_short: "Shopping, markets",
          nightlife: "Nightlife",
          nightlife_desc: "Bars, clubs and evening entertainment",
          nightlife_short: "Bars, clubs",
          family_kids: "Family & Kids",
          family_kids_desc: "Family-friendly activities and attractions",
          family_kids_short: "Family activities",
          
          // Initial Messages
          welcomeMessage: "Hello! I'm your personal travel assistant. I'm here to help you plan the perfect trip. Where would you like to go today?",
          
          // Authentication
          auth: {
            // Common
            welcome: "Welcome",
            welcomeBack: "Welcome back",
            welcomeToTakeMeTo: "Welcome to TakeMeTo.ai",
            signInToContinue: "Sign in to continue your travel planning",
            createAccount: "Create your account for smart travel planning",
            signIn: "Sign in",
            signUp: "Sign up",
            register: "Register",
            or: "or",
            dontHaveAccount: "Don't have an account?",
            alreadyHaveAccount: "Already have an account?",
            continueWithGoogle: "Continue with Google",
            continueWithApple: "Continue with Apple",
            agreeToTerms: "By continuing, you agree to our Terms of Service and Privacy Policy",
            byContinuing: "By continuing you agree to our",
            termsOfService: "Terms of Service",
            andConfirm: "and confirm that you have read our",
            privacyPolicy: "Privacy Policy",
            haveRead: ".",
            
            // Form fields
            firstName: "First name",
            lastName: "Last name",
            email: "Email address",
            password: "Password",
            confirmPassword: "Confirm password",
            
            // Placeholders
            enterFirstName: "Enter your first name",
            enterLastName: "Enter your last name",
            enterEmail: "Enter your email address",
            enterPassword: "Enter your password",
            confirmYourPassword: "Confirm your password",
            
            // Validation messages
            validationErrors: {
              emailRequired: "Email is required",
              emailInvalid: "Invalid email address",
              passwordRequired: "Password is required",
              passwordMinLength: "Password must be at least 8 characters",
              passwordUppercase: "Password must contain at least one uppercase letter",
              passwordLowercase: "Password must contain at least one lowercase letter",
              passwordNumber: "Password must contain at least one number",
              passwordsNoMatch: "Passwords do not match",
              firstNameRequired: "First name is required",
              firstNameMinLength: "First name must be at least 2 characters",
              lastNameRequired: "Last name is required",
              lastNameMinLength: "Last name must be at least 2 characters"
            },
            
            // Password Reset
            forgotPassword: "Forgot password?",
            forgotPasswordTitle: "Forgot your password?",
            forgotPasswordDescription: "Enter your email address and we'll send you a link to reset your password.",
            sendResetLink: "Send reset link",
            sendingResetLink: "Sending...",
            resetLinkSent: "Reset link sent",
            resetLinkSentDescription: "If an account with this email exists, we've sent you a password reset link.",
            backToLogin: "Back to login",
            resetPassword: "Reset Password",
            resetPasswordTitle: "Create new password",
            resetPasswordDescription: "Enter your new password below.",
            newPassword: "New password",
            confirmNewPassword: "Confirm new password",
            resetPasswordButton: "Reset password",
            resettingPassword: "Resetting...",
            passwordResetSuccess: "Password reset successful",
            passwordResetSuccessDescription: "Your password has been reset successfully. You can now sign in with your new password.",
            invalidResetLink: "Invalid reset link",
            invalidResetLinkDescription: "The password reset link is invalid or has expired.",
            expiredResetLink: "Reset link expired",
            expiredResetLinkDescription: "The password reset link has expired. Please request a new one.",
            
            // Error messages
            errors: {
              loginFailed: "Login failed",
              registerFailed: "Registration failed",
              googleNotImplemented: "Google sign-in is currently being implemented",
              appleNotImplemented: "Apple sign-in is currently being implemented",
              genericError: "An error occurred. Please try again."
            },
            
            // Toast messages
            toasts: {
              loginSuccess: "Successfully logged in",
              loginWelcomeBack: "Welcome back, {{name}}!",
              loginFailed: "Login failed",
              registerSuccess: "Registration successful",
              registerWelcome: "Welcome to TakeMeTo.ai, {{name}}!",
              registerFailed: "Registration failed",
              googleLoginSuccess: "Google login successful",
              googleLoginWelcome: "Welcome, {{name}}!",
              googleLoginFailed: "Google login failed",
              logoutSuccess: "Successfully logged out",
              logoutGoodbye: "Goodbye!",
              logoutFailed: "Logout failed",
              profileUpdateSuccess: "Profile updated",
              profileUpdateDescription: "Your changes have been saved.",
              profileUpdateFailed: "Profile update failed"
            }
          },
          
          // Status
          justNow: "Just now",
          minutesAgo: "{{count}} minutes ago",
          hoursAgo: "{{count}} hours ago",
          
          // Error Messages
          failedToLoad: "Failed to load data",
          tryAgain: "Try again",
          noMessages: "No messages yet",
          startConversation: "Start a conversation about your travel plans!",
          
          // Itinerary
          itinerary: {
            culturalDiscovery: "Cultural Discovery",
            day: "Day",
            hour: "hour",
            hours: "hours",
            minute: "minute", 
            minutes: "minutes",
            free: "Free",
            cost: "Cost",
            duration: "Duration",
            location: "Location"
          },
          
          // Trip Modal
          trip: {
            receipt: "Receipt",
            addCustom: "Add custom",
            searchPlaces: "Search for places...",
            searchDestinations: "Search for destinations, places",
            orExperiences: "or experiences.",
            previouslySaved: "Previously saved for this location",
            mentionedInChat: "Mentioned in this chat"
          },
          
          // Trip Planner
          tripPlanner: {
            planner: "Trip Planner",
            close: "Close Trip",
            newDestination: "New Destination",
            travelers: "Travelers",
            days: "Days",
            itinerary: "Itinerary",
            calendar: "Calendar",
            bookings: "Bookings",
            generating: "Loading... AI trip plan is being created",
            generateItinerary: "Generate AI Trip Plan",
            addActivity: "Add Activity",
            travelPlan: "Travel Plan",
            distances: "Distances",
            noActivitiesForDay: "No activities for Day {{day}} yet",
            firstActivity: "Add first activity",
            noTripData: "No trip data for solver validation",
            createPlanFirst: "Create a trip plan first to use the SMT solver.",
            backToItinerary: "Back to Itinerary",
            savePlan: "Save Trip Plan",
            editActivity: "Edit Activity",
            name: "Name",
            description: "Description",
            time: "Time",
            place: "Place",
            save: "Save",
            cancel: "Cancel",
            details: "Details",
            hotel: "Hotel",
            attraction: "Attraction",
            restaurant: "Restaurant",
            activity: "Activity",
            other: "Other",
            newActivity: "New Activity",
            night: "night",
            of: "of",
            tripTitle: "Trip Title",
            map: "Map",
            undo: "Undo",
            redo: "Redo",
            book: "Book",
            link: "Link",
            add: "Add",
            day: "Day",
            loading: {
              destinationAgent: "🔍 Destination Agent - Researching location...",
              itineraryAgent: "📅 Itinerary Agent - Creating schedule...",
              integratingResults: "🔄 Integrating results...",
              analyzingDestination: "Analyzing your destination...",
              searchingHotels: "Searching for perfect hotels...",
              discoveringAttractions: "Discovering amazing attractions...",
              findingRestaurants: "Finding delicious restaurants...",
              creatingItinerary: "Creating your perfect itinerary...",
              finalizingPlan: "Adding final touches...",
              complete: "complete",
              messages: {
                findingHiddenGems: "Finding hidden gems that locals love! 💎",
                checkingWeather: "Checking the best weather patterns 🌤️",
                analyzingBestTimes: "Analyzing best times to visit attractions",
                comparingHotels: "Comparing hundreds of hotels for you 🏨",
                checkingReviews: "Reading reviews from real travelers",
                findingDeals: "Hunting for the best deals! 💰",
                findingAttractions: "Discovering must-see attractions 🎯",
                checkingOpeningHours: "Checking opening hours and tickets",
                optimizingRoutes: "Optimizing walking routes for you",
                searchingCuisine: "Finding authentic local cuisine 🍽️",
                checkingMenus: "Checking menus and prices",
                findingLocalFavorites: "Finding where locals love to eat!",
                optimizingSchedule: "Creating the perfect daily flow 📅",
                balancingActivities: "Balancing activities and relaxation",
                addingFreeTime: "Adding time for spontaneous discoveries",
                addingPersonalTouch: "Adding that special personal touch ✨",
                doubleChecking: "Double-checking every detail",
                almostReady: "Almost ready for your adventure!"
              },
              tips: [
                "Did you know? The best travel memories often come from unplanned moments!",
                "Pro tip: Always leave some flexibility in your itinerary for spontaneous discoveries.",
                "Fun fact: Traveling can boost creativity and happiness for weeks after your trip!"
              ]
            }
          },
          
          // Invite Panel
          invitePanel: {
            panel: "Invite Panel",
            title: "Invite people to your trip",
            shareTrip: "Share your trip",
            inviteByEmail: "Invite by email",
            shareableLink: "Shareable link",
            accessLevel: "Access level",
            inviteOnly: "Invite only",
            anyoneWithLink: "Anyone with link",
            enterEmails: "Enter email addresses",
            emailPlaceholder: "friend@example.com",
            sendInvites: "Send invites",
            copyLink: "Copy link",
            linkCopied: "Link copied!",
            linkCopiedDesc: "The invite link has been copied to your clipboard.",
            invitationSent: "Invitation sent!",
            chatInvitationSent: "The chat invitation has been sent successfully.",
            platformInvitationSent: "The platform invitation has been sent successfully.",
            failedToSend: "Failed to send invitation",
            failedToSendDesc: "Could not send the invitation. Please try again.",
            unableToCreateSharing: "Unable to create sharing settings",
            selectChatFirst: "Please select a chat first before sharing.",
            failedToCopy: "Failed to copy",
            failedToCopyDesc: "Could not copy link to clipboard.",
            invitedPeople: "Invited people",
            pending: "Pending",
            accepted: "Accepted", 
            declined: "Declined",
            noInvitations: "No invitations yet",
            accessDenied: "Access denied",
            noChatAvailable: "No chat available to share"
          }
        }
      },
      de: {
        translation: {
          // Navigation
          newTrip: "Neue Reise",
          newChat: "Neuer Chat",
          chats: "Chats",
          explore: "Entdecken",
          saved: "Gespeichert",
          updates: "Updates",
          inspiration: "Inspiration",
          create: "Erstellen",
          
          // Top Navigation
          where: "Wohin",
          when: "Wann",
          travelers: "Reisende",
          budget: "Budget",
          invite: "Einladen",
          createTrip: "Reise erstellen",
          
          // Budget Options
          budgetOptions: {
            any: "Beliebiges Budget",
            budget: "Günstiges Budget",
            sensible: "Vernünftig bepreist",
            upscale: "Gehoben",
            luxury: "Luxus"
          },
          
          // Common actions
          update: "Aktualisieren",
          logout: "Abmelden",
          loggingOut: "Abmeldung läuft...",
          sending: "Sende",
          
          // Sub Navigation
          chat: "Chat",
          search: "Suche",
          social: "Social",
          agents: "Agenten",
          
          // Chat Interface
          travelAssistant: "Reise-Assistent",
          planningAdventure: "Plane dein nächstes Abenteuer",
          askAnything: "Frage alles...",
          takeMe: "TakeMeTo.ai",
          canMakeMistakes: "kann Fehler machen",
          checkImportantInfo: "Wichtige Informationen prüfen",
          whatCanIAsk: "Was kann ich TakeMeTo.ai fragen?",
          examplesTitle: "Beispiele für Dinge, bei denen TakeMeTo.ai helfen kann",
          
          // Welcome Message
          welcomeGreeting: "Wohin kann ich dich heute bringen, {{name}}?",
          assistantIntro: "Hallo! Ich bin hier, um dir bei der Planung deiner Reise zu helfen. Frag mich alles rund ums Reisen.",
          
          // Sidebar
          viewAllHotels: "Alle Hotels anzeigen",
          topAttractions: "Top Sehenswürdigkeiten",
          travelTips: "Reisetipps",
          planItinerary: "Reiseplan erstellen",
          bookHotels: "Hotels buchen",
          
          // Travel Tips
          bestTimeToVisit: "Beste Reisezeit",
          gettingAround: "Fortbewegung",
          
          // Map
          munichMap: "München Karte",
          
          // Languages
          languages: {
            en: "🇺🇸 English",
            de: "🇩🇪 Deutsch", 
            es: "🇪🇸 Español",
            fr: "🇫🇷 Français"
          },
          
          // Common
          population: "Einwohner",
          currentWeather: "Aktuelles Wetter",
          recommendedHotels: "Empfohlene Hotels",
          from: "Ab",
          night: "/Nacht",
          favorites: "Favoriten",
          addToTrip: "Zum Trip",
          addToFavorites: "Zu Favoriten",
          addedToFavorites: "Zu Favoriten hinzugefügt",
          addedToTrip: "Zum Trip hinzugefügt",
          errorAddingToFavorites: "Fehler beim Hinzufügen zu Favoriten",
          errorAddingToTrip: "Fehler beim Hinzufügen zum Trip",
          
          // Place Types
          "Hotel": "Hotel",
          "Sehenswürdigkeit": "Sehenswürdigkeit",
          "Restaurant": "Restaurant",
          "Aktivität": "Aktivität", 
          "Reiseziel": "Reiseziel",
          hotel: "Hotel",
          restaurant: "Restaurant",
          attraction: "Sehenswürdigkeit",
          
          // Saved Page
          "Your saved places": "Deine gespeicherten Orte",
          "Places": "Orte",
          "Collections": "Sammlungen", 
          "Guides": "Guides",
          "Search my saved places": "Meine gespeicherten Orte durchsuchen",
          "All": "Alle",
          "Stays": "Unterkünfte",
          "Restaurants": "Restaurants",
          "Attractions": "Sehenswürdigkeiten",
          "Activities": "Aktivitäten",
          "Locations": "Standorte",
          "No results found": "Keine Ergebnisse gefunden",
          "No saved places yet": "Noch keine gespeicherten Orte",
          "Try adjusting your search or filters": "Versuche deine Suche oder Filter anzupassen",
          "Start saving places you'd like to visit": "Beginne Orte zu speichern, die du besuchen möchtest",
          "No collections yet": "Noch keine Sammlungen",
          "Create collections to organize your saved places": "Erstelle Sammlungen, um deine gespeicherten Orte zu organisieren",
          "No guides yet": "Noch keine Guides",
          "Save guides to help plan your trips": "Speichere Guides, um deine Reisen zu planen",
          "Map": "Karte",
          "Trips": "Reisen",
          
          // Categories
          "Museum": "Museum",
          "Kunstgalerie": "Kunstgalerie",
          "Park": "Park",
          "Kirche": "Kirche",
          "Freizeitpark": "Freizeitpark",
          "Zoo": "Zoo",
          "Aquarium": "Aquarium",
          "Historisches Wahrzeichen": "Historisches Wahrzeichen",
          "Touristenattraktion": "Touristenattraktion",
          "Einkaufen": "Einkaufen",
          "Café": "Café",
          "Transport": "Transport",
          
          // Action Icons
          actionIcons: {
            hotels: "Hotels",
            restaurants: "Restaurants",
            attractions: "Sehenswürdigkeiten",
            shopping: "Einkaufen",
            parks: "Parks",
            cafes: "Cafés",
            transport: "Transport",
            nearby: "In der Nähe"
          },
          
          // Travel Mood Selector
          select_travel_style: "Wähle deinen Reisestil",
          select_style_description: "Wähle den Stil, der am besten zu deiner geplanten Reise passt.",
          selected: "Gewählt",
          demo_version: "Demo-Version",
          demo_version_desc: "Dies ist eine Mock-Up-Version. Die vollständige Implementierung mit Kartenfiltierung folgt später.",
          selected_travel_style: "Gewählter Reisestil",
          mood_selected_title: "Reisestil gewählt!",
          mood_selected_desc: "ausgewählt - Dies ist eine Demo-Version. Die vollständige Implementierung folgt später.",
          mood_selected_ai_desc: "ausgewählt - KI erstellt jetzt personalisierte Empfehlungen!",
          for: "für",
          mood_selection_message: `🎯 Ich wähle "{{moodName}}" als meinen Reisestil{{destination}}! {{icon}}

{{description}}

Was kannst du mir als {{moodNameLower}} für diese Reise empfehlen? Welche Aktivitäten, Orte oder Erlebnisse passen perfekt zu diesem Reisestil?`,
          generating_recommendations: "✨ Erstelle personalisierte Empfehlungen für {{moodName}}...",
          sending_to_ai: "Sende an KI...",
          error: "Fehler",
          mood_selection_error: "Konnte Reisestil nicht an KI senden. Bitte versuche es erneut.",
          
          // Travel Mood Types
          culture_lover: "Kulturliebhaber",
          culture_lover_desc: "Entdecke Museen, historische Stätten und lokale Traditionen",
          culture_lover_short: "Museen, Geschichte",
          adventurer: "Abenteurer", 
          adventurer_desc: "Aufregende Aktivitäten und Outdoor-Erlebnisse",
          adventurer_short: "Outdoor-Aktivitäten",
          relaxation: "Entspannung",
          relaxation_desc: "Wellness, Ruhe und erholsame Momente",
          relaxation_short: "Wellness, Ruhe",
          foodie: "Feinschmecker",
          foodie_desc: "Kulinarische Entdeckungen und lokale Spezialitäten",
          foodie_short: "Kulinarische Entdeckungen",
          nature_lover: "Naturliebhaber",
          nature_lover_desc: "Parks, Gärten und natürliche Schönheiten",
          nature_lover_short: "Parks, Landschaften",
          shopping_style: "Shopping & Style",
          shopping_style_desc: "Einkaufen, Mode und lokale Märkte",
          shopping_style_short: "Einkaufen, Märkte",
          nightlife: "Nachtleben",
          nightlife_desc: "Bars, Clubs und abendliche Unterhaltung",
          nightlife_short: "Bars, Clubs",
          family_kids: "Familie & Kinder",
          family_kids_desc: "Familienfreundliche Aktivitäten und Attraktionen",
          family_kids_short: "Familien-Aktivitäten",
          
          // Initial Messages
          welcomeMessage: "Hallo! Ich bin dein persönlicher Reise-Assistent. Ich helfe dir dabei, die perfekte Reise zu planen. Wohin möchtest du heute gehen?",
          
          // Authentication
          auth: {
            // Common
            welcome: "Willkommen",
            welcomeBack: "Willkommen zurück",
            welcomeToTakeMeTo: "Willkommen bei TakeMeTo.ai",
            signInToContinue: "Melden Sie sich an, um Ihre Reiseplanung fortzusetzen",
            createAccount: "Erstellen Sie Ihr Konto für intelligente Reiseplanung",
            signIn: "Anmelden",
            signUp: "Registrieren",
            register: "Registrieren",
            or: "oder",
            dontHaveAccount: "Noch kein Konto?",
            alreadyHaveAccount: "Bereits ein Konto?",
            continueWithGoogle: "Mit Google fortfahren",
            continueWithApple: "Mit Apple fortfahren",
            agreeToTerms: "Durch Fortfahren stimmst du unseren Nutzungsbedingungen und Datenschutzrichtlinien zu",
            byContinuing: "Durch Fortfahren stimmst du unseren",
            termsOfService: "Nutzungsbedingungen",
            andConfirm: "zu und bestätigst, dass du unsere",
            privacyPolicy: "Datenschutzrichtlinie",
            haveRead: "gelesen hast.",
            
            // Form fields
            firstName: "Vorname",
            lastName: "Nachname",
            email: "E-Mail-Adresse",
            password: "Passwort",
            confirmPassword: "Passwort bestätigen",
            
            // Placeholders
            enterFirstName: "Vorname eingeben",
            enterLastName: "Nachname eingeben",
            enterEmail: "E-Mail-Adresse eingeben",
            enterPassword: "Passwort eingeben",
            confirmYourPassword: "Passwort bestätigen",
            
            // Validation messages
            validationErrors: {
              emailRequired: "E-Mail ist erforderlich",
              emailInvalid: "Ungültige E-Mail-Adresse",
              passwordRequired: "Passwort ist erforderlich",
              passwordMinLength: "Passwort muss mindestens 8 Zeichen haben",
              passwordUppercase: "Passwort muss mindestens einen Großbuchstaben enthalten",
              passwordLowercase: "Passwort muss mindestens einen Kleinbuchstaben enthalten",
              passwordNumber: "Passwort muss mindestens eine Zahl enthalten",
              passwordsNoMatch: "Passwörter stimmen nicht überein",
              firstNameRequired: "Vorname ist erforderlich",
              firstNameMinLength: "Vorname muss mindestens 2 Zeichen haben",
              lastNameRequired: "Nachname ist erforderlich",
              lastNameMinLength: "Nachname muss mindestens 2 Zeichen haben"
            },
            
            // Password Reset
            forgotPassword: "Passwort vergessen?",
            forgotPasswordTitle: "Passwort vergessen?",
            forgotPasswordDescription: "Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.",
            sendResetLink: "Reset-Link senden",
            sendingResetLink: "Sende...",
            resetLinkSent: "Reset-Link gesendet",
            resetLinkSentDescription: "Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link zum Zurücksetzen des Passworts gesendet.",
            backToLogin: "Zurück zum Login",
            resetPassword: "Passwort zurücksetzen",
            resetPasswordTitle: "Neues Passwort erstellen",
            resetPasswordDescription: "Gib dein neues Passwort unten ein.",
            newPassword: "Neues Passwort",
            confirmNewPassword: "Neues Passwort bestätigen",
            resetPasswordButton: "Passwort zurücksetzen",
            resettingPassword: "Setze zurück...",
            passwordResetSuccess: "Passwort erfolgreich zurückgesetzt",
            passwordResetSuccessDescription: "Dein Passwort wurde erfolgreich zurückgesetzt. Du kannst dich jetzt mit deinem neuen Passwort anmelden.",
            invalidResetLink: "Ungültiger Reset-Link",
            invalidResetLinkDescription: "Der Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.",
            expiredResetLink: "Reset-Link abgelaufen",
            expiredResetLinkDescription: "Der Link zum Zurücksetzen des Passworts ist abgelaufen. Bitte fordere einen neuen an.",
            
            // Error messages
            errors: {
              loginFailed: "Anmeldung fehlgeschlagen",
              registerFailed: "Registrierung fehlgeschlagen",
              googleNotImplemented: "Google-Anmeldung wird derzeit implementiert",
              appleNotImplemented: "Apple-Anmeldung wird derzeit implementiert",
              genericError: "Ein Fehler ist aufgetreten. Bitte versuche es erneut."
            },
            
            // Toast messages
            toasts: {
              loginSuccess: "Erfolgreich angemeldet",
              loginWelcomeBack: "Willkommen zurück, {{name}}!",
              loginFailed: "Anmeldung fehlgeschlagen",
              registerSuccess: "Registrierung erfolgreich",
              registerWelcome: "Willkommen bei TakeMeTo.ai, {{name}}!",
              registerFailed: "Registrierung fehlgeschlagen",
              googleLoginSuccess: "Google-Anmeldung erfolgreich",
              googleLoginWelcome: "Willkommen, {{name}}!",
              googleLoginFailed: "Google-Anmeldung fehlgeschlagen",
              logoutSuccess: "Erfolgreich abgemeldet",
              logoutGoodbye: "Auf Wiedersehen!",
              logoutFailed: "Abmeldung fehlgeschlagen",
              profileUpdateSuccess: "Profil aktualisiert",
              profileUpdateDescription: "Deine Änderungen wurden gespeichert.",
              profileUpdateFailed: "Profil-Update fehlgeschlagen"
            }
          },
          
          // Status
          justNow: "Gerade eben",
          minutesAgo: "vor {{count}} Minuten",
          hoursAgo: "vor {{count}} Stunden",
          
          // Error Messages
          failedToLoad: "Laden der Daten fehlgeschlagen",
          tryAgain: "Erneut versuchen",
          noMessages: "Noch keine Nachrichten",
          startConversation: "Beginne ein Gespräch über deine Reisepläne!",
          
          // Itinerary
          itinerary: {
            culturalDiscovery: "Kulturelle Entdeckung",
            day: "Tag",
            hour: "Stunde",
            hours: "Stunden",
            minute: "Minute", 
            minutes: "Minuten",
            free: "Kostenlos",
            cost: "Kosten",
            duration: "Dauer",
            location: "Ort"
          },
          
          // Trip Modal
          trip: {
            receipt: "Beleg",
            addCustom: "Eigene hinzufügen",
            searchPlaces: "Nach Orten suchen...",
            searchDestinations: "Nach Reisezielen, Orten suchen",
            orExperiences: "oder Erlebnissen.",
            previouslySaved: "Vorher für diesen Ort gespeichert",
            mentionedInChat: "In diesem Chat erwähnt"
          },
          
          // Trip Planner
          tripPlanner: {
            planner: "Reiseplaner",
            close: "Reise schließen",
            newDestination: "Neues Reiseziel",
            travelers: "Reisende",
            days: "Tage",
            itinerary: "Reiseplan",
            calendar: "Kalender",
            bookings: "Buchungen",
            generating: "Wird geladen... KI-Reiseplan wird erstellt",
            generateItinerary: "KI-Reiseplan erstellen",
            addActivity: "Aktivität hinzufügen",
            travelPlan: "Reiseplan",
            distances: "Distanzen",
            noActivitiesForDay: "Noch keine Aktivitäten für Tag {{day}}",
            firstActivity: "Erste Aktivität hinzufügen",
            noTripData: "Keine Reisedaten für Solver-Validierung",
            createPlanFirst: "Erstelle zuerst einen Reiseplan, um den SMT-Solver zu verwenden.",
            backToItinerary: "Zum Reiseplan",
            savePlan: "Reiseplan speichern",
            editActivity: "Aktivität bearbeiten",
            name: "Name",
            description: "Beschreibung",
            time: "Zeit",
            place: "Ort",
            save: "Speichern",
            cancel: "Abbrechen",
            details: "Details",
            hotel: "Hotel",
            attraction: "Sehenswürdigkeit",
            restaurant: "Restaurant",
            activity: "Aktivität",
            other: "Sonstiges",
            newActivity: "Neue Aktivität",
            night: "Nacht",
            of: "von",
            tripTitle: "Reisetitel",
            map: "Karte",
            undo: "Rückgängig",
            redo: "Wiederholen",
            book: "Buchen",
            link: "Link",
            add: "Hinzufügen",
            day: "Tag",
            loading: {
              destinationAgent: "🔍 Destination Agent - Recherchiert Reiseziel...",
              itineraryAgent: "📅 Itinerary Agent - Erstellt Reiseplan...",
              integratingResults: "🔄 Integriere Ergebnisse...",
              analyzingDestination: "Analysiere dein Reiseziel...",
              searchingHotels: "Suche nach perfekten Hotels...",
              discoveringAttractions: "Entdecke fantastische Sehenswürdigkeiten...",
              findingRestaurants: "Finde köstliche Restaurants...",
              creatingItinerary: "Erstelle deinen perfekten Reiseplan...",
              finalizingPlan: "Füge letzte Details hinzu...",
              complete: "abgeschlossen",
              messages: {
                findingHiddenGems: "Finde Geheimtipps, die Einheimische lieben! 💎",
                checkingWeather: "Prüfe die besten Wetterbedingungen 🌤️",
                analyzingBestTimes: "Analysiere beste Besuchszeiten für Attraktionen",
                comparingHotels: "Vergleiche hunderte Hotels für dich 🏨",
                checkingReviews: "Lese Bewertungen von echten Reisenden",
                findingDeals: "Jage die besten Angebote! 💰",
                findingAttractions: "Entdecke Must-See Attraktionen 🎯",
                checkingOpeningHours: "Prüfe Öffnungszeiten und Tickets",
                optimizingRoutes: "Optimiere Laufwege für dich",
                searchingCuisine: "Finde authentische lokale Küche 🍽️",
                checkingMenus: "Prüfe Speisekarten und Preise",
                findingLocalFavorites: "Finde Lieblingsorte der Einheimischen!",
                optimizingSchedule: "Erstelle den perfekten Tagesablauf 📅",
                balancingActivities: "Balance zwischen Aktivitäten und Entspannung",
                addingFreeTime: "Füge Zeit für spontane Entdeckungen hinzu",
                addingPersonalTouch: "Füge die besondere persönliche Note hinzu ✨",
                doubleChecking: "Überprüfe jedes Detail zweimal",
                almostReady: "Fast bereit für dein Abenteuer!"
              },
              tips: [
                "Wusstest du? Die besten Reiseerinnerungen entstehen oft aus ungeplanten Momenten!",
                "Profi-Tipp: Lass immer etwas Flexibilität in deinem Reiseplan für spontane Entdeckungen.",
                "Fun Fact: Reisen kann Kreativität und Glücksgefühle wochenlang nach deiner Reise steigern!"
              ]
            }
          },
          
          // Invite Panel
          invitePanel: {
            panel: "Einladungsbereich",
            title: "Lade Leute zu deiner Reise ein",
            shareTrip: "Reise teilen",
            inviteByEmail: "Per E-Mail einladen",
            shareableLink: "Teilbarer Link",
            accessLevel: "Zugriffsstufe",
            inviteOnly: "Nur auf Einladung",
            anyoneWithLink: "Jeder mit Link",
            enterEmails: "E-Mail-Adressen eingeben",
            emailPlaceholder: "freund@beispiel.com",
            sendInvites: "Einladungen senden",
            copyLink: "Link kopieren",
            linkCopied: "Link kopiert!",
            linkCopiedDesc: "Der Einladungslink wurde in die Zwischenablage kopiert.",
            invitationSent: "Einladung gesendet!",
            chatInvitationSent: "Die Chat-Einladung wurde erfolgreich gesendet.",
            platformInvitationSent: "Die Plattform-Einladung wurde erfolgreich gesendet.",
            failedToSend: "Einladung konnte nicht gesendet werden",
            failedToSendDesc: "Die Einladung konnte nicht gesendet werden. Bitte versuche es erneut.",
            unableToCreateSharing: "Freigabe-Einstellungen konnten nicht erstellt werden",
            selectChatFirst: "Bitte wähle zuerst einen Chat aus, bevor du teilst.",
            failedToCopy: "Kopieren fehlgeschlagen",
            failedToCopyDesc: "Link konnte nicht in die Zwischenablage kopiert werden.",
            invitedPeople: "Eingeladene Personen",
            pending: "Ausstehend",
            accepted: "Angenommen",
            declined: "Abgelehnt",
            noInvitations: "Noch keine Einladungen",
            accessDenied: "Zugriff verweigert",
            noChatAvailable: "Kein Chat zum Teilen verfügbar"
          }
        }
      },
      es: {
        translation: {
          // Navigation
          newTrip: "Nuevo viaje",
          newChat: "Nuevo Chat",
          chats: "Chats",
          explore: "Explorar",
          saved: "Guardado",
          updates: "Actualizaciones",
          inspiration: "Inspiración",
          create: "Crear",
          
          // Top Navigation
          where: "Dónde",
          when: "Cuándo",
          travelers: "viajeros",
          budget: "Presupuesto",
          invite: "Invitar",
          createTrip: "Crear un viaje",
          
          // Budget Options
          budgetOptions: {
            any: "Cualquier presupuesto",
            budget: "Presupuesto limitado",
            sensible: "Precio razonable",
            upscale: "Selecto",
            luxury: "Lujo"
          },
          
          // Common actions
          update: "Actualizar",
          logout: "Cerrar sesión",
          loggingOut: "Cerrando sesión...",
          sending: "Enviando",
          
          // Sub Navigation
          chat: "Chat",
          search: "Buscar",
          social: "Social",
          agents: "Agentes",
          
          // Chat Interface
          travelAssistant: "Asistente de Viajes",
          planningAdventure: "Planificando tu próxima aventura",
          askAnything: "Pregunta cualquier cosa...",
          takeMe: "TakeMeTo.ai",
          canMakeMistakes: "puede cometer errores",
          checkImportantInfo: "Verificar información importante",
          whatCanIAsk: "¿Qué puedo preguntarle a TakeMeTo.ai?",
          examplesTitle: "Ejemplos de cosas con las que TakeMeTo.ai puede ayudarte",
          
          // Welcome Message
          welcomeGreeting: "¿A dónde puedo llevarte hoy, {{name}}?",
          assistantIntro: "¡Hola! Estoy aquí para ayudarte a planificar tu experiencia. Pregúntame cualquier cosa relacionada con viajes.",
          
          // Sidebar
          viewAllHotels: "Ver todos los hoteles",
          topAttractions: "Principales Atracciones",
          travelTips: "Consejos de Viaje",
          planItinerary: "Planificar itinerario",
          bookHotels: "Reservar hoteles",
          
          // Travel Tips
          bestTimeToVisit: "Mejor época para visitar",
          gettingAround: "Cómo moverse",
          
          // Map
          munichMap: "Mapa de Múnich",
          
          // Languages
          languages: {
            en: "🇺🇸 English",
            de: "🇩🇪 Deutsch", 
            es: "🇪🇸 Español",
            fr: "🇫🇷 Français"
          },
          
          // Common
          population: "Población",
          currentWeather: "Clima actual",
          recommendedHotels: "Hoteles Recomendados",
          from: "Desde",
          night: "/noche",
          favorites: "Favoritos",
          addToTrip: "Añadir al viaje",
          addToFavorites: "Añadir a favoritos",
          addedToFavorites: "Añadido a favoritos",
          addedToTrip: "Añadido al viaje",
          errorAddingToFavorites: "Error al añadir a favoritos",
          errorAddingToTrip: "Error al añadir al viaje",
          
          // Action Icons
          actionIcons: {
            hotels: "Hoteles",
            restaurants: "Restaurantes",
            attractions: "Atracciones",
            shopping: "Compras",
            parks: "Parques",
            cafes: "Cafés",
            transport: "Transporte",
            nearby: "Cerca"
          },
          
          // Initial Messages
          welcomeMessage: "¡Hola! Soy tu asistente personal de viajes. Estoy aquí para ayudarte a planificar el viaje perfecto. ¿A dónde te gustaría ir hoy?",
          
          // Authentication
          auth: {
            // Common
            welcome: "Bienvenido",
            welcomeBack: "Bienvenido de vuelta",
            welcomeToTakeMeTo: "Bienvenido a TakeMeTo.ai",
            signInToContinue: "Inicia sesión para continuar con tu planificación de viaje",
            createAccount: "Crea tu cuenta para planificación inteligente de viajes",
            signIn: "Iniciar sesión",
            signUp: "Registrarse",
            register: "Registrarse",
            or: "o",
            dontHaveAccount: "¿No tienes cuenta?",
            alreadyHaveAccount: "¿Ya tienes cuenta?",
            continueWithGoogle: "Continuar con Google",
            continueWithApple: "Continuar con Apple",
            agreeToTerms: "Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad",
            byContinuing: "Al continuar aceptas nuestros",
            termsOfService: "Términos de Servicio",
            andConfirm: "y confirmas que has leído nuestra",
            privacyPolicy: "Política de Privacidad",
            haveRead: ".",
            
            // Form fields
            firstName: "Nombre",
            lastName: "Apellido",
            email: "Correo electrónico",
            password: "Contraseña",
            confirmPassword: "Confirmar contraseña",
            
            // Placeholders
            enterFirstName: "Ingresa tu nombre",
            enterLastName: "Ingresa tu apellido",
            enterEmail: "Ingresa tu correo electrónico",
            enterPassword: "Ingresa tu contraseña",
            confirmYourPassword: "Confirma tu contraseña",
            
            // Validation messages
            validationErrors: {
              emailRequired: "El correo electrónico es obligatorio",
              emailInvalid: "Correo electrónico inválido",
              passwordRequired: "La contraseña es obligatoria",
              passwordMinLength: "La contraseña debe tener al menos 8 caracteres",
              passwordUppercase: "La contraseña debe contener al menos una mayúscula",
              passwordLowercase: "La contraseña debe contener al menos una minúscula",
              passwordNumber: "La contraseña debe contener al menos un número",
              passwordsNoMatch: "Las contraseñas no coinciden",
              firstNameRequired: "El nombre es obligatorio",
              firstNameMinLength: "El nombre debe tener al menos 2 caracteres",
              lastNameRequired: "El apellido es obligatorio",
              lastNameMinLength: "El apellido debe tener al menos 2 caracteres"
            },
            
            // Error messages
            errors: {
              loginFailed: "Error al iniciar sesión",
              registerFailed: "Error al registrarse",
              googleNotImplemented: "El inicio de sesión con Google está siendo implementado",
              appleNotImplemented: "El inicio de sesión con Apple está siendo implementado",
              genericError: "Ocurrió un error. Por favor intenta nuevamente."
            },
            
            // Toast messages
            toasts: {
              loginSuccess: "Inicio de sesión exitoso",
              loginWelcomeBack: "¡Bienvenido de vuelta, {{name}}!",
              loginFailed: "Error al iniciar sesión",
              registerSuccess: "Registro exitoso",
              registerWelcome: "¡Bienvenido a TakeMeTo.ai, {{name}}!",
              registerFailed: "Error al registrarse",
              googleLoginSuccess: "Inicio de sesión con Google exitoso",
              googleLoginWelcome: "¡Bienvenido, {{name}}!",
              googleLoginFailed: "Error en inicio de sesión con Google",
              logoutSuccess: "Sesión cerrada exitosamente",
              logoutGoodbye: "¡Adiós!",
              logoutFailed: "Error al cerrar sesión",
              profileUpdateSuccess: "Perfil actualizado",
              profileUpdateDescription: "Tus cambios han sido guardados.",
              profileUpdateFailed: "Error al actualizar perfil"
            }
          },
          
          // Status
          justNow: "Ahora mismo",
          minutesAgo: "hace {{count}} minutos",
          hoursAgo: "hace {{count}} horas",
          
          // Error Messages
          failedToLoad: "Error al cargar datos",
          tryAgain: "Intentar de nuevo",
          noMessages: "Aún no hay mensajes",
          startConversation: "¡Comienza una conversación sobre tus planes de viaje!",
          
          // Itinerary
          itinerary: {
            culturalDiscovery: "Descubrimiento Cultural",
            day: "Día",
            hour: "hora",
            hours: "horas",
            minute: "minuto", 
            minutes: "minutos",
            free: "Gratis",
            cost: "Costo",
            duration: "Duración",
            location: "Ubicación"
          },
          
          // Trip Modal
          trip: {
            receipt: "Recibo",
            addCustom: "Agregar personalizado",
            searchPlaces: "Buscar lugares...",
            searchDestinations: "Buscar destinos, lugares",
            orExperiences: "o experiencias.",
            previouslySaved: "Guardado anteriormente para esta ubicación",
            mentionedInChat: "Mencionado en este chat"
          }
        }
      },
      fr: {
        translation: {
          // Navigation
          newTrip: "Nouveau voyage",
          newChat: "Nouveau Chat",
          chats: "Discussions",
          explore: "Explorer",
          saved: "Enregistré",
          updates: "Mises à jour",
          inspiration: "Inspiration",
          create: "Créer",
          
          // Top Navigation
          where: "Où",
          when: "Quand",
          travelers: "voyageurs",
          budget: "Budget",
          invite: "Inviter",
          createTrip: "Créer un voyage",
          
          // Budget Options
          budgetOptions: {
            any: "N'importe quel budget",
            budget: "Budget serré",
            sensible: "Prix raisonnable",
            upscale: "Haut de gamme",
            luxury: "Luxe"
          },
          
          // Common actions
          update: "Mettre à jour",
          logout: "Se déconnecter",
          loggingOut: "Déconnexion en cours...",
          sending: "Envoi",
          
          // Sub Navigation
          chat: "Chat",
          search: "Rechercher",
          social: "Social",
          agents: "Agents",
          
          // Chat Interface
          travelAssistant: "Assistant de Voyage",
          planningAdventure: "Planifier votre prochaine aventure",
          askAnything: "Demandez n'importe quoi...",
          takeMe: "TakeMeTo.ai",
          canMakeMistakes: "peut faire des erreurs",
          checkImportantInfo: "Vérifier les informations importantes",
          whatCanIAsk: "Que puis-je demander à TakeMeTo.ai?",
          examplesTitle: "Exemples de choses avec lesquelles TakeMeTo.ai peut vous aider",
          
          // Welcome Message
          welcomeGreeting: "Où puis-je vous emmener aujourd'hui, {{name}}?",
          assistantIntro: "Salut! Je suis là pour vous aider à planifier votre expérience. Demandez-moi n'importe quoi lié aux voyages.",
          
          // Sidebar
          viewAllHotels: "Voir tous les hôtels",
          topAttractions: "Principales Attractions",
          travelTips: "Conseils de Voyage",
          planItinerary: "Planifier l'itinéraire",
          bookHotels: "Réserver des hôtels",
          
          // Travel Tips
          bestTimeToVisit: "Meilleure période pour visiter",
          gettingAround: "Se déplacer",
          
          // Map
          munichMap: "Carte de Munich",
          
          // Languages
          languages: {
            en: "🇺🇸 English",
            de: "🇩🇪 Deutsch", 
            es: "🇪🇸 Español",
            fr: "🇫🇷 Français"
          },
          
          // Common
          population: "Population",
          currentWeather: "Météo actuelle",
          recommendedHotels: "Hôtels Recommandés",
          from: "À partir de",
          night: "/nuit",
          favorites: "Favoris",
          addToTrip: "Ajouter au voyage",
          addToFavorites: "Ajouter aux favoris",
          addedToFavorites: "Ajouté aux favoris",
          addedToTrip: "Ajouté au voyage",
          errorAddingToFavorites: "Erreur lors de l'ajout aux favoris",
          errorAddingToTrip: "Erreur lors de l'ajout au voyage",
          
          // Action Icons
          actionIcons: {
            hotels: "Hôtels",
            restaurants: "Restaurants",
            attractions: "Attractions",
            shopping: "Shopping",
            parks: "Parcs",
            cafes: "Cafés",
            transport: "Transport",
            nearby: "À proximité"
          },
          
          // Initial Messages
          welcomeMessage: "Bonjour ! Je suis votre assistant de voyage personnel. Je suis là pour vous aider à planifier le voyage parfait. Où aimeriez-vous aller aujourd'hui ?",
          
          // Authentication
          auth: {
            // Common
            welcome: "Bienvenue",
            welcomeBack: "Bienvenu de retour",
            welcomeToTakeMeTo: "Bienvenue sur TakeMeTo.ai",
            signInToContinue: "Connectez-vous pour continuer votre planification de voyage",
            createAccount: "Créez votre compte pour une planification de voyage intelligente",
            signIn: "Se connecter",
            signUp: "S'inscrire",
            register: "S'inscrire",
            or: "ou",
            dontHaveAccount: "Vous n'avez pas de compte ?",
            alreadyHaveAccount: "Vous avez déjà un compte ?",
            continueWithGoogle: "Continuer avec Google",
            continueWithApple: "Continuer avec Apple",
            agreeToTerms: "En continuant, vous acceptez nos Conditions d'Utilisation et notre Politique de Confidentialité",
            byContinuing: "En continuant vous acceptez nos",
            termsOfService: "Conditions d'Utilisation",
            andConfirm: "et confirmez que vous avez lu notre",
            privacyPolicy: "Politique de Confidentialité",
            haveRead: ".",
            
            // Form fields
            firstName: "Prénom",
            lastName: "Nom",
            email: "Adresse e-mail",
            password: "Mot de passe",
            confirmPassword: "Confirmer le mot de passe",
            
            // Placeholders
            enterFirstName: "Entrez votre prénom",
            enterLastName: "Entrez votre nom",
            enterEmail: "Entrez votre adresse e-mail",
            enterPassword: "Entrez votre mot de passe",
            confirmYourPassword: "Confirmez votre mot de passe",
            
            // Validation messages
            validationErrors: {
              emailRequired: "L'adresse e-mail est obligatoire",
              emailInvalid: "Adresse e-mail invalide",
              passwordRequired: "Le mot de passe est obligatoire",
              passwordMinLength: "Le mot de passe doit contenir au moins 8 caractères",
              passwordUppercase: "Le mot de passe doit contenir au moins une majuscule",
              passwordLowercase: "Le mot de passe doit contenir au moins une minuscule",
              passwordNumber: "Le mot de passe doit contenir au moins un chiffre",
              passwordsNoMatch: "Les mots de passe ne correspondent pas",
              firstNameRequired: "Le prénom est obligatoire",
              firstNameMinLength: "Le prénom doit contenir au moins 2 caractères",
              lastNameRequired: "Le nom est obligatoire",
              lastNameMinLength: "Le nom doit contenir au moins 2 caractères"
            },
            
            // Error messages
            errors: {
              loginFailed: "Échec de la connexion",
              registerFailed: "Échec de l'inscription",
              googleNotImplemented: "La connexion avec Google est en cours d'implémentation",
              appleNotImplemented: "La connexion avec Apple est en cours d'implémentation",
              genericError: "Une erreur s'est produite. Veuillez réessayer."
            },
            
            // Toast messages
            toasts: {
              loginSuccess: "Connexion réussie",
              loginWelcomeBack: "Bienvenu de retour, {{name}} !",
              loginFailed: "Échec de la connexion",
              registerSuccess: "Inscription réussie",
              registerWelcome: "Bienvenue sur TakeMeTo.ai, {{name}} !",
              registerFailed: "Échec de l'inscription",
              googleLoginSuccess: "Connexion Google réussie",
              googleLoginWelcome: "Bienvenue, {{name}} !",
              googleLoginFailed: "Échec de la connexion Google",
              logoutSuccess: "Déconnexion réussie",
              logoutGoodbye: "Au revoir !",
              logoutFailed: "Échec de la déconnexion",
              profileUpdateSuccess: "Profil mis à jour",
              profileUpdateDescription: "Vos modifications ont été sauvegardées.",
              profileUpdateFailed: "Échec de la mise à jour du profil"
            }
          },
          
          // Status
          justNow: "À l'instant",
          minutesAgo: "il y a {{count}} minutes",
          hoursAgo: "il y a {{count}} heures",
          
          // Error Messages
          failedToLoad: "Échec du chargement des données",
          tryAgain: "Réessayer",
          noMessages: "Pas encore de messages",
          startConversation: "Commencez une conversation sur vos projets de voyage !",
          
          // Itinerary
          itinerary: {
            culturalDiscovery: "Découverte Culturelle",
            day: "Jour",
            hour: "heure",
            hours: "heures",
            minute: "minute", 
            minutes: "minutes",
            free: "Gratuit",
            cost: "Coût",
            duration: "Durée",
            location: "Lieu"
          },
          
          // Trip Modal
          trip: {
            receipt: "Reçu",
            addCustom: "Ajouter personnalisé",
            searchPlaces: "Rechercher des lieux...",
            searchDestinations: "Rechercher des destinations, lieux",
            orExperiences: "ou expériences.",
            previouslySaved: "Précédemment enregistré pour cet endroit",
            mentionedInChat: "Mentionné dans ce chat"
          },
          
          // Trip Planner
          tripPlanner: {
            planner: "Planificateur de Voyage",
            close: "Fermer le Voyage"
          }
        }
      }
    }
  });

export default i18n;
