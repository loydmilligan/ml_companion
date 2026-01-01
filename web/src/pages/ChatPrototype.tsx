import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Mock data
const mockRound = {
  theme: "Songs That Define a Decade",
  description: "Pick a song that perfectly captures the spirit of any decade - the sound, the feeling, the cultural moment.",
  themeAuthor: "Mom",
  seasonNumber: 2,
  roundNumber: 5,
  status: "open",
  submissionDeadline: new Date(Date.now() + 1000 * 60 * 60 * 3), // 3 hours - URGENT
  votingDeadline: new Date(Date.now() + 1000 * 60 * 60 * 72), // 3 days
  bannerUrl: null // use gradient placeholder
};

const mockSongs = [
  { id: 1, title: "Smells Like Teen Spirit", artist: "Nirvana", submitter: "Dad", year: 1991, artwork: null },
  { id: 2, title: "Billie Jean", artist: "Michael Jackson", submitter: "Mom", year: 1983, artwork: null },
  { id: 3, title: "Bohemian Rhapsody", artist: "Queen", submitter: "Sister", year: 1975, artwork: null },
  { id: 4, title: "Get Lucky", artist: "Daft Punk", submitter: "You", year: 2013, artwork: null }
];

const mockMessagesInitial = [
  { id: 1, author: "Mom", text: "Just submitted mine! This theme is so fun 🎵", time: "2:30 PM", isYou: false, reactions: ["🔥", "❤️"] },
  { id: 2, author: "Dad", text: "Nice! I went with @Smells Like Teen Spirit - nothing says 90s more", time: "2:45 PM", isYou: false, reactions: ["👏"] },
  { id: 3, author: "You", text: "Great pick! I chose @Get Lucky for the 2010s", time: "3:00 PM", isYou: true, reactions: [] },
  { id: 4, author: "Sister", text: "Ooh tough competition this round! @Bohemian Rhapsody is my forever fave", time: "3:15 PM", isYou: false, reactions: ["❤️", "🎵"] },
  { id: 5, author: "Mom", text: "Everyone has such good taste 😊", time: "3:20 PM", isYou: false, reactions: [] },
  { id: 6, author: "You", text: "Can't wait to listen to everyone's picks!", time: "3:25 PM", isYou: true, reactions: ["👍"] }
];

type TabType = "CHAT" | "LISTEN" | "ROUND";
type ViewType = "CHAT" | "HISTORY" | "SETTINGS";

// Dual pressure gauge component
function PressureGauge({
  label,
  deadline,
  now
}: {
  label: string;
  deadline: Date;
  now: number;
}) {
  const remaining = deadline.getTime() - now;
  const totalWindow = 1000 * 60 * 60 * 72; // 72 hours
  const percentage = Math.min(100, Math.max(0, (1 - remaining / totalWindow) * 100));

  // Calculate needle rotation (0deg = left/green, 180deg = right/red)
  const needleRotation = (percentage / 100) * 180;

  // Determine color zone
  let color = "#18e0a8"; // green
  let _zone = "safe";
  if (remaining <= 1000 * 60 * 60 * 6) {
    color = "#ff6f61"; // red
    _zone = "urgent";
  } else if (remaining <= 1000 * 60 * 60 * 24) {
    color = "#ffd166"; // yellow
    _zone = "warning";
  }
  void _zone; // Reserved for future styling

  const hours = Math.max(0, Math.floor(remaining / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)));

  return (
    <div className="pressure-gauge">
      <div className="gauge-container">
        <svg width="120" height="80" viewBox="0 0 120 80">
          {/* Background arc */}
          <path
            d="M 20 70 A 50 50 0 0 1 100 70"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Green zone */}
          <path
            d="M 20 70 A 50 50 0 0 1 60 25"
            fill="none"
            stroke="#18e0a8"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.3"
          />
          {/* Yellow zone */}
          <path
            d="M 60 25 A 50 50 0 0 1 85 45"
            fill="none"
            stroke="#ffd166"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.3"
          />
          {/* Red zone */}
          <path
            d="M 85 45 A 50 50 0 0 1 100 70"
            fill="none"
            stroke="#ff6f61"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.3"
          />
          {/* Needle */}
          <g transform="translate(60, 70)">
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-45"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${needleRotation - 90})`}
              style={{
                transition: "transform 0.5s ease",
                transformOrigin: "center"
              }}
            />
            <circle cx="0" cy="0" r="5" fill={color} />
          </g>
        </svg>
      </div>
      <div className="gauge-label">
        <strong>{label}</strong>
        <span className="gauge-time">
          {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
        </span>
      </div>
    </div>
  );
}

export default function ChatPrototype() {
  const _navigate = useNavigate();
  void _navigate; // Reserved for future navigation
  const [activeTab, setActiveTab] = useState<TabType>("CHAT");
  const [activeView, setActiveView] = useState<ViewType>("CHAT");
  const [messages, setMessages] = useState(mockMessagesInitial);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(Date.now());

  // Update current time every minute for gauges
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === "CHAT" || activeTab === "LISTEN") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const newMsg = {
      id: messages.length + 1,
      author: "You",
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isYou: true,
      reactions: []
    };

    setMessages([...messages, newMsg]);
    setNewMessage("");
  };

  const handleAddReaction = (messageId: number, emoji: string) => {
    setMessages(messages.map(msg => {
      if (msg.id === messageId) {
        const hasReaction = msg.reactions.includes(emoji);
        return {
          ...msg,
          reactions: hasReaction
            ? msg.reactions.filter(r => r !== emoji)
            : [...msg.reactions, emoji]
        };
      }
      return msg;
    }));
  };

  const handleMentionSong = (song: typeof mockSongs[0]) => {
    setNewMessage(prev => {
      const mention = `@${song.title}`;
      return prev ? `${prev} ${mention}` : mention;
    });
    setActiveTab("CHAT");
  };

  const emojis = ["🎧", "🔥", "😂", "👏", "❤️", "🎵"];
  const reactionEmojis = ["🔥", "❤️", "👏", "😂", "🎵", "👍"];

  // Render message with @mentions highlighted
  const renderMessageText = (text: string) => {
    const parts = text.split(/(@[\w\s]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("@")) {
        return (
          <span key={idx} className="message-mention">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="prototype-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-brand">
          <div className="brand-mark">ML</div>
          <div>
            <div className="brand-title">Music League</div>
            <div className="brand-subtitle">Family Edition</div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="prototype-tabs">
        <button
          className={`prototype-tab ${activeTab === "CHAT" ? "active" : ""}`}
          onClick={() => setActiveTab("CHAT")}
        >
          CHAT
        </button>
        <button
          className={`prototype-tab ${activeTab === "LISTEN" ? "active" : ""}`}
          onClick={() => setActiveTab("LISTEN")}
        >
          LISTEN
        </button>
        <button
          className={`prototype-tab ${activeTab === "ROUND" ? "active" : ""}`}
          onClick={() => setActiveTab("ROUND")}
        >
          ROUND
        </button>
      </div>

      {/* Main Content Area */}
      <div className="prototype-content">
        {/* CHAT TAB */}
        {activeTab === "CHAT" && (
          <div className="chat-view">
            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.isYou ? "message-you" : "message-other"}`}>
                  <div className="message-bubble">
                    <div className="message-header">
                      <strong>{msg.author}</strong>
                      <span className="message-time">{msg.time}</span>
                    </div>
                    <div className="message-text">
                      {renderMessageText(msg.text)}
                    </div>
                    {msg.reactions.length > 0 && (
                      <div className="message-reactions">
                        {msg.reactions.map((emoji, idx) => (
                          <button
                            key={idx}
                            className="reaction-bubble"
                            onClick={() => handleAddReaction(msg.id, emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="message-reaction-tray">
                    {reactionEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        className="reaction-add-btn"
                        onClick={() => handleAddReaction(msg.id, emoji)}
                        title={`React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Compose Bar */}
            <div className="chat-compose-bar">
              <button
                className="compose-emoji-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                😊
              </button>
              {showEmojiPicker && (
                <div className="emoji-picker">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      className="emoji-option"
                      onClick={() => {
                        setNewMessage(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <input
                type="text"
                className="compose-input"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button
                className="compose-send-btn"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* LISTEN TAB */}
        {activeTab === "LISTEN" && (
          <div className="listen-view">
            {/* Embedded Player Placeholder */}
            <div className="player-container">
              <div className="player-placeholder">
                <div className="player-icon">▶️</div>
                <h3>Now Playing</h3>
                <p className="muted">Embedded player (Spotify/YouTube)</p>
                <div className="player-controls">
                  <button className="player-btn">⏮</button>
                  <button className="player-btn player-btn-large">▶️</button>
                  <button className="player-btn">⏭</button>
                </div>
              </div>
            </div>

            {/* Song Queue */}
            <div className="song-queue">
              <h3>Song Queue</h3>
              {mockSongs.map((song) => (
                <div key={song.id} className="queue-item">
                  <div className="queue-artwork">
                    {song.artwork ? (
                      <img src={song.artwork} alt={song.title} />
                    ) : (
                      <div className="artwork-placeholder">🎵</div>
                    )}
                  </div>
                  <div className="queue-info">
                    <strong>{song.title}</strong>
                    <span className="muted">{song.artist}</span>
                    <span className="queue-submitter">by {song.submitter}</span>
                  </div>
                  <div className="queue-actions">
                    <button className="queue-action-btn">▶️</button>
                    <button
                      className="queue-action-btn"
                      onClick={() => handleMentionSong(song)}
                    >
                      @
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat continues below */}
            <div className="listen-chat-section">
              <h3>Discussion</h3>
              <div className="chat-messages chat-messages-compact">
                {messages.slice(-3).map((msg) => (
                  <div key={msg.id} className={`chat-message ${msg.isYou ? "message-you" : "message-other"}`}>
                    <div className="message-bubble">
                      <div className="message-header">
                        <strong>{msg.author}</strong>
                        <span className="message-time">{msg.time}</span>
                      </div>
                      <div className="message-text">
                        {renderMessageText(msg.text)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="button button-ghost"
                onClick={() => setActiveTab("CHAT")}
              >
                View Full Chat
              </button>
            </div>
          </div>
        )}

        {/* ROUND TAB */}
        {activeTab === "ROUND" && (
          <div className="round-view">
            {/* AI Banner Placeholder */}
            <div className="round-banner-container">
              <div className="round-banner-gradient">
                <h2>{mockRound.theme}</h2>
              </div>
            </div>

            {/* Round Info */}
            <div className="round-info">
              <p className="round-description">{mockRound.description}</p>
              <p className="round-meta">
                Theme by: <strong>{mockRound.themeAuthor}</strong> •
                Season {mockRound.seasonNumber}, Round {mockRound.roundNumber}
              </p>
            </div>

            {/* Dual Pressure Gauges */}
            <div className="pressure-gauges">
              <PressureGauge
                label="Submission"
                deadline={mockRound.submissionDeadline}
                now={now}
              />
              <PressureGauge
                label="Voting"
                deadline={mockRound.votingDeadline}
                now={now}
              />
            </div>

            {/* Song List */}
            <div className="round-songs">
              <h3>Submissions ({mockSongs.length})</h3>
              {mockSongs.map((song) => (
                <div key={song.id} className="round-song-item">
                  <div className="round-song-info">
                    <strong>{song.title}</strong>
                    <span className="muted">{song.artist} • {song.year}</span>
                    <span className="song-submitter">Submitted by {song.submitter}</span>
                  </div>
                  <div className="round-song-actions">
                    <button className="song-action-btn">▶️ Listen</button>
                    <button className="song-action-btn">💬 Discuss</button>
                    <button
                      className="song-action-btn"
                      onClick={() => handleMentionSong(song)}
                    >
                      @ Mention
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mini Chat Preview */}
            <div className="round-chat-preview">
              <h4>Recent Chat</h4>
              {messages.slice(-2).map((msg) => (
                <div key={msg.id} className="chat-preview-item">
                  <strong>{msg.author}:</strong> {msg.text.substring(0, 50)}
                  {msg.text.length > 50 ? "..." : ""}
                </div>
              ))}
              <button
                className="button button-secondary"
                onClick={() => setActiveTab("CHAT")}
              >
                Open Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button
          className={`bottom-nav-link ${activeView === "CHAT" ? "active" : ""}`}
          onClick={() => setActiveView("CHAT")}
        >
          💬 Chat
        </button>
        <button
          className={`bottom-nav-link ${activeView === "HISTORY" ? "active" : ""}`}
          onClick={() => setActiveView("HISTORY")}
        >
          📊 History
        </button>
        <button
          className={`bottom-nav-link ${activeView === "SETTINGS" ? "active" : ""}`}
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-backdrop" onClick={() => setShowSettings(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            <p className="muted">Settings panel placeholder</p>
            <div className="settings-options">
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  <span>Enable notifications</span>
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input type="checkbox" />
                  <span>Dark mode</span>
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input type="checkbox" defaultChecked />
                  <span>Sound effects</span>
                </label>
              </div>
            </div>
            <button
              className="button button-primary"
              onClick={() => setShowSettings(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* History View (when active) */}
      {activeView === "HISTORY" && (
        <div className="modal-backdrop" onClick={() => setActiveView("CHAT")}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Round History</h2>
            <p className="muted">Past rounds and results will appear here</p>
            <div className="history-placeholder">
              <div className="history-item-placeholder">
                <strong>Season 2, Round 4</strong>
                <p className="muted">Best Summer Vibes</p>
              </div>
              <div className="history-item-placeholder">
                <strong>Season 2, Round 3</strong>
                <p className="muted">Songs That Make You Dance</p>
              </div>
              <div className="history-item-placeholder">
                <strong>Season 2, Round 2</strong>
                <p className="muted">Guilty Pleasures</p>
              </div>
            </div>
            <button
              className="button button-primary"
              onClick={() => setActiveView("CHAT")}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add custom styles */}
      <style>{`
        .prototype-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f8f9fa;
        }

        /* Tab Switcher */
        .prototype-tabs {
          display: flex;
          background: var(--surface);
          border-bottom: 2px solid rgba(10, 26, 47, 0.08);
          padding: 0 16px;
          gap: 4px;
        }

        .prototype-tab {
          flex: 1;
          max-width: 160px;
          padding: 14px 20px;
          border: none;
          background: transparent;
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s ease;
        }

        .prototype-tab.active {
          color: var(--blue);
          border-bottom-color: var(--blue);
        }

        /* Main Content */
        .prototype-content {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 70px;
        }

        /* Chat View */
        .chat-view {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 200px);
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chat-messages-compact {
          max-height: 300px;
          padding: 12px;
          gap: 12px;
        }

        .chat-message {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-width: 80%;
        }

        .message-other {
          align-items: flex-start;
        }

        .message-you {
          align-items: flex-end;
          align-self: flex-end;
        }

        .message-bubble {
          background: #fff;
          border-radius: 18px;
          padding: 12px 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          max-width: 100%;
        }

        .message-you .message-bubble {
          background: linear-gradient(135deg, rgba(24, 224, 168, 0.2), rgba(24, 224, 168, 0.3));
          border: 1px solid rgba(24, 224, 168, 0.4);
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
          font-size: 0.85rem;
        }

        .message-time {
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 400;
        }

        .message-text {
          line-height: 1.5;
        }

        .message-mention {
          background: rgba(17, 193, 236, 0.2);
          color: var(--blue);
          padding: 2px 6px;
          border-radius: 6px;
          font-weight: 600;
        }

        .message-reactions {
          display: flex;
          gap: 6px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .reaction-bubble {
          background: rgba(10, 26, 47, 0.06);
          border: 1px solid rgba(10, 26, 47, 0.12);
          border-radius: 12px;
          padding: 4px 8px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .reaction-bubble:hover {
          background: rgba(10, 26, 47, 0.12);
          transform: scale(1.1);
        }

        .message-reaction-tray {
          display: flex;
          gap: 6px;
          opacity: 0;
          transition: opacity 0.2s ease;
          padding: 4px 0;
        }

        .chat-message:hover .message-reaction-tray {
          opacity: 1;
        }

        .reaction-add-btn {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(10, 26, 47, 0.12);
          border-radius: 8px;
          padding: 4px 6px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .reaction-add-btn:hover {
          background: #fff;
          transform: scale(1.15);
        }

        /* Compose Bar */
        .chat-compose-bar {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          background: var(--surface);
          border-top: 1px solid rgba(10, 26, 47, 0.08);
          position: relative;
        }

        .compose-emoji-btn {
          background: transparent;
          border: 1px solid rgba(10, 26, 47, 0.12);
          border-radius: 999px;
          width: 40px;
          height: 40px;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .compose-emoji-btn:hover {
          background: rgba(10, 26, 47, 0.06);
          transform: scale(1.05);
        }

        .emoji-picker {
          position: absolute;
          bottom: 60px;
          left: 20px;
          background: #fff;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          gap: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          z-index: 10;
        }

        .emoji-option {
          background: transparent;
          border: none;
          font-size: 1.4rem;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: all 0.15s ease;
        }

        .emoji-option:hover {
          background: rgba(10, 26, 47, 0.06);
          transform: scale(1.15);
        }

        .compose-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid rgba(10, 26, 47, 0.12);
          border-radius: 999px;
          font-size: 1rem;
          background: #fff;
        }

        .compose-input:focus {
          outline: 2px solid rgba(17, 193, 236, 0.35);
          border-color: var(--blue);
        }

        .compose-send-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 999px;
          background: var(--coral);
          color: white;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .compose-send-btn:hover:not(:disabled) {
          background: #ff5748;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 111, 97, 0.3);
        }

        .compose-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Listen View */
        .listen-view {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .player-container {
          background: var(--surface);
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }

        .player-placeholder {
          text-align: center;
          padding: 40px 20px;
          background: linear-gradient(135deg, rgba(17, 193, 236, 0.1), rgba(134, 183, 254, 0.15));
          border-radius: 16px;
        }

        .player-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .player-controls {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 24px;
        }

        .player-btn {
          background: var(--surface);
          border: 2px solid rgba(10, 26, 47, 0.12);
          border-radius: 999px;
          width: 48px;
          height: 48px;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .player-btn-large {
          width: 64px;
          height: 64px;
          font-size: 1.6rem;
          background: var(--blue);
          color: white;
          border-color: var(--blue);
        }

        .player-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .song-queue {
          background: var(--surface);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }

        .song-queue h3 {
          margin: 0 0 16px 0;
        }

        .queue-item {
          display: grid;
          grid-template-columns: 60px 1fr auto;
          gap: 16px;
          align-items: center;
          padding: 12px;
          border-radius: 12px;
          background: rgba(10, 26, 47, 0.04);
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }

        .queue-item:hover {
          background: rgba(10, 26, 47, 0.08);
          transform: translateX(4px);
        }

        .queue-artwork {
          width: 60px;
          height: 60px;
          border-radius: 10px;
          overflow: hidden;
        }

        .artwork-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--mint), var(--blue));
          display: grid;
          place-items: center;
          font-size: 1.5rem;
        }

        .queue-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .queue-submitter {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .queue-actions {
          display: flex;
          gap: 8px;
        }

        .queue-action-btn {
          background: rgba(10, 26, 47, 0.08);
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .queue-action-btn:hover {
          background: rgba(10, 26, 47, 0.15);
          transform: scale(1.05);
        }

        .listen-chat-section {
          background: var(--surface);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }

        .listen-chat-section h3 {
          margin: 0 0 16px 0;
        }

        /* Round View */
        .round-view {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .round-banner-container {
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }

        .round-banner-gradient {
          background: linear-gradient(135deg, rgba(17, 193, 236, 0.8), rgba(255, 111, 97, 0.8));
          padding: 48px 32px;
          text-align: center;
          color: white;
        }

        .round-banner-gradient h2 {
          margin: 0;
          font-size: 2rem;
          text-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .round-info {
          background: var(--surface);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }

        .round-description {
          font-size: 1.1rem;
          line-height: 1.6;
          margin: 0 0 12px 0;
        }

        .round-meta {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin: 0;
        }

        /* Pressure Gauges */
        .pressure-gauges {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .pressure-gauge {
          background: var(--surface);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .gauge-container {
          position: relative;
        }

        .gauge-label {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .gauge-time {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--coral);
        }

        /* Round Songs */
        .round-songs {
          background: var(--surface);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }

        .round-songs h3 {
          margin: 0 0 16px 0;
        }

        .round-song-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 12px;
          background: rgba(10, 26, 47, 0.04);
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }

        .round-song-item:hover {
          background: rgba(10, 26, 47, 0.08);
          transform: translateX(4px);
        }

        .round-song-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .song-submitter {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .round-song-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .song-action-btn {
          background: rgba(10, 26, 47, 0.08);
          border: 1px solid rgba(10, 26, 47, 0.12);
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .song-action-btn:hover {
          background: rgba(10, 26, 47, 0.15);
          transform: translateY(-1px);
        }

        /* Round Chat Preview */
        .round-chat-preview {
          background: var(--surface);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }

        .round-chat-preview h4 {
          margin: 0 0 12px 0;
        }

        .chat-preview-item {
          padding: 12px;
          background: rgba(10, 26, 47, 0.04);
          border-radius: 10px;
          margin-bottom: 10px;
          font-size: 0.9rem;
        }

        /* History Placeholder */
        .history-placeholder {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 20px 0;
        }

        .history-item-placeholder {
          padding: 16px;
          background: rgba(10, 26, 47, 0.04);
          border-radius: 12px;
        }

        /* Settings */
        .settings-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin: 24px 0;
        }

        .setting-item label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-size: 1rem;
        }

        .setting-item input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .pressure-gauges {
            grid-template-columns: 1fr;
          }

          .round-song-actions {
            flex-direction: column;
            width: 100%;
          }

          .song-action-btn {
            width: 100%;
          }

          .chat-message {
            max-width: 90%;
          }

          .round-banner-gradient h2 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
