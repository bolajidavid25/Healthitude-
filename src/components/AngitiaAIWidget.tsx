import { useState, useEffect, useRef } from "react"
import { Send, X, AlertCircle, Sparkles, Bot, HeartPulse } from "lucide-react"
import AngitiaIcon from "@/components/AngitiaIcon"
import { api } from "@/utils/api"

const BLUE = "#1a3fcf"
const NAVY = "#0d1b4b"
const SKY = "#0ea5e9"

const PRESET_QUESTIONS = [
  "What is normal blood pressure?",
  "How does telemedicine work on Healthitude?",
  "How do I prepare for a doctor consultation?",
  "What is the difference between GP and Specialist?",
  "What are the symptoms of Type 2 diabetes?",
]

interface Message {
  role: "assistant" | "user"
  text: string
  time?: string
}

export default function AngitiaAIWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hello! I am Angitia, your Healthitude health and care assistant. Ask me anything about general health topics, symptoms, wellness, or how Healthitude connects you with verified doctors.",
      time: "Just now",
    },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [messages, open, isTyping])

  function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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
        "I hear you, and your health matters deeply. Please rest assured you are in safe hands. For personalized clinical review and diagnosis, our verified Healthitude doctors are available via telemedicine."

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: reply,
          time: getCurrentTime(),
        },
      ])
    } catch {
      // Calming emergency fallback if offline or network hiccup
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            "I hear you, and your well-being is of utmost importance. Please take a slow, gentle breath. I am momentarily operating in offline mode, but remember to stay hydrated, rest, and connect with a verified Healthitude doctor if you need clinical evaluation.",
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
            width: "380px",
            maxWidth: "calc(100vw - 32px)",
            height: "530px",
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
                <div className="flex items-center gap-1.5">
                  <h2
                    id="angitia-title"
                    className="text-white text-sm font-bold tracking-tight leading-tight"
                  >
                    Angitia AI
                  </h2>
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold text-sky-200 bg-sky-500/20 border border-sky-400/30"
                    style={{ borderRadius: "9999px" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Gemini Flash
                  </span>
                </div>
                <p className="text-white/70 text-[11px] leading-tight">
                  Calming Health Companion · Health Questions Only
                </p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              style={{ borderRadius: "9999px" }}
              aria-label="Close Angitia AI"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* Clinical Disclaimer */}
          <div className="px-3 py-1.5 bg-amber-50/90 border-b border-amber-200/70 text-[11px] text-amber-800 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Dedicated Health Companion:</strong> Answers health & wellness topics only. Not a medical diagnosis.
            </span>
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
                  className={`max-w-[85%] px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    m.role === "user"
                      ? "text-white"
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
                  {m.text}
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

          {/* Preset Prompts (Show when message list is short) */}
          {messages.length <= 2 && !isTyping && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex flex-wrap gap-1.5">
              <span className="w-full text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sky-500" /> Suggested topics
              </span>
              {PRESET_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-[11px] px-2.5 py-1 bg-blue-50/70 border border-blue-200/80 text-blue-800 hover:bg-blue-100/80 hover:border-blue-300 transition-all text-left cursor-pointer"
                  style={{ borderRadius: "9999px" }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input & Send */}
          <footer className="border-t border-slate-200/80 bg-white px-3 py-2.5 flex items-center gap-2">
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
              placeholder="Ask Angitia about health, symptoms..."
              className="flex-1 bg-slate-50 border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              style={{ borderRadius: "0.625rem" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 flex items-center justify-center flex-shrink-0 text-white disabled:opacity-40 transition-all cursor-pointer hover:brightness-110 active:scale-95"
              style={{
                borderRadius: "0.625rem",
                background: `linear-gradient(135deg, ${BLUE}, ${SKY})`,
              }}
              aria-label="Send message to Angitia"
            >
              <Send className="w-4 h-4" />
            </button>
          </footer>
        </div>
      )}

      {/* ── Floating Action Button (Sticky lower right) ── */}
      <div className="flex justify-end">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="group flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer relative overflow-hidden h-14 px-3.5 hover:px-5"
          style={{
            borderRadius: "9999px",
            background: open
              ? "#1e293b"
              : `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 60%, ${SKY} 100%)`,
            border: "1.5px solid rgba(255, 255, 255, 0.35)",
            boxShadow:
              "0 10px 25px -3px rgba(26, 63, 207, 0.45), 0 4px 10px -2px rgba(14, 165, 233, 0.35)",
            minWidth: "3.5rem",
          }}
          aria-expanded={open}
          aria-label={open ? "Close Angitia AI" : "Angitia AI"}
          title="Angitia AI"
        >
          {/* Subtle pulse wave on unopened state */}
          {!open && (
            <span
              className="absolute -inset-1 rounded-full opacity-35 animate-ping pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${SKY} 0%, rgba(14, 165, 233, 0) 70%)`,
              }}
            />
          )}

          {open ? (
            <X className="w-6 h-6 flex-shrink-0 text-white" />
          ) : (
            <div className="flex items-center">
              <div className="relative flex items-center justify-center flex-shrink-0">
                <AngitiaIcon size={28} color="#ffffff" pulseColor="#38bdf8" />
              </div>
              <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2.5 transition-all duration-300 ease-out overflow-hidden whitespace-nowrap text-sm font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
                Angitia AI
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              </span>
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}
