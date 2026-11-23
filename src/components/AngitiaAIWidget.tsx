import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router"
import {
  Send,
  X,
  AlertCircle,
  Sparkles,
  Bot,
  RotateCcw,
  BookmarkCheck,
  Bookmark,
  ExternalLink,
  ShieldAlert,
} from "lucide-react"
import AngitiaIcon from "@/components/AngitiaIcon"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/utils/api"

const BLUE = "#1a3fcf"
const NAVY = "#0d1b4b"

const PRESET_TOPICS = [
  "How do I book a doctor?",
  "What is normal blood pressure?",
  "What are common symptoms of malaria?",
  "How does Break-Glass emergency work?",
  "Who built Healthitude?",
]

const STORAGE_KEY = "healthitude_angitia_session_v2"

interface Message {
  role: "assistant" | "user"
  text: string
  time?: string
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  text: "Hello! I am Angitia, your Healthitude health companion and platform co-pilot. You can ask me about symptoms, general health, medications, or how to book verified doctors on Healthitude.",
  time: "Just now",
}

/**
 * Lightweight parser for text with markdown links and bold formatting.
 */
function FormattedMessage({ text }: { text: string }) {
  const navigate = useNavigate()

  // Match markdown links [Title](url) and split
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)

  return (
    <div className="space-y-1.5 leading-relaxed text-xs sm:text-sm">
      {parts.map((part, index) => {
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (linkMatch) {
          const [, label, url] = linkMatch
          const isInternal = url.startsWith("/")
          return (
            <button
              key={index}
              onClick={() => {
                if (isInternal) {
                  navigate(url)
                } else {
                  window.open(url, "_blank", "noopener,noreferrer")
                }
              }}
              className="inline-flex items-center gap-1 my-1 px-2.5 py-1 rounded-md text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
            >
              <span>{label}</span>
              <ExternalLink className="w-3 h-3 text-blue-500" />
            </button>
          )
        }

        // Process bold markers **text**
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g)
        return (
          <span key={index}>
            {boldParts.map((bPart, bIdx) => {
              if (bPart.startsWith("**") && bPart.endsWith("**")) {
                return (
                  <strong key={bIdx} className="font-semibold text-slate-900">
                    {bPart.slice(2, -2)}
                  </strong>
                )
              }
              return bPart
            })}
          </span>
        )
      })}
    </div>
  )
}

export default function AngitiaAIWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // ignore
    }
    return [INITIAL_MESSAGE]
  })

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Persist session to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // ignore
    }
  }, [messages])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [messages, open, isTyping])

  function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  function handleReset() {
    setMessages([INITIAL_MESSAGE])
    setSaveStatus("idle")
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  async function handleSaveChat() {
    if (messages.length <= 1 || saveStatus === "saving" || saveStatus === "saved") return
    setSaveStatus("saving")
    try {
      const title =
        messages.find((m) => m.role === "user")?.text.slice(0, 60) ||
        "Angitia Health Consultation"

      await api.ai.save(title, messages)
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 4000)
    } catch (err) {
      console.error("[Angitia AI] Error saving chat:", err)
      setSaveStatus("idle")
    }
  }

  async function handleSend(textToSend?: string) {
    const text = (textToSend ?? input).trim()
    if (!text || isTyping) return

    const userTime = getCurrentTime()
    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", text, time: userTime },
    ]
    setMessages(updatedMessages)
    setInput("")
    setIsTyping(true)

    try {
      const historyPayload = updatedMessages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }))

      const response = await api.ai.chat(text, historyPayload)
      const reply =
        response?.reply ||
        "I hear you, and your health matters deeply. For personalized clinical review and diagnosis, our verified Healthitude doctors are available: [Book a Telemedicine Consultation](/telemedicine)."

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: reply,
          time: getCurrentTime(),
        },
      ])
    } catch (err) {
      console.warn("[Angitia AI] Connection error, using offline response:", err)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Thank you for reaching out. Please take a gentle breath and stay well hydrated. Our verified doctors are available for confidential medical evaluations whenever you need: [Book a Telemedicine Consultation](/telemedicine).",
          time: getCurrentTime(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <aside
      aria-label="Angitia AI Health Assistant"
      className="fixed bottom-6 right-6 z-[9999] pointer-events-auto"
      style={{ isolation: "isolate" }}
    >
      {/* ── Chat Window ── */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="angitia-title"
          className="mb-3 flex flex-col bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
          style={{
            width: "390px",
            maxWidth: "calc(100vw - 32px)",
            height: "540px",
            maxHeight: "calc(100vh - 120px)",
            borderRadius: "1.25rem",
            boxShadow:
              "0 20px 45px -10px rgba(13, 27, 75, 0.3), 0 0 0 1px rgba(226, 232, 240, 0.9)",
          }}
        >
          {/* Header */}
          <header
            className="flex items-center justify-between px-4 py-3 border-b border-white/10"
            style={{
              background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 100%)`,
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                style={{
                  borderRadius: "9999px",
                  background: "rgba(255, 255, 255, 0.18)",
                  boxShadow: "0 0 12px rgba(14, 165, 233, 0.35)",
                }}
              >
                <AngitiaIcon size={24} color="#ffffff" pulseColor="#38bdf8" />
              </div>
              <div>
                <h2
                  id="angitia-title"
                  className="text-white text-base font-bold tracking-tight leading-tight flex items-center gap-1.5"
                >
                  Angitia AI
                </h2>
                <p className="text-[11px] text-sky-200 font-medium">
                  Health Companion & Platform Co-Pilot
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Reset button */}
              <button
                onClick={handleReset}
                title="Start new conversation"
                aria-label="Start new conversation"
                className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer rounded-full"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer rounded-full"
                aria-label="Close Angitia AI"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Clinical & Safety Disclaimer */}
          <div className="px-3 py-1.5 bg-amber-50/90 border-b border-amber-200/70 text-[11px] text-amber-800 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Educational only:</strong> Not a medical diagnosis.
              </span>
            </div>

            {/* Save chat button for logged-in patients */}
            {user && user.role === "patient" && messages.length > 1 && (
              <button
                onClick={handleSaveChat}
                disabled={saveStatus === "saving" || saveStatus === "saved"}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                  saveStatus === "saved"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
                }`}
              >
                {saveStatus === "saved" ? (
                  <>
                    <BookmarkCheck className="w-3 h-3 text-emerald-600" /> Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3 h-3 text-blue-600" /> Save Chat
                  </>
                )}
              </button>
            )}
          </div>

          {/* Conversation history */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/60">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[88%] px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    m.role === "user"
                      ? "text-white shadow-sm"
                      : "bg-white text-slate-800 border border-slate-200/80 shadow-sm"
                  }`}
                  style={{
                    borderRadius:
                      m.role === "user"
                        ? "1rem 1rem 0.25rem 1rem"
                        : "1rem 1rem 1rem 0.25rem",
                    background: m.role === "user" ? BLUE : undefined,
                  }}
                >
                  {m.role === "user" ? (
                    <span>{m.text}</span>
                  ) : (
                    <FormattedMessage text={m.text} />
                  )}
                </div>
                {m.time && (
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {m.time}
                  </span>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <div
                  className="w-6 h-6 flex items-center justify-center bg-blue-100/60"
                  style={{ borderRadius: "9999px" }}
                >
                  <Bot className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex gap-1 items-center bg-white border border-slate-200 px-2.5 py-1.5 rounded-full shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Co-Pilot Suggestions */}
          {messages.length <= 2 && !isTyping && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex flex-wrap gap-1.5">
              <span className="w-full text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sky-500" /> Suggested topics
              </span>
              {PRESET_TOPICS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-[11px] px-2.5 py-1 bg-blue-50/70 border border-blue-200/80 text-blue-800 hover:bg-blue-100/80 hover:border-blue-300 transition-all text-left cursor-pointer rounded-full"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input & Send */}
          <footer className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Ask Angitia about health, symptoms, doctors..."
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 px-3.5 py-2.5 rounded-xl outline-none transition-all"
              aria-label="Ask Angitia about health or doctors"
              disabled={isTyping}
            />

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors shadow-sm cursor-pointer rounded-xl flex-shrink-0"
              aria-label="Send message to Angitia"
            >
              <Send className="w-4 h-4" />
            </button>
          </footer>
        </div>
      )}

      {/* ── Floating Sticky Toggle (Beating Heart Icon -> Hover to reveal 'Angitia AI') ── */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close Angitia AI" : "Angitia AI Health Companion"}
        title="Angitia AI"
        className="group relative flex items-center h-14 bg-gradient-to-r from-[#0d1b4b] to-[#1a3fcf] text-white shadow-xl hover:shadow-2xl transition-all duration-300 ease-out cursor-pointer overflow-hidden active:scale-95 border-2 border-white/20"
        style={{
          borderRadius: "9999px",
          paddingLeft: "0.875rem",
          paddingRight: open ? "0.875rem" : "0.875rem",
        }}
      >
        {/* Beating Heart Icon */}
        <div className="flex items-center justify-center flex-shrink-0">
          <AngitiaIcon size={28} color="#ffffff" pulseColor="#38bdf8" />
        </div>

        {/* Text expands on hover */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out whitespace-nowrap ${
            open
              ? "max-w-[120px] ml-2 opacity-100"
              : "max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:ml-2 group-hover:opacity-100"
          }`}
        >
          <span className="font-semibold text-sm tracking-tight pr-1">
            {open ? "Close" : "Angitia AI"}
          </span>
        </div>
      </button>
    </aside>
  )
}
