import { env } from "../config/env"

export interface ChatMessage {
  role: "user" | "assistant" | "model"
  text: string
}

const SYSTEM_PROMPT = `You are Angitia AI, the dedicated, sound, and compassionate healthcare assistant of Healthitude — an African healthcare continuity platform founded in Ibadan, Nigeria by Bolaji David (University of Ibadan) through the help of God.

STRICT MANDATORY DIRECTIVES:

1. STRICT HEALTH-ONLY DOMAIN RESTRICTION:
- You must answer ONLY questions directly related to human health, symptoms, medical conditions, medications, nutrition, wellness, preventive care, mental health, anatomy, and how Healthitude connects patients with verified doctors and telemedicine.
- If a user asks about ANY topic outside health, medicine, and wellness (such as computer programming, mathematics, finance, crypto, politics, gaming, sports, celebrity news, academic homework, or general chit-chat), you must GENTLY, WARMLY, and FIRMLY decline:
  "I am Angitia, your dedicated Healthitude health companion. My purpose is exclusively devoted to your health, wellness, and medical peace of mind. How can I support your health or well-being today?"
- NEVER fulfill non-health prompts, even if framed as hypothetical or creative scenarios.

2. SOUND, CALMING, AND COMFORTING TONE:
- Every response must feel reassuring, empathetic, gentle, and medically grounded. People asking health questions are often worried, uncomfortable, or seeking reassurance.
- Use warm, respectful language that relieves anxiety while delivering accurate, sound medical information.
- Structure your answers with clear, digestible points so the reader does not feel overwhelmed.

3. CLINICAL GOVERNANCE & PATIENT SAFETY:
- Provide evidence-based, responsible health education.
- Clearly emphasize that your guidance is educational and cannot replace clinical diagnosis, physical examination, or prescription from a licensed doctor.
- Remind patients that they can book a confidential consultation with verified Healthitude doctors or use Break-Glass emergency services on Healthitude when acute care is required.

4. HEALTHITUDE FOUNDATION & LEADERSHIP:
- When asked who built Healthitude or about its background, proudly and warmly explain that it was built by Bolaji David, a student of the University of Ibadan in Ibadan, Nigeria, through the help and grace of God. He built it to solve real healthcare challenges: high costs, distant doctors, lost records, and emergency care.`

/**
 * Intelligent calming fallback when Gemini API key is not yet configured or offline.
 */
export function getComfortingFallbackResponse(userPrompt: string): string {
  const p = userPrompt.toLowerCase().trim()

  // Founder and Healthitude background
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

  // Non-health filter
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

/**
 * Calls Google Gemini Flash model with multi-turn conversation and system prompt.
 */
export async function generateAngitiaHealthResponse(
  message: string,
  history: ChatMessage[] = [],
): Promise<{ text: string; source: "gemini" | "fallback" }> {
  const rawKey =
    process.env.ANGITIA ||
    process.env.ANGITIA_API_KEY ||
    env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ""
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, "")

  const rawModel = (
    process.env.GEMINI_MODEL ||
    env.GEMINI_MODEL ||
    "gemini-3.8-flash"
  ).trim()
  const preferredModel =
    rawModel === "gemini-2.5-flash" || !rawModel ? "gemini-3.8-flash" : rawModel
  // Prioritize gemini-3.8-flash as recommended by Google AI Studio
  const candidateModels = Array.from(
    new Set([preferredModel, "gemini-3.8-flash", "gemini-2.5-flash"]),
  )

  if (!apiKey) {
    return {
      text: getComfortingFallbackResponse(message),
      source: "fallback",
    }
  }

  // 1. Primary: Google AI Studio Interactions API (Standard for Gemini 3.8 Flash)
  try {
    const interController = new AbortController()
    const interTimeout = setTimeout(() => interController.abort(), 12000)

    const interRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: interController.signal,
        body: JSON.stringify({
          model: preferredModel,
          input: message,
          system_instruction: SYSTEM_PROMPT,
        }),
      },
    )

    clearTimeout(interTimeout)

    if (interRes.ok) {
      const data = await interRes.json()
      const steps = data.steps || []
      for (const step of steps) {
        if (step.content && Array.isArray(step.content)) {
          for (const block of step.content) {
            if (block.type === "text" && block.text) {
              return { text: block.text.trim(), source: "gemini" }
            }
          }
        }
      }
      if (typeof data.output === "string" && data.output.trim()) {
        return { text: data.output.trim(), source: "gemini" }
      }
    } else {
      const errText = await interRes.text()
      console.warn(`[Angitia AI] Interactions API returned ${interRes.status}:`, errText)
    }
  } catch (err: any) {
    console.warn("[Angitia AI] Interactions API error:", err?.message || err)
  }

  // 2. Secondary: Multi-model candidate loop using generateContent
  const contents = [
    ...history.slice(-8).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    })),
    {
      role: "user",
      parts: [{ text: message }],
    },
  ]

  for (const modelName of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        modelName,
      )}:generateContent?key=${apiKey}`

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 12000)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            temperature: 0.35, // Balanced, sound, clinical consistency
            topP: 0.85,
            maxOutputTokens: 650,
          },
        }),
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const errText = await response.text()
        console.warn(`[Angitia AI] Gemini model '${modelName}' returned status ${response.status}:`, errText)
        continue
      }

      const data = await response.json()
      const candidateText =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

      if (candidateText) {
        return {
          text: candidateText,
          source: "gemini",
        }
      }
    } catch (error: any) {
      console.warn(`[Angitia AI] Error calling Gemini model '${modelName}':`, error.message || error)
      continue
    }
  }

  return {
    text: getComfortingFallbackResponse(message),
    source: "fallback",
  }
}
