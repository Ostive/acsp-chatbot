"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
  },
};

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
};

const SUGGESTIONS = [
  {
    label: "Leadership & Management",
    prompt:
      "Quelles formations proposez-vous en Leadership & Management ?",
  },
  {
    label: "Communication & Relations humaines",
    prompt:
      "Quelles formations proposez-vous en Communication & Relations humaines ?",
  },
  {
    label: "Santé & Performances humaines",
    prompt:
      "Quelles formations proposez-vous en Santé & Performances humaines ?",
  },
  {
    label: "QVCT & Prévention",
    prompt:
      "Quelles formations proposez-vous en QVCT & Prévention ?",
  },
  {
    label: "Stratégie & Transformation",
    prompt:
      "Quelles formations proposez-vous en Stratégie & Transformation ?",
  },
  {
    label: "Compétences métiers & techniques",
    prompt:
      "Quelles formations proposez-vous en Compétences métiers & techniques ?",
  },
];

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `session-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
    }
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }, [input]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const userMessage: Message = {
        id: makeId(),
        role: "user",
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setError(null);
      setIsSending(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatInput: trimmed,
            sessionId: sessionIdRef.current,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          output?: string;
          error?: string;
          detail?: string;
        };

        if (!res.ok) {
          throw new Error(data.error ?? `Erreur ${res.status}`);
        }

        const reply =
          (typeof data.output === "string" && data.output.trim()) ||
          "Désolé, je n'ai pas pu générer de réponse.";

        setMessages((prev) => [
          ...prev,
          { id: makeId(), role: "assistant", content: reply },
        ]);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Une erreur est survenue. Réessayez dans un instant.";
        setError(message);
      } finally {
        setIsSending(false);
      }
    },
    [isSending],
  );

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void sendMessage(input);
    },
    [input, sendMessage],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void sendMessage(input);
      }
    },
    [input, sendMessage],
  );

  const isEmpty = messages.length === 0;

  const markdownComponents = useMemo(
    () => ({
      a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a {...props} target="_blank" rel="noopener noreferrer" />
      ),
    }),
    [],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollerRef}
        className="acsp-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-6 sm:px-6"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {isEmpty ? (
            <WelcomeState onPick={(p) => void sendMessage(p)} />
          ) : (
            messages.map((m) => (
              <MessageBubble
                key={m.id}
                role={m.role}
                content={m.content}
                markdownComponents={markdownComponents}
              />
            ))
          )}

          {isSending ? <TypingBubble /> : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-acsp-border bg-white/80 backdrop-blur">
        <form
          onSubmit={onSubmit}
          className="mx-auto flex max-w-3xl items-end gap-2 px-4 py-3 sm:px-6"
        >
          <div className="flex-1 rounded-2xl border border-acsp-border bg-white shadow-sm focus-within:border-acsp-teal focus-within:ring-2 focus-within:ring-acsp-teal/30">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Écrivez votre question à Julie…"
              className="block w-full resize-none bg-transparent px-4 py-3 text-[0.95rem] leading-6 text-acsp-text placeholder:text-acsp-text-soft/70 focus:outline-none"
              disabled={isSending}
            />
          </div>
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-acsp-navy text-white shadow-md transition-all hover:bg-acsp-navy-soft hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Envoyer"
          >
            <SendIcon />
          </button>
        </form>
        <p className="mx-auto max-w-3xl px-4 pb-3 text-center text-[11px] text-acsp-text-soft sm:px-6">
          Julie est un assistant virtuel. Pour un devis ou un conseil
          personnalisé, notre équipe peut vous rappeler au 07 66 12 15 71.
        </p>
      </div>
    </div>
  );
}

function WelcomeState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="acsp-bubble-in flex flex-col items-center gap-6 py-8 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-acsp-teal/25 blur-xl" />
        <span className="absolute inset-2 rounded-full bg-gradient-to-br from-acsp-teal to-acsp-green opacity-80" />
        <span className="relative grid h-14 w-14 place-items-center rounded-full bg-white text-2xl font-semibold text-acsp-navy shadow-md">
          J
        </span>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-acsp-navy sm:text-3xl">
          Bonjour, je suis Julie
        </h2>
        <p className="mx-auto max-w-xl text-[0.95rem] leading-6 text-acsp-text-soft">
          Conseillère virtuelle d'ACSP Formations. Est-ce qu'il y a une
          formation qui vous intéresse ? Sinon, dites-moi ce que vous
          aimeriez améliorer, je vous oriente.
        </p>
      </div>
      <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="group flex items-center justify-between gap-3 rounded-xl border border-acsp-border bg-white/80 px-4 py-3 text-left text-sm font-medium text-acsp-navy shadow-sm transition-all hover:-translate-y-0.5 hover:border-acsp-teal hover:shadow-md"
          >
            <span>{s.label}</span>
            <span className="text-acsp-teal transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function normalizeMarkdown(text: string): string {
  // Only fix literal escape sequences the LLM occasionally emits as text
  // ("\\n", "\\t"). The rest of the formatting is enforced by the prompt.
  return text
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t");
}

function MessageBubble({
  role,
  content,
  markdownComponents,
}: {
  role: Role;
  content: string;
  markdownComponents: Record<string, React.ComponentType<never>>;
}) {
  if (role === "user") {
    return (
      <div className="acsp-bubble-in flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-acsp-navy px-4 py-2.5 text-[0.95rem] leading-6 text-white shadow-sm sm:max-w-[75%]">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="acsp-bubble-in flex items-start gap-3">
      <Avatar />
      <div className="max-w-[85%] flex-1 rounded-2xl rounded-tl-md border border-acsp-border bg-white px-4 py-3 shadow-sm sm:max-w-[78%]">
        <div className="md-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
            components={
              markdownComponents as Parameters<
                typeof ReactMarkdown
              >[0]["components"]
            }
          >
            {normalizeMarkdown(content)}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="acsp-bubble-in flex items-center gap-3">
      <Avatar />
      <div className="rounded-2xl rounded-tl-md border border-acsp-border bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="acsp-dot inline-block h-2 w-2 rounded-full bg-acsp-teal" />
          <span className="acsp-dot inline-block h-2 w-2 rounded-full bg-acsp-green" />
          <span className="acsp-dot inline-block h-2 w-2 rounded-full bg-acsp-navy" />
        </div>
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-acsp-teal to-acsp-green text-sm font-semibold text-white shadow-sm">
      J
    </span>
  );
}

function SendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}
