import { env } from "../config/env"

export interface ChatMessage {
  role: "user" | "assistant" | "model"
  text: string
}

export interface UserContext {
  isLoggedIn?: boolean
  userName?: string
  role?: string
}

const SYSTEM_PROMPT = `You are Angitia AI, the dedicated, sound, and compassionate healthcare companion and platform co-pilot of Healthitude — an African healthcare continuity platform founded in Ibadan, Nigeria by Bolaji David (University of Ibadan) through the help and grace of God.

STRICT MANDATORY DIRECTIVES:

1. STRICT HEALTH & HEALTHITUDE SCOPE RESTRICTION:
- You must answer ONLY questions directly related to:
  a. Human health, symptoms, medical conditions, medications, nutrition, preventive care, mental health, anatomy, and first aid.
  b. Healthitude platform navigation: how to connect with verified doctors, book telemedicine consultations, use transparent category pricing, access lifetime health records, and utilize Break-Glass emergency services.
- If a user asks about ANY topic outside human health and Healthitude (such as computer programming, mathematics, finance, crypto, politics, gaming, sports, celebrity gossip, academic homework, or casual non-health chat), you must GENTLY, WARMLY, and FIRMLY decline:
  "I am Angitia, your dedicated Healthitude health companion. My purpose is exclusively devoted to your health, wellness, and medical peace of mind. How can I support your health or well-being today?"
- NEVER answer non-health prompts, even if framed as hypothetical or creative scenarios.

2. SOUND, CALMING, AND COMFORTING TONE:
- Every response must feel reassuring, empathetic, gentle, and medically grounded. People asking health questions are often anxious, uncomfortable, or seeking reassurance.
- Use warm, respectful language that relieves anxiety while delivering accurate, sound medical information.
- Structure answers with clear, digestible points so the reader never feels overwhelmed.

3. CLINICAL GOVERNANCE & PATIENT SAFETY:
- Provide evidence-based, responsible health education.
- Clearly emphasize that your guidance is educational and cannot replace clinical diagnosis, physical examination, or prescription from a licensed doctor.
- In emergencies (e.g., severe sudden chest pressure, signs of stroke, difficulty breathing, profuse bleeding), explicitly warn the patient and direct them to urgent emergency care and Healthitude's Break-Glass protocol: [Break-Glass Emergency Protocol](/emergency).

4. PLATFORM CO-PILOT CAPABILITIES:
- Seamlessly guide users toward relevant Healthitude features:
  - Doctor Consultations: Recommend booking a consultation with verified doctors when symptoms require review: [Book a Telemedicine Consultation](/telemedicine).
  - Emergency Situations: [Break-Glass Emergency Protocol](/emergency).
  - Medical History & Continuity: [View My Health Records](/patient/dashboard).
  - Pricing & HMO Categories: Explain Healthitude's pre-negotiated transparent category pricing: [Explore Care Categories](/pricing).

5. FOUNDER & PLATFORM HERITAGE:
- When asked who built Healthitude or about its background, warmly explain that it was built by Bolaji David, a student of the University of Ibadan in Ibadan, Nigeria, through the help and grace of God. He created it to solve healthcare's greatest hurdles: crippling costs, distant doctors, lost medical records, and delayed emergency response.

6. CLEAN STANDARD MARKDOWN FORMATTING:
- Format your replies using clean, elegant Markdown.
- Use standard bullet lists for tips and action items.
- Emphasize important medical advice using bold text (**like this**).
- Keep formatting clean and legible without excessive header symbols.`

/**
 * Intelligent calming fallback when Gemini API key is offline or during high demand.
 */
export function getComfortingFallbackResponse(userPrompt: string): string {
  const p = userPrompt.toLowerCase().trim()

  // Founder and Healthitude background
  if (
    p.includes("built") ||
    p.includes("found") ||
    p.includes("who made") ||
    p.includes("who created") ||
    p.includes("bolaji") ||
    p.includes("david") ||
    p.includes("ibadan") ||
    p.includes("about healthitude") ||
    p.includes("what is healthitude")
  ) {
    return "Healthitude was founded in Ibadan, Nigeria by Bolaji David, a student of the prestigious University of Ibadan, through the help and grace of God. He built Healthitude with a compassionate vision to solve healthcare's greatest hurdles — eliminating crippling medical costs through transparent category pricing, connecting patients to verified doctors anywhere via [Telemedicine](/telemedicine), keeping lifetime medical records secure, and providing instant [Break-Glass Emergency Response](/emergency)."
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
    return "I am Angitia, your dedicated Healthitude health companion. My purpose is exclusively devoted to your health, wellness, and medical peace of mind. How can I support your health or well-being today?"
  }

  // Emergency red-flags
  if (
    p.includes("chest pain") ||
    p.includes("heart attack") ||
    p.includes("can't breathe") ||
    p.includes("shortness of breath") ||
    p.includes("stroke") ||
    p.includes("unconscious")
  ) {
    return "⚠️ **Urgent Medical Notice:** Severe chest pain, sudden numbness, or difficulty breathing require immediate emergency medical attention. Please contact your nearest emergency department immediately or use our emergency protocol: [Break-Glass Emergency Protocol](/emergency). Do not wait or drive yourself if you are feeling faint."
  }

  // Doctor booking & telemedicine queries
  if (
    p.includes("book") ||
    p.includes("see a doctor") ||
    p.includes("consult") ||
    p.includes("appointment") ||
    p.includes("specialist")
  ) {
    return "On Healthitude, you can easily connect with verified general practitioners and specialists for confidential consultations from the comfort of your home. You can schedule or start an instant consultation here: [Book a Telemedicine Consultation](/telemedicine)."
  }

  // Medical records queries
  if (p.includes("record") || p.includes("history") || p.includes("prescription") || p.includes("dashboard")) {
    return "Your medical records, consultation summaries, and active prescriptions are encrypted and accessible anytime in your patient portal: [View My Health Records](/patient/dashboard)."
  }

  // Pricing & Categories queries
  if (p.includes("price") || p.includes("cost") || p.includes("category") || p.includes("fee") || p.includes("hmo")) {
    return "Healthitude provides upfront transparent category pricing tailored for students, nursing mothers, civil servants, and general patients, ensuring there are no hidden fees. You can view all categories here: [Explore Care Categories](/pricing)."
  }

  // Specific common symptoms
  if (p.includes("headache") || p.includes("migraine")) {
    return "I understand headaches can be very draining and uncomfortable. Common causes include dehydration, tension, eye strain, lack of sleep, or sinus pressure. Please try resting in a quiet, dimly lit room, sipping cool water, and relaxing your neck muscles. If your headache is sudden and unusually severe ('thunderclap'), accompanied by fever, neck stiffness, or vision changes, please seek emergency medical care or book an immediate review: [Book a Telemedicine Consultation](/telemedicine)."
  }

  if (p.includes("dizzy") || p.includes("dizziness") || p.includes("lightheaded")) {
    return "Feeling dizzy can be very unsettling. Please sit or lie down in a safe position immediately, avoid sudden head turns, and slowly sip clean water. Mild dizziness is often linked to dehydration, sudden posture changes, or mild fatigue. However, if your dizziness persists, or is accompanied by chest pain or slurred speech, please consult a verified doctor: [Book a Telemedicine Consultation](/telemedicine)."
  }

  if (p.includes("stomach") || p.includes("abdominal") || p.includes("belly") || p.includes("cramp")) {
    return "I hear your concern, and abdominal discomfort can feel very distressing. Gentle measures such as sipping warm peppermint or ginger tea, staying hydrated, and avoiding heavy, greasy foods can help soothe mild indigestion or gas. However, if your pain is sharp, concentrated on one side, accompanied by fever, vomiting, or persistent diarrhea, it is very important to have one of our verified Healthitude clinicians evaluate you: [Book a Telemedicine Consultation](/telemedicine)."
  }

  if (p.includes("blood pressure") || p.includes("hypertension") || p.includes("bp")) {
    return "Blood pressure is one of the most vital markers of cardiovascular health. A normal resting blood pressure for adults is generally below 120/80 mmHg. Managing stress, reducing salt intake, staying active, and taking prescribed medications consistently make a profound difference. Would you like to schedule a review with a verified Healthitude doctor? [Book a Telemedicine Consultation](/telemedicine)."
  }

  if (p.includes("anxious") || p.includes("anxiety") || p.includes("stress") || p.includes("depress") || p.includes("panic")) {
    return "Please take a slow, gentle breath. You are not alone, and it is completely okay to feel overwhelmed at times. Try breathing in deeply for four counts, holding gently for four, and breathing out slowly for six. Ground yourself by noticing three things around you. Mental health is just as critical as physical health, and our verified doctors are here to provide compassionate, confidential support whenever you need: [Book a Telemedicine Consultation](/telemedicine)."
  }

  if (p.includes("malaria") || p.includes("fever") || p.includes("chills") || p.includes("typhoid")) {
    return "Fever and chills should always be treated with gentle care and attention. In tropical regions, fever can be a sign of malaria, typhoid, or a viral infection. Rest, stay well hydrated with clean water or electrolyte fluids, and avoid self-medicating with unconfirmed antimalarials. We strongly recommend having a rapid diagnostic test (RDT) done and consulting a verified doctor: [Book a Telemedicine Consultation](/telemedicine)."
  }

  return "Thank you for reaching out to me. Your health and peace of mind are deeply precious. While I can offer sound educational guidance on symptoms, wellness, and health management, nothing replaces the personalized insight of a licensed doctor. Take a gentle breath, stay well hydrated, and consider booking a video consultation with one of our verified Healthitude professionals: [Book a Telemedicine Consultation](/telemedicine)."
}

/**
 * Calls Google Gemini Flash model with multi-turn conversation, platform co-pilot directives, and graceful fallback.
 */
export async function generateAngitiaHealthResponse(
  message: string,
  history: ChatMessage[] = [],
  context: UserContext = {},
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

  // Priority order across verified Google AI Studio Gemini models
  const candidateModels = Array.from(
    new Set([
      preferredModel,
      "gemini-3.8-flash",
      "gemini-flash-latest",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite",
      "gemini-flash-lite-latest",
    ]),
  )

  if (!apiKey) {
    return {
      text: getComfortingFallbackResponse(message),
      source: "fallback",
    }
  }

  // Enriched system instructions with user context if logged in
  let effectiveSystemPrompt = SYSTEM_PROMPT
  if (context.isLoggedIn && context.userName) {
    effectiveSystemPrompt += `\n\nUSER CONTEXT:\n- The user is currently logged into their patient portal as ${context.userName}.\n- You can reference that they can view their records directly in their dashboard or request consultation summaries.`
  }

  // 1. Primary: Try Google AI Studio Interactions API (fastest for 3.8 Flash)
  try {
    const interController = new AbortController()
    const interTimeout = setTimeout(() => interController.abort(), 3000)

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
          system_instruction: effectiveSystemPrompt,
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
    }
  } catch (err: any) {
    // Continue to generateContent fallback
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
      const timeout = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: effectiveSystemPrompt }],
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
    } catch {
      continue
    }
  }

  return {
    text: getComfortingFallbackResponse(message),
    source: "fallback",
  }
}
