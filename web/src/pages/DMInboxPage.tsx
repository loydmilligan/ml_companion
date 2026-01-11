import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type Conversation = {
  id: string;
  group_id: string;
  created_at: string;
  other_participant: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  last_message?: {
    body: string;
    created_at: string;
    author_id: string;
  };
  unread_count: number;
};

type GroupMember = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export default function DMInboxPage() {
  const { group, profile } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDM, setShowNewDM] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!group?.id || !profile?.id) return;

    try {
      // Get all conversations the user is part of
      const { data: participations, error: partError } = await supabase
        .from("conversation_participants")
        .select(`
          conversation_id,
          last_read_at,
          conversations!inner (
            id,
            group_id,
            created_at
          )
        `)
        .eq("participant_id", profile.id);

      if (partError) throw partError;

      if (!participations?.length) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get conversation IDs
      const convIds = participations.map(p => p.conversation_id);

      // Get other participants for each conversation
      const { data: allParticipants, error: partListError } = await supabase
        .from("conversation_participants")
        .select(`
          conversation_id,
          participant_id,
          profiles:participant_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .in("conversation_id", convIds)
        .neq("participant_id", profile.id);

      if (partListError) throw partListError;

      // Get last message for each conversation
      const { data: lastMessages, error: msgError } = await supabase
        .from("direct_messages")
        .select("conversation_id, body, created_at, author_id")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false });

      if (msgError) throw msgError;

      // Get unread counts
      const { data: unreadCounts, error: unreadError } = await supabase
        .rpc("get_dm_unread_counts", { p_user_id: profile.id });

      if (unreadError) throw unreadError;

      // Build conversation list
      const convList: Conversation[] = participations.map(p => {
        const convData = p.conversations as unknown;
        const conv = convData as { id: string; group_id: string; created_at: string };
        const otherPart = allParticipants?.find(ap => ap.conversation_id === p.conversation_id);
        const profileData = otherPart?.profiles as unknown;
        const otherProfile = profileData as GroupMember | undefined;
        const lastMsg = lastMessages?.find(m => m.conversation_id === p.conversation_id);
        const unread = unreadCounts?.find((u: { conversation_id: string; unread_count: number }) => u.conversation_id === p.conversation_id);

        return {
          id: conv.id,
          group_id: conv.group_id,
          created_at: conv.created_at,
          other_participant: {
            id: otherProfile?.id ?? "",
            display_name: otherProfile?.display_name ?? "Unknown",
            avatar_url: otherProfile?.avatar_url ?? null,
          },
          last_message: lastMsg ? {
            body: lastMsg.body,
            created_at: lastMsg.created_at,
            author_id: lastMsg.author_id,
          } : undefined,
          unread_count: unread?.unread_count ?? 0,
        };
      });

      // Sort by last message time (most recent first)
      convList.sort((a, b) => {
        const aTime = a.last_message?.created_at ?? a.created_at;
        const bTime = b.last_message?.created_at ?? b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(convList);
    } catch (err) {
      console.error("Error loading conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [group?.id, profile?.id]);

  const loadGroupMembers = useCallback(async () => {
    if (!group?.id || !profile?.id) return;

    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from("group_members")
        .select(`
          member_id,
          profiles:member_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq("group_id", group.id)
        .neq("member_id", profile.id);

      if (error) throw error;

      const members: GroupMember[] = (data ?? [])
        .map(m => m.profiles as unknown as GroupMember)
        .filter(Boolean);

      setGroupMembers(members);
    } catch (err) {
      console.error("Error loading group members:", err);
    } finally {
      setLoadingMembers(false);
    }
  }, [group?.id, profile?.id]);

  const startConversation = async (otherUserId: string) => {
    if (!group?.id || !profile?.id) return;

    setCreating(true);
    try {
      // Use RPC function that handles everything (find or create + add participants)
      const { data: conversationId, error } = await supabase
        .rpc("create_dm_conversation", {
          p_group_id: group.id,
          p_other_user_id: otherUserId,
        });

      if (error) throw error;

      // Navigate to conversation
      navigate(`/app/dm/${conversationId}`);
    } catch (err) {
      console.error("Error creating conversation:", err);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (showNewDM) {
      loadGroupMembers();
    }
  }, [showNewDM, loadGroupMembers]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <div className="dm-inbox">
      <div className="dm-inbox-header">
        <h1>Messages</h1>
        <Button onClick={() => setShowNewDM(true)}>
          New Message
        </Button>
      </div>

      {/* New DM Modal */}
      {showNewDM && (
        <div className="dm-modal-overlay" onClick={() => setShowNewDM(false)}>
          <div className="dm-modal" onClick={e => e.stopPropagation()}>
            <div className="dm-modal-header">
              <h2>New Message</h2>
              <button
                type="button"
                className="dm-modal-close"
                onClick={() => setShowNewDM(false)}
              >
                ✕
              </button>
            </div>
            <div className="dm-modal-body">
              {loadingMembers ? (
                <p className="muted">Loading members...</p>
              ) : groupMembers.length === 0 ? (
                <p className="muted">No other members in your group.</p>
              ) : (
                <div className="dm-member-list">
                  {groupMembers.map(member => (
                    <button
                      key={member.id}
                      type="button"
                      className="dm-member-item"
                      onClick={() => startConversation(member.id)}
                      disabled={creating}
                    >
                      <div className="dm-member-avatar">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.display_name ?? "Avatar"} />
                        ) : (
                          <span>{(member.display_name ?? "?")[0]}</span>
                        )}
                      </div>
                      <span className="dm-member-name">{member.display_name ?? "Unknown"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conversation List */}
      {loading ? (
        <p className="muted">Loading conversations...</p>
      ) : conversations.length === 0 ? (
        <div className="dm-empty">
          <p>No messages yet.</p>
          <p className="muted">Start a conversation with someone in your group!</p>
        </div>
      ) : (
        <div className="dm-conversation-list">
          {conversations.map(conv => (
            <button
              key={conv.id}
              type="button"
              className={`dm-conversation-item ${conv.unread_count > 0 ? "unread" : ""}`}
              onClick={() => navigate(`/app/dm/${conv.id}`)}
            >
              <div className="dm-conv-avatar">
                {conv.other_participant.avatar_url ? (
                  <img src={conv.other_participant.avatar_url} alt={conv.other_participant.display_name ?? "Avatar"} />
                ) : (
                  <span>{(conv.other_participant.display_name ?? "?")[0]}</span>
                )}
              </div>
              <div className="dm-conv-content">
                <div className="dm-conv-header">
                  <span className="dm-conv-name">{conv.other_participant.display_name ?? "Unknown"}</span>
                  {conv.last_message && (
                    <span className="dm-conv-time">{formatTime(conv.last_message.created_at)}</span>
                  )}
                </div>
                {conv.last_message && (
                  <p className="dm-conv-preview">
                    {conv.last_message.author_id === profile?.id && "You: "}
                    {conv.last_message.body.length > 50
                      ? conv.last_message.body.slice(0, 50) + "..."
                      : conv.last_message.body}
                  </p>
                )}
              </div>
              {conv.unread_count > 0 && (
                <span className="dm-conv-badge">{conv.unread_count}</span>
              )}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .dm-inbox {
          max-width: 600px;
          margin: 0 auto;
          padding-top: 16px;
        }

        .dm-inbox-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .dm-inbox-header h1 {
          font-size: 1.5rem;
          margin: 0;
          color: var(--text);
        }

        .dm-empty {
          text-align: center;
          padding: 32px 16px;
        }

        .dm-conversation-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dm-conversation-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          background: var(--surface);
          border: none;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: background 0.15s;
        }

        .dm-conversation-item:hover {
          background: var(--surface-hover, rgba(0, 0, 0, 0.04));
        }

        .dm-conversation-item.unread {
          background: rgba(var(--primary-rgb, 79, 70, 229), 0.08);
        }

        .dm-conv-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
          background: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dm-conv-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .dm-conv-avatar span {
          color: white;
          font-weight: 600;
          font-size: 1.2rem;
        }

        .dm-conv-content {
          flex: 1;
          min-width: 0;
        }

        .dm-conv-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 8px;
        }

        .dm-conv-name {
          font-weight: 600;
          color: var(--text, #1e293b);
        }

        .dm-conversation-item.unread .dm-conv-name {
          font-weight: 700;
        }

        .dm-conv-time {
          font-size: 0.75rem;
          color: var(--text-muted, #64748b);
          flex-shrink: 0;
        }

        .dm-conv-preview {
          margin: 4px 0 0;
          font-size: 0.875rem;
          color: var(--text-muted, #64748b);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dm-conversation-item.unread .dm-conv-preview {
          color: var(--text, #1e293b);
          font-weight: 500;
        }

        /* Dark mode text colors */
        [data-mode="dark"] .dm-inbox-header h1 {
          color: #f1f5f9;
        }

        [data-mode="dark"] .dm-conv-name {
          color: #f1f5f9;
        }

        [data-mode="dark"] .dm-conv-time {
          color: #94a3b8;
        }

        [data-mode="dark"] .dm-conv-preview {
          color: #94a3b8;
        }

        [data-mode="dark"] .dm-conversation-item.unread .dm-conv-preview {
          color: #f1f5f9;
        }

        [data-mode="dark"] .dm-empty p {
          color: #f1f5f9;
        }

        [data-mode="dark"] .dm-empty .muted {
          color: #94a3b8;
        }

        .dm-conv-badge {
          background: var(--primary);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
          min-width: 20px;
          text-align: center;
        }

        /* Modal styles */
        .dm-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .dm-modal {
          background: var(--surface);
          border-radius: 16px;
          width: 100%;
          max-width: 400px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .dm-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid var(--border);
        }

        .dm-modal-header h2 {
          margin: 0;
          font-size: 1.125rem;
        }

        .dm-modal-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 4px;
          color: var(--text-muted);
        }

        .dm-modal-body {
          padding: 16px;
          overflow-y: auto;
        }

        .dm-member-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dm-member-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: background 0.15s;
        }

        .dm-member-item:hover {
          background: var(--surface-hover, rgba(0, 0, 0, 0.04));
        }

        .dm-member-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dm-member-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          background: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dm-member-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .dm-member-avatar span {
          color: white;
          font-weight: 600;
        }

        .dm-member-name {
          font-weight: 500;
          color: var(--text, #1e293b);
        }

        /* Light mode - ensure text is visible */
        [data-mode="light"] .dm-modal {
          background: var(--surface, #ffffff);
        }

        [data-mode="light"] .dm-modal-header h2 {
          color: var(--text, #1e293b);
        }

        [data-mode="light"] .dm-member-name {
          color: #1e293b;
        }

        [data-mode="light"] .dm-member-item:hover {
          background: rgba(0, 0, 0, 0.06);
        }

        /* Dark mode */
        [data-mode="dark"] .dm-modal {
          background: var(--surface, #1e293b);
        }

        [data-mode="dark"] .dm-modal-header h2 {
          color: var(--text, #f1f5f9);
        }

        [data-mode="dark"] .dm-member-name {
          color: #f1f5f9;
        }

        [data-mode="dark"] .dm-member-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        @media (prefers-color-scheme: dark) {
          .dm-modal {
            background: var(--surface, #1e293b);
          }

          .dm-modal-header h2,
          .dm-member-name {
            color: var(--text, #f1f5f9);
          }

          .dm-member-item:hover {
            background: rgba(255, 255, 255, 0.08);
          }
        }
      `}</style>
    </div>
  );
}
