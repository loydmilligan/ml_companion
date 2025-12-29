# Talking Music League - UI Migration Plan

## Overview

**Goal:** Transform from dashboard-centric to chat-centric experience with mobile-first design.

**Key Changes:**
- Chat becomes the default landing page
- Bottom navigation on mobile (4 items: Chat, Round, History, Settings)
- Sidebar navigation on desktop (with admin section for admin users only)
- Dashboard removed as hub; widgets redistributed or eliminated
- All admin functionality moved to dedicated Admin Panel

---

## New Route Structure

```
/                     → Redirects to /chat/general
/chat/general         → General group chat (DEFAULT)
/chat/round/:roundId  → Round-specific chat
/round                → Current round details
/history              → Season 1 content hub
/history/leaderboard  → Final standings
/history/my-picks     → User's Season 1 submissions
/history/rounds       → All Season 1 rounds
/history/connections  → Song Connection AI feature
/settings             → User settings (profile + notifications)
/admin                → Admin panel (admin-only)
/admin/import         → Import season data
/admin/competitors    → Manage competitors
/admin/rounds         → Add/manage rounds
```

---

## Phase 1: Foundation (Navigation & Layout)

### Task 1.1: Create Bottom Navigation Component

**File:** `src/components/navigation/BottomNav.jsx`

```jsx
import { NavLink, useLocation } from 'react-router-dom';
import { MessageCircle, Music, Clock, Settings } from 'lucide-react';

const navItems = [
  { to: '/chat/general', icon: MessageCircle, label: 'Chat', matchPath: '/chat' },
  { to: '/round', icon: Music, label: 'Round' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const location = useLocation();

  const isActive = (item) => {
    if (item.matchPath) {
      return location.pathname.startsWith(item.matchPath);
    }
    return location.pathname === item.to || location.pathname.startsWith(item.to);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active 
                  ? 'text-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={24} strokeWidth={active ? 2.5 : 2} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
```

---

### Task 1.2: Create Desktop Sidebar Component

**File:** `src/components/navigation/Sidebar.jsx`

```jsx
import { NavLink, useLocation } from 'react-router-dom';
import { 
  MessageCircle, 
  Music, 
  Clock, 
  Settings, 
  Shield,
  ChevronDown,
  ChevronRight 
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth'; // Adjust to your auth hook

export function Sidebar({ rounds = [], unreadCounts = {} }) {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'lead'; // Adjust to your role check
  
  const [expandedSections, setExpandedSections] = useState({
    rounds: true,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-gray-50 border-r border-gray-200 h-screen sticky top-0">
      {/* Logo/Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="font-bold text-lg text-gray-900">Talking Music League</h1>
        <p className="text-xs text-gray-500">Your league, connected.</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        
        {/* Chats Section */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Chats
          </p>
          
          {/* General Chat */}
          <NavLink
            to="/chat/general"
            className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              isActive('/chat/general')
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <MessageCircle size={18} />
              General
            </span>
            {unreadCounts.general > 0 && (
              <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCounts.general}
              </span>
            )}
          </NavLink>

          {/* Round Chats */}
          <button
            onClick={() => toggleSection('rounds')}
            className="flex items-center justify-between w-full px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg mt-1"
          >
            <span className="text-sm font-medium">Rounds</span>
            {expandedSections.rounds ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {expandedSections.rounds && (
            <div className="ml-4 space-y-1">
              {rounds.map((round) => (
                <NavLink
                  key={round.id}
                  to={`/chat/round/${round.id}`}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive(`/chat/round/${round.id}`)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="truncate flex items-center gap-2">
                    <Music size={14} />
                    <span className="truncate">{round.theme}</span>
                  </span>
                  {round.isCurrent && (
                    <span className="w-2 h-2 bg-green-500 rounded-full" title="Current round" />
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <hr className="border-gray-200 my-3" />

        {/* History Section */}
        <NavLink
          to="/history"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            isActive('/history')
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Clock size={18} />
          History
        </NavLink>

        {/* Settings */}
        <NavLink
          to="/settings"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            isActive('/settings')
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Settings size={18} />
          Settings
        </NavLink>

        {/* Admin Section - Only visible to admins */}
        {isAdmin && (
          <>
            <hr className="border-gray-200 my-3" />
            <NavLink
              to="/admin"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/admin')
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Shield size={18} />
              Admin Panel
            </NavLink>
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500">{isAdmin ? 'Admin' : 'Member'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

---

### Task 1.3: Create Main Layout Component

**File:** `src/components/layout/MainLayout.jsx`

```jsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../navigation/Sidebar';
import { BottomNav } from '../navigation/BottomNav';
import { useRounds } from '../../hooks/useRounds'; // Adjust to your data hook

export function MainLayout() {
  const { rounds } = useRounds();
  
  // Transform rounds for sidebar display
  const sidebarRounds = rounds?.map(r => ({
    id: r.id,
    theme: r.theme,
    isCurrent: r.status === 'open' || r.status === 'voting',
  })) || [];

  return (
    <div className="flex min-h-screen bg-white">
      {/* Desktop Sidebar */}
      <Sidebar rounds={sidebarRounds} />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col pb-16 md:pb-0">
        <Outlet />
      </main>
      
      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
}
```

---

### Task 1.4: Create Chat Header Component

**File:** `src/components/chat/ChatHeader.jsx`

```jsx
import { Menu, Clock } from 'lucide-react';
import { useCurrentRound } from '../../hooks/useCurrentRound'; // Adjust to your hook
import { formatDistanceToNow } from 'date-fns';

export function ChatHeader({ title, onMenuClick }) {
  const { currentRound } = useCurrentRound();
  
  // Calculate time until next deadline
  const getDeadlineInfo = () => {
    if (!currentRound) return null;
    
    const now = new Date();
    const submissionDeadline = new Date(currentRound.submission_deadline);
    const votingDeadline = new Date(currentRound.voting_deadline);
    
    if (now < submissionDeadline) {
      return {
        label: 'Submit',
        time: formatDistanceToNow(submissionDeadline, { addSuffix: false }),
      };
    } else if (now < votingDeadline) {
      return {
        label: 'Vote',
        time: formatDistanceToNow(votingDeadline, { addSuffix: false }),
      };
    }
    return null;
  };

  const deadline = getDeadlineInfo();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-1 -ml-1 text-gray-500 hover:text-gray-700"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>

        {/* Deadline indicator */}
        {deadline && (
          <button
            className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
            title={`${deadline.label} deadline`}
          >
            <Clock size={14} />
            <span>{deadline.time}</span>
          </button>
        )}
      </div>
    </header>
  );
}
```

---

### Task 1.5: Create Mobile Slide-Out Menu

**File:** `src/components/navigation/MobileMenu.jsx`

```jsx
import { X, MessageCircle, Music, Clock, Settings, Shield } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function MobileMenu({ isOpen, onClose, rounds = [] }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'lead';

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 md:hidden"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="fixed inset-y-0 left-0 w-72 bg-white z-50 md:hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-bold text-lg">Menu</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {/* Chats */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Chats
          </p>
          
          <NavLink
            to="/chat/general"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <MessageCircle size={20} />
            General Chat
          </NavLink>

          {rounds.map((round) => (
            <NavLink
              key={round.id}
              to={`/chat/round/${round.id}`}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 ml-2"
            >
              <Music size={18} />
              <span className="truncate">{round.theme}</span>
              {round.isCurrent && (
                <span className="w-2 h-2 bg-green-500 rounded-full ml-auto" />
              )}
            </NavLink>
          ))}

          <hr className="my-4 border-gray-200" />

          <NavLink
            to="/history"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <Clock size={20} />
            History
          </NavLink>

          <NavLink
            to="/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <Settings size={20} />
            Settings
          </NavLink>

          {isAdmin && (
            <>
              <hr className="my-4 border-gray-200" />
              <NavLink
                to="/admin"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-orange-700 hover:bg-orange-50"
              >
                <Shield size={20} />
                Admin Panel
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </>
  );
}
```

---

## Phase 2: Route Configuration

### Task 2.1: Update Router Configuration

**File:** `src/router.jsx` (or wherever your routes are defined)

```jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';

// Chat pages
import { GeneralChat } from './pages/chat/GeneralChat';
import { RoundChat } from './pages/chat/RoundChat';

// Other pages
import { RoundPage } from './pages/RoundPage';
import { HistoryPage } from './pages/history/HistoryPage';
import { LeaderboardPage } from './pages/history/LeaderboardPage';
import { MyPicksPage } from './pages/history/MyPicksPage';
import { RoundsHistoryPage } from './pages/history/RoundsHistoryPage';
import { ConnectionsPage } from './pages/history/ConnectionsPage';
import { SettingsPage } from './pages/SettingsPage';

// Admin pages
import { AdminPanel } from './pages/admin/AdminPanel';
import { ImportPage } from './pages/admin/ImportPage';
import { CompetitorsPage } from './pages/admin/CompetitorsPage';
import { ManageRoundsPage } from './pages/admin/ManageRoundsPage';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { OnboardingPage } from './pages/auth/OnboardingPage';

export const router = createBrowserRouter([
  // Root redirect
  {
    path: '/',
    element: <Navigate to="/chat/general" replace />,
  },
  
  // Auth routes (no layout)
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/onboarding',
    element: <ProtectedRoute><OnboardingPage /></ProtectedRoute>,
  },

  // Main app routes
  {
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      // Chat routes
      {
        path: '/chat/general',
        element: <GeneralChat />,
      },
      {
        path: '/chat/round/:roundId',
        element: <RoundChat />,
      },

      // Current round
      {
        path: '/round',
        element: <RoundPage />,
      },

      // History routes
      {
        path: '/history',
        element: <HistoryPage />,
      },
      {
        path: '/history/leaderboard',
        element: <LeaderboardPage />,
      },
      {
        path: '/history/my-picks',
        element: <MyPicksPage />,
      },
      {
        path: '/history/rounds',
        element: <RoundsHistoryPage />,
      },
      {
        path: '/history/connections',
        element: <ConnectionsPage />,
      },

      // Settings
      {
        path: '/settings',
        element: <SettingsPage />,
      },

      // Admin routes
      {
        path: '/admin',
        element: <AdminRoute><AdminPanel /></AdminRoute>,
      },
      {
        path: '/admin/import',
        element: <AdminRoute><ImportPage /></AdminRoute>,
      },
      {
        path: '/admin/competitors',
        element: <AdminRoute><CompetitorsPage /></AdminRoute>,
      },
      {
        path: '/admin/rounds',
        element: <AdminRoute><ManageRoundsPage /></AdminRoute>,
      },
    ],
  },

  // Legacy redirects (keep old URLs working during transition)
  {
    path: '/dashboard',
    element: <Navigate to="/chat/general" replace />,
  },
  {
    path: '/group-chat',
    element: <Navigate to="/chat/general" replace />,
  },
]);
```

---

### Task 2.2: Create AdminRoute Guard

**File:** `src/components/auth/AdminRoute.jsx`

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function AdminRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user || user.role !== 'lead') {
    return <Navigate to="/chat/general" replace />;
  }

  return children;
}
```

---

## Phase 3: Core Pages

### Task 3.1: Create Chat Page Template

**File:** `src/pages/chat/GeneralChat.jsx`

```jsx
import { useState, useEffect, useRef } from 'react';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { MobileMenu } from '../../components/navigation/MobileMenu';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatInput } from '../../components/chat/ChatInput';
import { useMessages } from '../../hooks/useMessages';
import { useRounds } from '../../hooks/useRounds';

export function GeneralChat() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { messages, sendMessage, isLoading } = useMessages('general');
  const { rounds } = useRounds();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sidebarRounds = rounds?.map(r => ({
    id: r.id,
    theme: r.theme,
    isCurrent: r.status === 'open' || r.status === 'voting',
  })) || [];

  return (
    <div className="flex flex-col h-screen md:h-auto md:min-h-screen">
      <ChatHeader 
        title="General Chat" 
        onMenuClick={() => setMenuOpen(true)} 
      />
      
      <MobileMenu 
        isOpen={menuOpen} 
        onClose={() => setMenuOpen(false)}
        rounds={sidebarRounds}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
```

---

### Task 3.2: Create Chat Message Component with YouTube Embed

**File:** `src/components/chat/ChatMessage.jsx`

```jsx
import { formatDistanceToNow } from 'date-fns';
import { YouTubeEmbed } from './YouTubeEmbed';

// Extract YouTube ID from various URL formats
const getYouTubeId = (text) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Parse message content for links
const parseMessageContent = (content) => {
  const youtubeId = getYouTubeId(content);
  
  // Simple URL detection
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  
  return { parts, youtubeId };
};

export function ChatMessage({ message }) {
  const { parts, youtubeId } = parseMessageContent(message.content);
  const isOwnMessage = message.isOwn; // You'll need to determine this based on current user

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] md:max-w-[70%] ${isOwnMessage ? 'order-2' : ''}`}>
        {/* Sender name (for others' messages) */}
        {!isOwnMessage && (
          <p className="text-xs font-medium text-gray-500 mb-1 ml-1">
            {message.sender_name}
          </p>
        )}
        
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwnMessage
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {/* Message text */}
          <p className="text-sm whitespace-pre-wrap break-words">
            {parts.map((part, i) => {
              // Check if part is a URL
              if (part.match(/^https?:\/\//)) {
                return (
                  <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`underline break-all ${
                      isOwnMessage ? 'text-indigo-200' : 'text-indigo-600'
                    }`}
                  >
                    {part}
                  </a>
                );
              }
              return part;
            })}
          </p>
        </div>

        {/* YouTube embed (if detected) */}
        {youtubeId && (
          <div className="mt-2">
            <YouTubeEmbed videoId={youtubeId} />
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? 'text-right mr-1' : 'ml-1'}`}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
```

---

### Task 3.3: Create YouTube Embed Component

**File:** `src/components/chat/YouTubeEmbed.jsx`

```jsx
import { useState } from 'react';
import { Play } from 'lucide-react';

export function YouTubeEmbed({ videoId }) {
  const [loaded, setLoaded] = useState(false);
  
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  if (!loaded) {
    // Show thumbnail with play button (saves bandwidth, faster load)
    return (
      <button
        onClick={() => setLoaded(true)}
        className="relative block w-full max-w-sm rounded-lg overflow-hidden group"
      >
        <img
          src={thumbnailUrl}
          alt="YouTube video thumbnail"
          className="w-full aspect-video object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play size={28} className="text-white ml-1" fill="white" />
          </div>
        </div>
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-white text-xs">
          YouTube
        </div>
      </button>
    );
  }

  return (
    <div className="relative w-full max-w-sm rounded-lg overflow-hidden">
      <div className="aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
}
```

---

### Task 3.4: Create Chat Input Component

**File:** `src/components/chat/ChatInput.jsx`

```jsx
import { useState, useRef } from 'react';
import { Send, Music } from 'lucide-react';

export function ChatInput({ onSend, disabled = false }) {
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;
    
    onSend(message.trim());
    setMessage('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (but not Shift+Enter for multiline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="sticky bottom-16 md:bottom-0 bg-white border-t border-gray-200 px-4 py-3"
    >
      <div className="flex items-end gap-2">
        {/* Optional: Music link helper button */}
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Share a song link"
          onClick={() => {
            // Could open a modal or just focus input with hint
            inputRef.current?.focus();
          }}
        >
          <Music size={20} />
        </button>

        {/* Input field */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-2 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              // Auto-resize textarea
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
}
```

---

### Task 3.5: Create Round Page

**File:** `src/pages/RoundPage.jsx`

```jsx
import { Link } from 'react-router-dom';
import { Clock, Calendar, ExternalLink, MessageCircle } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { useCurrentRound } from '../hooks/useCurrentRound';

const statusConfig = {
  open: { label: 'Open for Submissions', color: 'bg-green-100 text-green-800' },
  voting: { label: 'Voting Open', color: 'bg-blue-100 text-blue-800' },
  closed: { label: 'Voting Closed', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-600' },
};

export function RoundPage() {
  const { currentRound, isLoading } = useCurrentRound();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!currentRound) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No active round at the moment.</p>
      </div>
    );
  }

  const status = statusConfig[currentRound.status] || statusConfig.open;
  const submissionDeadline = new Date(currentRound.submission_deadline);
  const votingDeadline = new Date(currentRound.voting_deadline);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="text-sm text-gray-500">Round {currentRound.number}</span>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
          {currentRound.theme}
        </h1>
        <span className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Deadlines */}
      <div className="space-y-4 mb-8">
        {/* Submission Deadline */}
        <div className={`p-4 rounded-xl border ${isPast(submissionDeadline) ? 'border-gray-200 bg-gray-50' : 'border-indigo-200 bg-indigo-50'}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isPast(submissionDeadline) ? 'bg-gray-200' : 'bg-indigo-200'}`}>
              <Calendar size={20} className={isPast(submissionDeadline) ? 'text-gray-600' : 'text-indigo-700'} />
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${isPast(submissionDeadline) ? 'text-gray-500' : 'text-gray-900'}`}>
                Submissions Due
              </h3>
              <p className={`text-sm ${isPast(submissionDeadline) ? 'text-gray-400' : 'text-gray-600'}`}>
                {format(submissionDeadline, 'EEEE, MMMM d @ h:mm a')}
              </p>
              {!isPast(submissionDeadline) && (
                <p className="text-sm font-medium text-indigo-600 mt-1">
                  {formatDistanceToNow(submissionDeadline, { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Voting Deadline */}
        <div className={`p-4 rounded-xl border ${isPast(votingDeadline) ? 'border-gray-200 bg-gray-50' : 'border-indigo-200 bg-indigo-50'}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isPast(votingDeadline) ? 'bg-gray-200' : 'bg-indigo-200'}`}>
              <Clock size={20} className={isPast(votingDeadline) ? 'text-gray-600' : 'text-indigo-700'} />
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${isPast(votingDeadline) ? 'text-gray-500' : 'text-gray-900'}`}>
                Voting Due
              </h3>
              <p className={`text-sm ${isPast(votingDeadline) ? 'text-gray-400' : 'text-gray-600'}`}>
                {format(votingDeadline, 'EEEE, MMMM d @ h:mm a')}
              </p>
              {!isPast(votingDeadline) && !isPast(submissionDeadline) && (
                <p className="text-sm text-gray-500 mt-1">
                  After submissions close
                </p>
              )}
              {!isPast(votingDeadline) && isPast(submissionDeadline) && (
                <p className="text-sm font-medium text-indigo-600 mt-1">
                  {formatDistanceToNow(votingDeadline, { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link
          to={`/chat/round/${currentRound.id}`}
          className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          <MessageCircle size={20} />
          Discuss This Round
        </Link>

        {currentRound.music_league_url && (
          <a
            href={currentRound.music_league_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <ExternalLink size={20} />
            Open in Music League
          </a>
        )}
      </div>

      {/* Description (if any) */}
      {currentRound.description && (
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-2">About This Round</h3>
          <p className="text-gray-600 text-sm">{currentRound.description}</p>
        </div>
      )}
    </div>
  );
}
```

---

### Task 3.6: Create History Hub Page

**File:** `src/pages/history/HistoryPage.jsx`

```jsx
import { Link } from 'react-router-dom';
import { Trophy, User, List, Sparkles, ExternalLink } from 'lucide-react';
import { useSeason1Stats } from '../../hooks/useSeason1Stats';

const menuItems = [
  {
    to: '/history/leaderboard',
    icon: Trophy,
    label: 'Leaderboard',
    description: 'Final Season 1 standings',
  },
  {
    to: '/history/my-picks',
    icon: User,
    label: 'My Picks',
    description: 'Your Season 1 submissions',
  },
  {
    to: '/history/rounds',
    icon: List,
    label: 'All Rounds',
    description: 'Browse every round',
  },
  {
    to: '/history/connections',
    icon: Sparkles,
    label: 'Song Connections',
    description: 'AI-powered song trivia',
  },
];

export function HistoryPage() {
  const { stats } = useSeason1Stats();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Season 1 History</h1>
      <p className="text-gray-500 mb-6">Relive the memories from our first season.</p>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{stats.totalRounds}</p>
            <p className="text-xs text-gray-600">Rounds</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.totalSubmissions}</p>
            <p className="text-xs text-gray-600">Songs</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.totalVotes}</p>
            <p className="text-xs text-gray-600">Votes</p>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
            >
              <div className="p-2 bg-gray-100 rounded-lg">
                <Icon size={24} className="text-gray-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.label}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Playlists Section */}
      <div className="mt-8">
        <h2 className="font-semibold text-gray-900 mb-3">Season 1 Playlists</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {/* Replace with actual playlist data */}
          {['All Songs', 'Round 1', 'Round 2', 'Round 3'].map((playlist) => (
            <a
              key={playlist}
              href="#" // Replace with actual Spotify/Apple Music link
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-32 p-3 bg-gray-900 rounded-xl text-center hover:bg-gray-800 transition-colors"
            >
              <p className="text-white text-sm font-medium truncate">{playlist}</p>
              <ExternalLink size={14} className="text-gray-400 mx-auto mt-1" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### Task 3.7: Create Settings Page

**File:** `src/pages/SettingsPage.jsx`

```jsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { Bell, Mail, Smartphone, User, LogOut } from 'lucide-react';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { settings, updateSettings, isLoading } = useNotificationSettings();
  
  const [ntfyTopic, setNtfyTopic] = useState(settings?.ntfyTopic || '');

  const handleMethodToggle = (method) => {
    updateSettings({
      ...settings,
      methods: {
        ...settings.methods,
        [method]: !settings.methods[method],
      },
    });
  };

  const handleEventToggle = (event) => {
    updateSettings({
      ...settings,
      events: {
        ...settings.events,
        [event]: !settings.events[event],
      },
    });
  };

  const handleNtfyTopicSave = () => {
    updateSettings({
      ...settings,
      ntfyTopic,
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Profile Section */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Profile
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Edit
            </button>
          </div>
        </div>
      </section>

      {/* Notification Methods */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Notification Methods
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {/* Browser Push */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Browser Push</p>
                <p className="text-sm text-gray-500">Desktop & mobile notifications</p>
              </div>
            </div>
            <ToggleSwitch
              enabled={settings?.methods?.push}
              onChange={() => handleMethodToggle('push')}
            />
          </div>

          {/* Email */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <ToggleSwitch
              enabled={settings?.methods?.email}
              onChange={() => handleMethodToggle('email')}
            />
          </div>

          {/* ntfy */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Smartphone size={20} className="text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">ntfy</p>
                  <p className="text-sm text-gray-500">Push via ntfy.mattmariani.com</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings?.methods?.ntfy}
                onChange={() => handleMethodToggle('ntfy')}
              />
            </div>
            {settings?.methods?.ntfy && (
              <div className="ml-8 mt-3">
                <label className="text-sm text-gray-600 block mb-1">Topic name:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ntfyTopic}
                    onChange={(e) => setNtfyTopic(e.target.value)}
                    placeholder="your-topic-name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleNtfyTopicSave}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Notification Events */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Notify Me About
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {[
            { key: 'chatMessage', label: 'New chat messages' },
            { key: 'roundOpened', label: 'New round opened' },
            { key: 'deadlineReminder', label: 'Deadline reminders' },
            { key: 'votingOpened', label: 'Voting opened' },
            { key: 'resultsPosted', label: 'Results posted' },
          ].map((event) => (
            <div key={event.key} className="flex items-center justify-between p-4">
              <p className="font-medium text-gray-900">{event.label}</p>
              <ToggleSwitch
                enabled={settings?.events?.[event.key]}
                onChange={() => handleEventToggle(event.key)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Sign Out */}
      <button
        onClick={signOut}
        className="flex items-center justify-center gap-2 w-full py-3 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
      >
        <LogOut size={20} />
        Sign Out
      </button>
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-indigo-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
```

---

## Phase 4: Admin Panel

### Task 4.1: Create Admin Panel Hub

**File:** `src/pages/admin/AdminPanel.jsx`

```jsx
import { Link } from 'react-router-dom';
import { Upload, Users, ListPlus, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { useCurrentRound } from '../../hooks/useCurrentRound';

const adminItems = [
  {
    to: '/admin/import',
    icon: Upload,
    label: 'Import Season Data',
    description: 'Upload CSV files from Music League export',
  },
  {
    to: '/admin/competitors',
    icon: Users,
    label: 'Manage Competitors',
    description: 'Add or edit league members',
  },
  {
    to: '/admin/rounds',
    icon: ListPlus,
    label: 'Manage Rounds',
    description: 'Add new rounds, edit themes',
  },
];

export function AdminPanel() {
  const { currentRound } = useCurrentRound();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h1>
      <p className="text-gray-500 mb-6">Manage your Music League companion app.</p>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button className="flex flex-col items-center gap-2 p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
          <LinkIcon size={24} className="text-indigo-600" />
          <span className="text-sm font-medium text-indigo-700">Generate Invite</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
          <RefreshCw size={24} className="text-green-600" />
          <span className="text-sm font-medium text-green-700">Sync Round</span>
        </button>
      </div>

      {/* Current Round Status */}
      {currentRound && (
        <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-2">Current Round</h2>
          <p className="text-gray-600">{currentRound.theme}</p>
          <p className="text-sm text-gray-500">Status: {currentRound.status}</p>
        </div>
      )}

      {/* Admin Menu Items */}
      <div className="space-y-3">
        {adminItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
            >
              <div className="p-2 bg-orange-100 rounded-lg">
                <Icon size={24} className="text-orange-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.label}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Phase 5: Cleanup & Polish

### Task 5.1: File/Folder Restructure

Suggested final folder structure:

```
src/
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.jsx
│   │   └── AdminRoute.jsx
│   ├── chat/
│   │   ├── ChatHeader.jsx
│   │   ├── ChatInput.jsx
│   │   ├── ChatMessage.jsx
│   │   └── YouTubeEmbed.jsx
│   ├── layout/
│   │   └── MainLayout.jsx
│   ├── navigation/
│   │   ├── BottomNav.jsx
│   │   ├── Sidebar.jsx
│   │   └── MobileMenu.jsx
│   └── ui/
│       ├── ToggleSwitch.jsx
│       ├── StatusPill.jsx
│       └── LoadingSpinner.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useMessages.js
│   ├── useRounds.js
│   ├── useCurrentRound.js
│   ├── useNotificationSettings.js
│   └── useSeason1Stats.js
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   └── OnboardingPage.jsx
│   ├── chat/
│   │   ├── GeneralChat.jsx
│   │   └── RoundChat.jsx
│   ├── history/
│   │   ├── HistoryPage.jsx
│   │   ├── LeaderboardPage.jsx
│   │   ├── MyPicksPage.jsx
│   │   ├── RoundsHistoryPage.jsx
│   │   └── ConnectionsPage.jsx
│   ├── admin/
│   │   ├── AdminPanel.jsx
│   │   ├── ImportPage.jsx
│   │   ├── CompetitorsPage.jsx
│   │   └── ManageRoundsPage.jsx
│   ├── RoundPage.jsx
│   └── SettingsPage.jsx
├── router.jsx
└── App.jsx
```

---

### Task 5.2: Delete/Archive Old Files

Files to remove or archive after migration:

```
# Old dashboard-centric files to remove:
- src/pages/Dashboard.jsx (or similar)
- src/components/widgets/CurrentRoundWidget.jsx (merged into RoundPage)
- src/components/widgets/GroupChatPreview.jsx (no longer needed)
- src/components/widgets/GettingStarted.jsx (move to onboarding or help)
- src/components/widgets/LeagueSnapshot.jsx (merged or removed)

# Keep but relocate:
- Season 1 widget components → history/ pages
- Song Connection widget → /history/connections page
```

---

### Task 5.3: Add Legacy Route Redirects

Already included in router.jsx, but ensure these redirects are in place for any bookmarked URLs:

```jsx
// In router.jsx
{
  path: '/dashboard',
  element: <Navigate to="/chat/general" replace />,
},
{
  path: '/group-chat',
  element: <Navigate to="/chat/general" replace />,
},
{
  path: '/leaderboard',
  element: <Navigate to="/history/leaderboard" replace />,
},
{
  path: '/profile',
  element: <Navigate to="/settings" replace />,
},
```

---

## Migration Checklist

### Phase 1: Foundation ✓
- [ ] Create `BottomNav.jsx`
- [ ] Create `Sidebar.jsx`
- [ ] Create `MainLayout.jsx`
- [ ] Create `ChatHeader.jsx`
- [ ] Create `MobileMenu.jsx`
- [ ] Install dependencies: `lucide-react`, `date-fns` (if not already)

### Phase 2: Routes ✓
- [ ] Update router configuration
- [ ] Create `AdminRoute.jsx` guard
- [ ] Add legacy redirects
- [ ] Change default route from `/dashboard` to `/chat/general`

### Phase 3: Core Pages ✓
- [ ] Create `GeneralChat.jsx`
- [ ] Create `RoundChat.jsx` (similar to GeneralChat, uses roundId param)
- [ ] Create `ChatMessage.jsx` with YouTube embed
- [ ] Create `YouTubeEmbed.jsx`
- [ ] Create `ChatInput.jsx`
- [ ] Create `RoundPage.jsx`
- [ ] Create `HistoryPage.jsx`
- [ ] Create `SettingsPage.jsx`

### Phase 4: Admin ✓
- [ ] Create `AdminPanel.jsx`
- [ ] Move existing admin widgets to admin pages
- [ ] Ensure admin routes are protected

### Phase 5: Cleanup ✓
- [ ] Reorganize folder structure
- [ ] Delete/archive unused dashboard widgets
- [ ] Test all routes
- [ ] Test mobile navigation
- [ ] Test desktop sidebar
- [ ] Verify admin-only visibility

---

## Notes & Considerations

### Mobile Viewport Height
The chat page uses `h-screen` which can be problematic on mobile browsers with dynamic toolbars. Consider using:

```css
/* In your global CSS */
:root {
  --vh: 1vh;
}

/* Apply to chat container */
.chat-container {
  height: calc(var(--vh, 1vh) * 100);
}
```

```jsx
// In App.jsx or a useEffect
useEffect(() => {
  const setVh = () => {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  };
  setVh();
  window.addEventListener('resize', setVh);
  return () => window.removeEventListener('resize', setVh);
}, []);
```

### Bottom Nav Safe Area (iOS)
For iPhone notch/home indicator:

```jsx
// In BottomNav.jsx, add padding-bottom
<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 pb-safe">
```

```css
/* In global CSS */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Chat Polling
Your current 5-10 second polling is fine for now. When/if you get Supabase Realtime access, you can swap the polling logic in `useMessages` hook with a subscription.
