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

function getLocalHealthResponse(userPrompt: string): string {
  const p = userPrompt.toLowerCase().trim()

  if (
    p.includes("built") ||
    p.includes("founder") ||
    p.includes("who made") ||
    p.includes("who created") ||
    p.includes("bolaji") ||
    p.includes("david") ||
    p.includes("ibadan") ||
    p.includes("about healthitude") ||
    p.includes("what is healthitude")
  ) {
    return "Healthitude was founded in Ibadan, Nigeria by Bolaji David, a student of the prestigious University of Ibadan, through the help and grace of God. He built Healthitude with a compassionate vision to solve healthcare's greatest hurdles — eliminating crippling medical costs through category pricing, connecting patients to doctors anywhere through telemedicine, keeping lifetime medical records safe, and providing instant Break-Glass emergency response."
  }

  const nonHealthKeywords = [
    "code",
    "python",
    "javascript",
    "html",
    "css",
    "sql",
    "math",
    "calculate",
    "crypto",
    "bitcoin",
    "stock market",
    "movie",
    "song",
    "football",
    "president",
    "politics",
    "game",
    "homework",
  ]
  if (nonHealthKeywords.some((k) => p.includes(k))) {
    return "I am Angitia, Healthitude's dedicated healthcare companion. My sole purpose is to support your health, wellness, and medical peace of mind. How may I assist you with your health, symptoms, or well-being today?"
  }

  if (p.includes("headache") || p.includes("migraine")) {
    return "I understand headaches can be very draining and uncomfortable. Common causes include dehydration, tension, eye strain, lack of sleep, or sinus pressure. Please try resting in a quiet, dimly lit room, sipping cool water, and relaxing your neck muscles. If your headache is sudden and unusually severe ('thunderclap'), accompanied by fever, neck stiffness, or vision changes, please seek immediate emergency medical care or consult a verified Healthitude physician right away."
  }

  if (p.includes("stomach") || p.includes("abdominal") || p.includes("belly") || p.includes("cramp")) {
    return "I hear your concern, and abdominal discomfort can feel very distressing. Gentle measures such as sipping warm peppermint or ginger tea, staying hydrated, and avoiding heavy, greasy foods can help soothe mild indigestion or gas. However, if your pain is sharp, concentrated on one side, accompanied by fever, vomiting, or persistent diarrhea, it is very important to have one of our verified Healthitude clinicians evaluate you to ensure proper care."
  }

  if (p.includes("blood pressure") || p.includes("hypertension") || p.includes("bp")) {
    return "Blood pressure is one of the most vital markers of cardiovascular health. A normal resting blood pressure for adults is generally below 120/80 mmHg. Consistent readings of 130/80 mmHg or higher indicate hypertension. Managing stress, reducing salt intake, staying active, and taking prescribed medications consistently make a profound difference. Would you like to schedule a review with a verified Healthitude doctor?"
  }

  if (p.includes("anxious") || p.includes("anxiety") || p.includes("stress") || p.includes("depress") || p.includes("panic")) {
    return "Please take a slow, gentle breath. You are not alone, and it is completely okay to feel overwhelmed at times. Try breathing in deeply for four counts, holding gently for four, and breathing out slowly for six. Ground yourself by noticing three things around you. Mental health is just as critical as physical health, and our verified doctors are here to provide compassionate, confidential support whenever you need."
  }

  if (p.includes("malaria") || p.includes("fever") || p.includes("chills") || p.includes("typhoid")) {
    return "Fever and chills should always be treated with gentle care and attention. In tropical regions, fever can be a sign of malaria, typhoid, or a viral infection. Rest, stay well hydrated with clean water or electrolyte fluids, and avoid self-medicating with unconfirmed antimalarials. We strongly recommend having a rapid diagnostic test (RDT) or full blood count done, and consulting a verified Healthitude doctor who can guide your safe recovery."
  }

  return "Thank you for reaching out to me. Your health and peace of mind are deeply precious. While I can offer sound educational guidance on symptoms, wellness, and health management, nothing replaces the personalized insight of a licensed doctor. Take a gentle breath, stay well hydrated, and consider booking a video consultation with one of our verified Healthitude professionals who can carefully review your history."
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
      // Sound calming clinical fallback
      const fallbackReply = getLocalHealthResponse(text)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: fallbackReply,
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
                <h2
                  id="angitia-title"
                  className="text-white text-base font-bold tracking-tight leading-tight"
                >
                  Angitia AI
                </h2>
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
              <strong>Educational only:</strong> Not a medical diagnosis or prescription.
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
