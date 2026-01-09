import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// Types matching ChatPage.tsx
export type ChatMessage = {
  id: string;
  body: string;
  author_id: string | null;
  created_at: string;
  reply_to_id: string | null;
  group_id?: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  reply_to?: {
    id: string;
    body: string;
    author_id: string | null;
    profiles?: {
      display_name: string | null;
    } | null;
  } | null;
  _optimistic?: boolean; // Flag for optimistic updates
};

export type MessageReaction = {
  id: string;
  message_id: string;
  reactor_id: string;
  emoji: string;
};

type RealtimeCallbacks = {
  onNewMessage: (message: ChatMessage) => void;
  onNewReaction: (reaction: MessageReaction) => void;
  onDeleteReaction: (reaction: MessageReaction) => void;
};

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const INITIAL_RECONNECT_DELAY = 1000; // 1 second

export function useRealtimeChat(
  groupId: string | null,
  currentUserId: string | null,
  callbacks: RealtimeCallbacks
) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const callbacksRef = useRef(callbacks);

  // Update callbacks ref to avoid stale closures
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return; // Already scheduled

    const delay = reconnectDelayRef.current;
    console.log(`[Realtime] Scheduling reconnect in ${delay}ms`);

    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null;
      // Double the delay for next time, up to max
      reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
      // Trigger reconnect by updating state (will re-run effect)
      setConnectionState("connecting");
    }, delay);
  }, []);

  const subscribe = useCallback(async () => {
    if (!groupId) return;

    cleanup();
    setConnectionState("connecting");
    setConnectionError(null);

    const channelName = `chat-${groupId}`;
    console.log(`[Realtime] Creating channel: ${channelName}`);

    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    // Subscribe to new messages
    channel.on<ChatMessage>(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "group_messages",
        filter: `group_id=eq.${groupId}`,
      },
      (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
        console.log("[Realtime] New message:", payload);
        const newMessage = payload.new as ChatMessage;

        // Skip messages from current user (handled by optimistic updates)
        if (newMessage.author_id === currentUserId) {
          console.log("[Realtime] Skipping own message");
          return;
        }

        callbacksRef.current.onNewMessage(newMessage);
      }
    );

    // Subscribe to new reactions
    channel.on<MessageReaction>(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "message_reactions",
      },
      (payload: RealtimePostgresChangesPayload<MessageReaction>) => {
        console.log("[Realtime] New reaction:", payload);
        const newReaction = payload.new as MessageReaction;
        callbacksRef.current.onNewReaction(newReaction);
      }
    );

    // Subscribe to deleted reactions
    channel.on<MessageReaction>(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "message_reactions",
      },
      (payload: RealtimePostgresChangesPayload<MessageReaction>) => {
        console.log("[Realtime] Deleted reaction:", payload);
        const oldReaction = payload.old as MessageReaction;
        callbacksRef.current.onDeleteReaction(oldReaction);
      }
    );

    // Handle connection state changes
    channel.subscribe((status, err) => {
      console.log(`[Realtime] Channel status: ${status}`, err);

      switch (status) {
        case "SUBSCRIBED":
          setConnectionState("connected");
          setConnectionError(null);
          // Reset reconnect delay on successful connection
          reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
          break;
        case "CHANNEL_ERROR":
          setConnectionState("error");
          setConnectionError(err?.message ?? "Channel error");
          scheduleReconnect();
          break;
        case "TIMED_OUT":
          setConnectionState("error");
          setConnectionError("Connection timed out");
          scheduleReconnect();
          break;
        case "CLOSED":
          setConnectionState("disconnected");
          break;
      }
    });
  }, [groupId, currentUserId, cleanup, scheduleReconnect]);

  // Subscribe when groupId changes
  useEffect(() => {
    if (!groupId) {
      cleanup();
      setConnectionState("disconnected");
      return;
    }

    subscribe();

    return () => {
      cleanup();
    };
  }, [groupId, subscribe, cleanup]);

  // Re-subscribe when connection state is "connecting" (for reconnection)
  useEffect(() => {
    if (connectionState === "connecting" && groupId && !channelRef.current) {
      subscribe();
    }
  }, [connectionState, groupId, subscribe]);

  return {
    isConnected: connectionState === "connected",
    connectionState,
    connectionError,
    reconnect: subscribe,
  };
}
