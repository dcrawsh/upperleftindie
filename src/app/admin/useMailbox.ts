"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "./helpers";
import type {
  AdminFetch,
  MailboxMessage,
  MailboxMessageSummary,
} from "./types";

export function useMailbox({
  token,
  adminFetch,
  setIsLoading,
  setWorkingId,
  setMessage,
}: {
  token: string;
  adminFetch: AdminFetch;
  setIsLoading: (value: boolean) => void;
  setWorkingId: (value: string) => void;
  setMessage: (value: string) => void;
}) {
  const [messages, setMessages] = useState<MailboxMessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MailboxMessage | null>(
    null
  );

  useEffect(() => {
    if (token) return;
    setMessages([]);
    setSelectedMessage(null);
  }, [token]);

  const loadMessages = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setMessage("");

    try {
      const data = await adminFetch<{ messages: MailboxMessageSummary[] }>(
        "/api/admin/mail?limit=50"
      );
      setMessages(data.messages);

      if (selectedMessage) {
        const stillExists = data.messages.some(
          (message) => message.uid === selectedMessage.uid
        );
        if (!stillExists) setSelectedMessage(null);
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [adminFetch, selectedMessage, setIsLoading, setMessage, token]);

  const openMessage = useCallback(
    async (uid: number) => {
      setWorkingId(`mail-open-${uid}`);
      setMessage("");

      try {
        const data = await adminFetch<{ message: MailboxMessage }>(
          `/api/admin/mail/${uid}`
        );
        setSelectedMessage(data.message);
        setMessages((current) =>
          current.map((message) =>
            message.uid === uid ? { ...message, unread: false } : message
          )
        );
      } catch (error) {
        setMessage(getErrorMessage(error));
      } finally {
        setWorkingId("");
      }
    },
    [adminFetch, setMessage, setWorkingId]
  );

  const sendReply = useCallback(
    async (uid: number, message: string) => {
      if (!message.trim()) {
        setMessage("Write a reply before sending.");
        return false;
      }

      setWorkingId(`mail-reply-${uid}`);
      setMessage("");

      try {
        const data = await adminFetch<{ recipient: string }>(
          `/api/admin/mail/${uid}`,
          {
            method: "POST",
            body: JSON.stringify({ message }),
          }
        );

        setMessages((current) =>
          current.map((item) =>
            item.uid === uid ? { ...item, answered: true, unread: false } : item
          )
        );
        setSelectedMessage((current) =>
          current?.uid === uid
            ? { ...current, answered: true, unread: false }
            : current
        );
        setMessage(`Reply sent to ${data.recipient}.`);
        return true;
      } catch (error) {
        setMessage(getErrorMessage(error));
        return false;
      } finally {
        setWorkingId("");
      }
    },
    [adminFetch, setMessage, setWorkingId]
  );

  return {
    messages,
    selectedMessage,
    loadMessages,
    openMessage,
    sendReply,
  };
}
