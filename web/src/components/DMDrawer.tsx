import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
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

type DMDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function DMDrawer({ isOpen, onClose }: DMDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { group, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDM, setShowNewDM] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [creating, setCreating] = useState(false);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const timeout = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const loadConversations = useCallback(async () => {
    if (!group?.id || !profile?.id) return;

    try {
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

      const convIds = participations.map(p => p.conversation_id);

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

      const { data: lastMessages, error: msgError } = await supabase
        .from("direct_messages")
        .select("conversation_id, body, created_at, author_id")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false });

      if (msgError) throw msgError;

      const { data: unreadCounts, error: unreadError } = await supabase
        .rpc("get_dm_unread_counts", { p_user_id: profile.id });

      if (unreadError) throw unreadError;

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
      const { data: conversationId, error } = await supabase
        .rpc("create_dm_conversation", {
          p_group_id: group.id,
          p_other_user_id: otherUserId,
        });

      if (error) throw error;

      onClose();
      navigate(`/app/dm/${conversationId}`);
    } catch (err) {
      console.error("Error creating conversation:", err);
    } finally {
      setCreating(false);
    }
  };

  const openConversation = (convId: string) => {
    onClose();
    navigate(`/app/dm/${convId}`);
  };

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, loadConversations]);

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
    <div
      ref={drawerRef}
      className={clsx("dm-drawer", isOpen && "open")}
      role="region"
      aria-label="Messages"
      aria-hidden={!isOpen}
    >
      <div className="dm-drawer-content">
        <div className="dm-drawer-header">
          <svg viewBox="0 0 24 24" fill="currentColor" className="dm-drawer-icon">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
          <h2>Messages</h2>
          <button
            type="button"
            className="dm-drawer-new-btn"
            onClick={() => setShowNewDM(!showNewDM)}
            title="New message"
          >
            {showNewDM ? "Back" : "+"}
          </button>
        </div>

        {showNewDM ? (
          <div className="dm-drawer-new">
            <p className="dm-drawer-subtitle">Start a new conversation</p>
            {loadingMembers ? (
              <p className="muted">Loading members...</p>
            ) : groupMembers.length === 0 ? (
              <p className="muted">No other members in your group.</p>
            ) : (
              <div className="dm-drawer-member-list">
                {groupMembers.map(member => (
                  <button
                    key={member.id}
                    type="button"
                    className="dm-drawer-member-item"
                    onClick={() => startConversation(member.id)}
                    disabled={creating}
                  >
                    <div className="dm-drawer-member-avatar">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.display_name ?? "Avatar"} />
                      ) : (
                        <span>{(member.display_name ?? "?")[0]}</span>
                      )}
                    </div>
                    <span className="dm-drawer-member-name">{member.display_name ?? "Unknown"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="dm-drawer-list">
            {loading ? (
              <p className="muted">Loading...</p>
            ) : conversations.length === 0 ? (
              <div className="dm-drawer-empty">
                <p>No messages yet.</p>
                <button
                  type="button"
                  className="dm-drawer-start-btn"
                  onClick={() => setShowNewDM(true)}
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              conversations.slice(0, 5).map(conv => (
                <button
                  key={conv.id}
                  type="button"
                  className={`dm-drawer-conv-item ${conv.unread_count > 0 ? "unread" : ""}`}
                  onClick={() => openConversation(conv.id)}
                >
                  <div className="dm-drawer-conv-avatar">
                    {conv.other_participant.avatar_url ? (
                      <img src={conv.other_participant.avatar_url} alt={conv.other_participant.display_name ?? "Avatar"} />
                    ) : (
                      <span>{(conv.other_participant.display_name ?? "?")[0]}</span>
                    )}
                  </div>
                  <div className="dm-drawer-conv-content">
                    <div className="dm-drawer-conv-header">
                      <span className="dm-drawer-conv-name">{conv.other_participant.display_name ?? "Unknown"}</span>
                      {conv.last_message && (
                        <span className="dm-drawer-conv-time">{formatTime(conv.last_message.created_at)}</span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className="dm-drawer-conv-preview">
                        {conv.last_message.author_id === profile?.id && "You: "}
                        {conv.last_message.body.length > 30
                          ? conv.last_message.body.slice(0, 30) + "..."
                          : conv.last_message.body}
                      </p>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="dm-drawer-conv-badge">{conv.unread_count}</span>
                  )}
                </button>
              ))
            )}
            {conversations.length > 5 && (
              <button
                type="button"
                className="dm-drawer-see-all"
                onClick={() => {
                  onClose();
                  navigate("/app/dm");
                }}
              >
                See all messages
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
