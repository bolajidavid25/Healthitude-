import { env } from "../config/env"
import { prisma } from "../config/prisma"
import {
  ProfessionalVerificationStatus,
  ProfessionalAccountStatus,
} from "../generated/prisma/enums"

export interface ChatMessage {
  role: "user" | "assistant" | "model"
  text: string
}

export interface UserContext {
  isLoggedIn?: boolean
  userId?: string
  userName?: string
  role?: string
}

/**
 * Retrieves live context directly from the PostgreSQL system database to ground Angitia AI
 * in real Healthitude data (verified doctors, care categories, patient medical profile).
 */
export async function getSystemDatabaseContext(userId?: string): Promise<string> {
  const sections: string[] = []

  // 1. Live Verified Doctors from database
  try {
    const verifiedDoctors = await prisma.professional.findMany({
      where: {
        verificationStatus: ProfessionalVerificationStatus.VERIFIED,
        accountStatus: ProfessionalAccountStatus.ACTIVE,
      },
      select: {
        firstName: true,
        lastName: true,
        profession: true,
        specialty: true,
        qualification: true,
        institution: true,
      },
      take: 12,
    })

    if (verifiedDoctors.length > 0) {
      const docLines = verifiedDoctors.map((doc) => {
        const title = `Dr. ${doc.firstName} ${doc.lastName}`
        const spec = doc.profession || doc.specialty || "Medical Doctor"
        const qual = doc.qualification ? ` (${doc.qualification})` : ""
        const inst = doc.institution ? ` trained at ${doc.institution}` : ""
        return `- ${title}: ${spec}${qual}${inst}`
      })
      sections.push(
        `LIVE DATABASE — VERIFIED DOCTORS CURRENTLY AVAILABLE ON HEALTHITUDE:\n${docLines.join(
          "\n",
        )}`,
      )
    }
  } catch (err) {
    console.warn("[Angitia AI] Could not fetch live doctors from database:", err)
  }

  // 2. Healthitude Platform Care Categories & Protocols
  sections.push(
    `LIVE DATABASE — HEALTHITUDE PLATFORM CARE TIERS & PROTOCOLS:
- Nursing & Breastfeeding Mothers: Specialized maternal care, neonatal support, lactation guidance.
- Students: Subsidized, student-friendly medical consultations for university and polytechnic students.
- Civil Servants: Dedicated coverage for state and federal government staff.
- Elderly Care: Geriatric monitoring, chronic disease management, and mobility support.
- Corporate & Company Members: Workplace health continuity and pre-employment health checks.
- NHIS & Insurance Members: Coordinated health coverage.
- General Patients: Direct, on-demand primary care and specialist telemedicine.
- Break-Glass Emergency Care: Instant clinical access protocol in critical life-threatening emergencies.`,
  )

  // 3. Authenticated Patient Medical Profile (if logged in)
  if (userId) {
    try {
      const patient = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          healthProfile: true,
          patientCategory: true,
          complaints: {
            where: { status: { not: "RESOLVED" } },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
          appointments: {
            where: { scheduledAt: { gte: new Date() } },
            orderBy: { scheduledAt: "asc" },
            take: 2,
          },
        },
      })

      if (patient) {
        const pLines: string[] = [
          `AUTHENTICATED PATIENT MEDICAL RECORD (FROM SYSTEM DATABASE):`,
          `- Name: ${patient.firstName} ${patient.lastName}`,
        ]
        if (patient.patientCategory) {
          pLines.push(`- Category: ${patient.patientCategory.category}`)
        }
        if (patient.healthProfile) {
          pLines.push(`- Blood Group: ${patient.healthProfile.bloodGroup || "Not specified"}`)
          pLines.push(`- Genotype: ${patient.healthProfile.genotype || "Not specified"}`)
          if (patient.healthProfile.allergies) {
            pLines.push(`- Known Allergies: ${patient.healthProfile.allergies}`)
          }
          if (patient.healthProfile.chronicConditions) {
            pLines.push(`- Chronic Conditions: ${patient.healthProfile.chronicConditions}`)
          }
        }
        if (patient.complaints.length > 0) {
          const cList = patient.complaints.map((c) => `${c.symptoms} (${c.severity})`).join("; ")
          pLines.push(`- Active Health Complaints: ${cList}`)
        }
        if (patient.appointments.length > 0) {
          const aList = patient.appointments.map((a) => a.title).join("; ")
          pLines.push(`- Upcoming Appointments: ${aList}`)
        }
        sections.push(pLines.join("\n"))
      }
    } catch (err) {
      console.warn("[Angitia AI] Could not fetch patient profile from database:", err)
    }
  }

  return sections.join("\n\n")
}

/**
 * Builds the comprehensive dynamic system instruction incorporating clinical guidelines,
 * platform navigation, founder history, and real-time database context.
 */
function buildSystemPrompt(databaseContext: string): string {
  return `You are Angitia AI, the intelligent, sound, and compassionate clinical healthcare companion and platform co-pilot of Healthitude — an African healthcare continuity platform founded in Ibadan, Nigeria by Bolaji David (University of Ibadan) through the help and grace of God.

STRICT MANDATORY DIRECTIVES:

1. STRICT HEALTH & HEALTHITUDE DOMAIN RESTRICTION:
- You must answer ONLY questions directly related to:
  a. Human health, symptoms, medical science, conditions, medications, nutrition, wellness, preventive care, mental health, anatomy, and first aid.
  b. Healthitude platform navigation: how to connect with verified doctors, book telemedicine consultations, utilize transparent category pricing, access lifetime health records, and trigger Break-Glass emergency services.
- If a user asks about ANY topic outside human health and Healthitude (such as computer coding, software, math, crypto, stocks, finance, entertainment, celebrities, sports, politics, or general chit-chat), GENTLY and FIRMLY decline:
  "I am Angitia, your dedicated Healthitude health companion. My purpose is exclusively devoted to your health, wellness, and medical peace of mind. How can I support your health or well-being today?"
- NEVER answer non-health prompts, even hypothetically.

2. SOUND, CALMING, AND EMPATHETIC CLINICAL TONE:
- Communicate with medical soundness, calm reassurance, empathy, and clarity.
- Structure answers with digestible bullet points so patients experiencing discomfort never feel overwhelmed.

3. CLINICAL GOVERNANCE & SAFETY:
- Provide evidence-based, responsible health education.
- Clearly emphasize that your guidance is educational and cannot replace clinical diagnosis, physical examination, or prescription from a licensed doctor.
- In emergencies (e.g. severe chest pain, shortness of breath, signs of stroke, acute trauma), immediately elevate the response and direct the user to urgent emergency care and Healthitude's Break-Glass protocol: [Break-Glass Emergency Protocol](/emergency).

4. LIVE SYSTEM DATABASE GROUNDING:
- Below is live context queried directly from the Healthitude database. When the user asks about available doctors, specialists, categories, or their own health profile, ground your answers in this real system data:

${databaseContext}

5. PLATFORM CO-PILOT ACTIONS:
- Provide clickable Markdown router links to help users take action:
  - Telemedicine booking: [Book a Telemedicine Consultation](/telemedicine)
  - Emergency protocol: [Break-Glass Emergency Protocol](/emergency)
  - Medical records: [View My Health Records](/patient/dashboard)
  - Transparent pricing: [Explore Care Categories](/pricing)

6. FOUNDER & PLATFORM HERITAGE:
- When asked who built Healthitude or about its background, warmly explain that it was created by Bolaji David, a student of the University of Ibadan in Ibadan, Nigeria, through the help and grace of God. He built it to solve real systemic challenges: crippling healthcare costs, distant doctors, lost records, and delayed emergency response.

7. STANDARD CLEAN MARKDOWN FORMATTING:
- Format responses in clean, modern Markdown.
- Use standard bullet lists (\`* \` or \`- \`) for tips and action items.
- Use bold text (\`**like this**\`) for emphasis.
- Do NOT output raw formatting hashes or unnecessary decorative symbols.`
}

/**
 * Calls Google Gemini Flash model dynamically with live system database context.
 * Throws on actual API failures so the application never serves fake hardcoded replies.
 */
export async function generateAngitiaHealthResponse(
  message: string,
  history: ChatMessage[] = [],
  context: UserContext = {},
): Promise<{ text: string; source: "gemini" }> {
  const rawKey =
    process.env.ANGITIA ||
    process.env.ANGITIA_API_KEY ||
    env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ""
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, "")

  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured. Please ensure ANGITIA or GEMINI_API_KEY is set in your environment.",
    )
  }

  // 1. Fetch live context from PostgreSQL database
  const databaseContext = await getSystemDatabaseContext(context.userId)
  const systemPrompt = buildSystemPrompt(databaseContext)

  const rawModel = (
    process.env.GEMINI_MODEL ||
    env.GEMINI_MODEL ||
    "gemini-3.8-flash"
  ).trim()
  const preferredModel =
    rawModel === "gemini-2.5-flash" || !rawModel ? "gemini-3.8-flash" : rawModel

  const candidateModels = Array.from(
    new Set([
      preferredModel,
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
    ]),
  )

  // 2. Primary: Google AI Studio Interactions API (Standard for Gemini 3.8 Flash)
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
          system_instruction: systemPrompt,
        }),
      },
    )

    clearTimeout(interTimeout)

    if (interRes.ok) {
      const data = await interRes.json()
      if (typeof data.output_text === "string" && data.output_text.trim()) {
        return { text: data.output_text.trim(), source: "gemini" }
      }
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
    // Continue to generateContent candidate models
  }

  // 3. Multi-model candidate loop with generateContent
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

  const errors: string[] = []
  for (const modelName of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        modelName,
      )}:generateContent?key=${apiKey}`

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.35,
            topP: 0.85,
            maxOutputTokens: 750,
          },
        }),
      })

      clearTimeout(timeout)

      if (!response.ok) {
        errors.push(`${modelName} (status ${response.status})`)
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
    } catch (err: any) {
      errors.push(`${modelName} (${err?.message || "timeout"})`)
      continue
    }
  }

  // If all models failed, throw a real informative error — NEVER serve a fake hardcoded reply
  throw new Error(
    `Angitia AI is momentarily unable to reach Google Gemini. Attempts: ${errors.join(", ") || "none"}. Please try again shortly.`,
  )
}
