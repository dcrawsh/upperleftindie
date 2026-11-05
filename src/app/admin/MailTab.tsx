"use client";

import { useEffect, useState } from "react";
import {
  FiCheck,
  FiInbox,
  FiMail,
  FiPaperclip,
  FiRefreshCw,
  FiSend,
} from "react-icons/fi";
import type { MailboxMessage, MailboxMessageSummary } from "./types";

type MailTabProps = {
  messages: MailboxMessageSummary[];
  selectedMessage: MailboxMessage | null;
  isLoading: boolean;
  workingId: string;
  onRefresh: () => void;
  onOpenMessage: (uid: number) => void;
  onSendReply: (uid: number, message: string) => Promise<boolean>;
};

function formatMailDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unknown";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatBytes(value: number) {
  if (value < 1_000) return `${value} B`;
  if (value < 1_000_000) return `${Math.round(value / 1_000)} KB`;
  return `${(value / 1_000_000).toFixed(1)} MB`;
}

function addressLabel(message: MailboxMessageSummary) {
  if (!message.from) return "Unknown sender";
  return message.from.name || message.from.address;
}

export function MailTab({
  messages,
  selectedMessage,
  isLoading,
  workingId,
  onRefresh,
  onOpenMessage,
  onSendReply,
}: MailTabProps) {
  const [reply, setReply] = useState("");
  const unreadCount = messages.filter((message) => message.unread).length;

  useEffect(() => {
    setReply("");
  }, [selectedMessage?.uid]);

  async function handleReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMessage) return;

    const sent = await onSendReply(selectedMessage.uid, reply);
    if (sent) setReply("");
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">
            Mailbox
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-black text-ink">
            <FiInbox size={22} /> Inbox
            {unreadCount ? (
              <span className="rounded-full bg-clay px-2.5 py-1 text-xs text-paper">
                {unreadCount} unread
              </span>
            ) : null}
          </h2>
          <p className="mt-1 text-sm text-ink/55">
            Showing the 50 most recent messages.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-sm font-bold text-ink transition hover:border-clay hover:text-clay disabled:opacity-60"
        >
          <FiRefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="grid min-h-[36rem] overflow-hidden rounded-md border border-ink/10 bg-paper shadow-soft lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.65fr)]">
        <div className="max-h-[46rem] overflow-y-auto border-b border-ink/10 lg:border-b-0 lg:border-r">
          {!messages.length && !isLoading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center text-ink/50">
              <FiInbox size={28} />
              <p className="font-bold">No messages in the inbox.</p>
            </div>
          ) : (
            messages.map((message) => {
              const isSelected = selectedMessage?.uid === message.uid;
              const isOpening = workingId === `mail-open-${message.uid}`;

              return (
                <button
                  key={message.uid}
                  type="button"
                  onClick={() => onOpenMessage(message.uid)}
                  className={`block w-full border-b border-ink/10 px-5 py-4 text-left transition last:border-b-0 ${
                    isSelected ? "bg-clay/10" : "hover:bg-ink/[0.035]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                        message.unread ? "bg-clay" : "bg-transparent"
                      }`}
                      aria-label={message.unread ? "Unread" : "Read"}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span
                          className={`truncate text-sm text-ink ${
                            message.unread ? "font-black" : "font-bold"
                          }`}
                        >
                          {addressLabel(message)}
                        </span>
                        <span className="shrink-0 text-xs text-ink/45">
                          {formatMailDate(message.date)}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-sm text-ink/65">
                        {isOpening ? "Opening..." : message.subject}
                      </span>
                      <span className="mt-2 flex gap-2 text-xs font-bold uppercase tracking-[0.1em] text-ink/40">
                        {message.answered ? (
                          <span className="inline-flex items-center gap-1 text-moss">
                            <FiCheck size={12} /> Replied
                          </span>
                        ) : null}
                        {message.hasAttachments ? (
                          <span className="inline-flex items-center gap-1">
                            <FiPaperclip size={12} /> Attachment
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selectedMessage ? (
          <article className="flex min-w-0 flex-col">
            <header className="border-b border-ink/10 p-5 md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-black text-ink">
                  {selectedMessage.subject}
                </h3>
                {selectedMessage.answered ? (
                  <span className="rounded-full bg-moss px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-paper">
                    Replied
                  </span>
                ) : null}
              </div>
              <div className="mt-4 space-y-1 text-sm leading-6 text-ink/60">
                <p>
                  <span className="font-bold text-ink">From:</span>{" "}
                  {selectedMessage.from
                    ? `${selectedMessage.from.name} <${selectedMessage.from.address}>`
                    : "Unknown sender"}
                </p>
                {selectedMessage.replyTo &&
                selectedMessage.replyTo.address !==
                  selectedMessage.from?.address ? (
                  <p>
                    <span className="font-bold text-ink">Reply to:</span>{" "}
                    {selectedMessage.replyTo.address}
                  </p>
                ) : null}
                <p>
                  <span className="font-bold text-ink">Date:</span>{" "}
                  {formatMailDate(selectedMessage.date)}
                </p>
              </div>
            </header>

            <div className="flex-1 p-5 md:p-7">
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-ink/75">
                {selectedMessage.text}
              </pre>

              {selectedMessage.isTruncated ? (
                <p className="mt-5 rounded-md bg-clay/10 px-4 py-3 text-sm font-bold text-clay">
                  This large message was shortened for the admin portal.
                </p>
              ) : null}

              {selectedMessage.attachments.length ? (
                <div className="mt-6 border-t border-ink/10 pt-5">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/45">
                    Attachments
                  </p>
                  <ul className="mt-3 space-y-2">
                    {selectedMessage.attachments.map((attachment, index) => (
                      <li
                        key={`${attachment.filename}-${index}`}
                        className="flex items-center gap-2 text-sm text-ink/65"
                      >
                        <FiPaperclip size={15} />
                        <span className="font-bold text-ink">
                          {attachment.filename}
                        </span>
                        <span>{formatBytes(attachment.size)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {selectedMessage.replyTo ? (
              <form
                onSubmit={handleReply}
                className="border-t border-ink/10 bg-ink/[0.025] p-5 md:p-7"
              >
                <label className="block text-sm font-bold text-ink/70">
                  Reply to {selectedMessage.replyTo.name}
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={6}
                    placeholder="Write your reply..."
                    className="mt-2 w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base font-normal leading-6 text-ink outline-none transition focus:border-clay"
                  />
                </label>
                <button
                  type="submit"
                  disabled={
                    !reply.trim() ||
                    workingId === `mail-reply-${selectedMessage.uid}`
                  }
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-paper transition hover:bg-clay disabled:opacity-60"
                >
                  <FiSend size={15} />
                  {workingId === `mail-reply-${selectedMessage.uid}`
                    ? "Sending..."
                    : "Send Reply"}
                </button>
              </form>
            ) : (
              <div className="border-t border-ink/10 p-5 text-sm font-bold text-clay md:p-7">
                This message does not include a reply address.
              </div>
            )}
          </article>
        ) : (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-8 text-center text-ink/45">
            <FiMail size={30} />
            <p className="font-bold">Select a message to read and reply.</p>
          </div>
        )}
      </div>
    </section>
  );
}
