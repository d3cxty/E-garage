"use client";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { format } from "timeago.js";
import api from "@/lib/api";
import { socket } from "@/lib/socket";

type Msg = {
  _id?: string;
  room: string;
  sender: string;
  type: "text" | "image";
  text?: string;
  images?: string[];
  createdAt?: string;
  at?: string;
  _optimisticId?: string; // local-only marker
};

export default function Chat({ room }: { room: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const me =
    typeof window !== "undefined" && localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user")!)
      : null;
  const myName = me?.email || "guest";

  // connect socket & join room AFTER connect event
  useEffect(() => {
    let mounted = true;

    socket.connect();

    const join = () => {
      socket.emit("chat:join", { room });
      console.log("joined room", room);
    };
    socket.on("connect", join);

    api
      .get(`/chat/${encodeURIComponent(room)}/messages?limit=50`)
      .then((r) => {
        if (!mounted) return;
        setMessages(r.data?.messages || []);
      });

    const onMsg = (m: Msg) => {
      if (m.room === room) {
        setMessages((prev) => [m, ...prev.filter(p => p._optimisticId !== m._id)]);
      }
    };
    const onTyping = (p: { room: string; typing: boolean }) => {
      if (p.room === room) setTyping(p.typing);
    };

    socket.on("chat:message", onMsg);
    socket.on("chat:typing", onTyping);

    return () => {
      mounted = false;
      socket.off("connect", join);
      socket.off("chat:message", onMsg);
      socket.off("chat:typing", onTyping);
      socket.disconnect();
    };
  }, [room]);

  useEffect(() => {
    if (boxRef.current) {
      // scroll container to bottom
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [messages]);

  function sendText() {
    if (!text.trim()) return;
    socket.emit(
      "chat:message",
      { room, sender: myName, type: "text", text },
      (ack: any) => {
        if (!ack?.ok) console.error("sendText error:", ack?.error);
      }
    );
    setText("");
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    // optimistic: render a temporary bubble while uploading
    const tempId = `optim-${Date.now()}`;
    const localUrl = URL.createObjectURL(f);
    setMessages((prev) => [
      {
        _optimisticId: tempId,
        room,
        sender: myName,
        type: "image",
        images: [localUrl],
        at: new Date().toISOString(),
      },
      ...prev,
    ]);

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", f);
      await api.post(`/chat/${encodeURIComponent(room)}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // server will emit the final message; optimistic bubble will remain but
      // we also filter it out when the real one arrives (see setMessages in onMsg)
    } catch (err) {
      console.error("upload error:", err);
      // remove optimistic bubble on error
      setMessages((prev) => prev.filter((m) => m._optimisticId !== tempId));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      // revoke preview URL
      URL.revokeObjectURL(localUrl);
    }
  }

  return (
    <div className="h-full flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="px-4 py-2 border-b border-slate-800 text-sm text-slate-300">
        Room: {room}
      </div>

      <div ref={boxRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.slice().reverse().map((m) => {
          const mine = m.sender === myName;
          const when = m.createdAt || m.at;
          const key = m._optimisticId || m._id || Math.random().toString(36);

          if (m.type === "image") {
            return (
              <div key={key} className={clsx("flex", mine ? "justify-end" : "justify-start")}>
                <a
                  href={m.images?.[0]}
                  target="_blank"
                  rel="noreferrer"
                  className={clsx(
                    "block max-w-[70%] overflow-hidden rounded-xl border",
                    mine ? "border-brand-600/40" : "border-slate-800"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.images?.[0]} alt="upload" className="w-full h-auto" />
                  {when && (
                    <div className="p-1 text-[10px] text-slate-400">
                      {format(when)}
                    </div>
                  )}
                </a>
              </div>
            );
          }

          return (
            <div key={key} className={clsx("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={clsx(
                  "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow",
                  mine
                    ? "bg-brand-600/90 text-white rounded-br-sm"
                    : "bg-slate-800 text-slate-100 rounded-bl-sm"
                )}
              >
                <div className="text-[11px] mb-0.5 opacity-80">{m.sender}</div>
                <div>{m.text}</div>
                {when && <div className="text-[10px] mt-1 opacity-70">{format(when)}</div>}
              </div>
            </div>
          );
        })}
        {typing && <div className="text-xs text-slate-400 italic">typing…</div>}
      </div>

      <div className="p-3 border-t border-slate-800 flex gap-2 items-center">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            socket.emit("chat:typing", { room, typing: true });
            setTimeout(() => socket.emit("chat:typing", { room, typing: false }), 900);
          }}
          onKeyDown={(e) => e.key === "Enter" && sendText()}
          placeholder="Type a message…"
          className="flex-1 px-3 py-2 rounded-xl bg-slate-800 outline-none"
        />

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFilePick}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
          disabled={uploading}
          title="Attach image"
        >
          {uploading ? "Uploading…" : "Attach"}
        </button>

        <button
          onClick={sendText}
          className="px-4 rounded-xl bg-brand-600 hover:bg-brand-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
