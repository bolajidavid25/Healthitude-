import { AppError, ErrorCode } from "../errors/AppError"
import { ProviderQueryInput } from "../validation/provider"

export interface ProviderRecord {
  id: string
  name: string
  specialty: string
  qualifications: string
  experience: string
  languages: string
  facility: string
  location: string
  consultType: string
  fee: string
  availability: string
  verified: boolean
  rating: number
  reviews?: number
  bio: string
  avatar: string
}

/**
 * Verified healthcare provider registry.
 * Sourced directly from approved clinical records in the Healthitude frontend.
 */
export const VERIFIED_PROVIDERS: ProviderRecord[] = [
  {
    id: "prov-001",
    name: "Dr. Kofi Boateng",
    specialty: "General Practice",
    qualifications: "MBChB, FWACP",
    experience: "12 years",
    languages: "English, Twi",
    facility: "Korle Bu Teaching Hospital",
    location: "Accra, Ghana",
    consultType: "In-person & Video",
    fee: "₦8,500",
    availability: "Mon – Fri · 9 AM – 5 PM",
    verified: true,
    rating: 4.9,
    reviews: 312,
    bio: "Board-certified general practitioner specializing in preventive care, family health, and chronic illness management at Korle Bu Teaching Hospital.",
    avatar: "KB",
  },
  {
    id: "prov-002",
    name: "Dr. Efua Asante",
    specialty: "Cardiology",
    qualifications: "MBChB, FESC, FGhana-Card",
    experience: "18 years",
    languages: "English, Ga",
    facility: "Korle Bu Teaching Hospital",
    location: "Accra, Ghana",
    consultType: "In-person",
    fee: "₦14,000",
    availability: "Tue, Thu · 10 AM – 3 PM",
    verified: true,
    rating: 4.8,
    reviews: 218,
    bio: "Senior consultant cardiologist with extensive clinical experience in hypertension, cardiovascular risk stratification, and echocardiography.",
    avatar: "EA",
  },
  {
    id: "prov-003",
    name: "Dr. Ama Bentil",
    specialty: "General Practice",
    qualifications: "MBChB, MGCP",
    experience: "7 years",
    languages: "English, Ewe",
    facility: "Labadi Polyclinic",
    location: "Accra, Ghana",
    consultType: "Video",
    fee: "₦6,000",
    availability: "Mon, Wed, Fri · 8 AM – 12 PM",
    verified: true,
    rating: 4.7,
    reviews: 145,
    bio: "General practitioner focused on digital healthcare, early medical triage, and family health follow-ups.",
    avatar: "AB",
  },
  {
    id: "prov-004",
    name: "Dr. Samuel Osei",
    specialty: "Pediatrics",
    qualifications: "MBChB, DCH, FGCP",
    experience: "9 years",
    languages: "English, Akan",
    facility: "37 Military Hospital",
    location: "Accra, Ghana",
    consultType: "In-person & Video",
    fee: "₦9,000",
    availability: "Mon – Thu · 9 AM – 4 PM",
    verified: true,
    rating: 4.8,
    reviews: 189,
    bio: "Pediatric specialist passionate about infant health, neonatal care, developmental milestones, and routine immunization.",
    avatar: "SO",
  },
  {
    id: "prov-005",
    name: "Dr. Sarah Johnson",
    specialty: "General Practice",
    qualifications: "MBChB (University of Ghana), FWACP",
    experience: "8 years",
    languages: "English, Twi",
    facility: "Ridge Hospital",
    location: "Accra, Ghana",
    consultType: "In-person & Video",
    fee: "₦15,000",
    availability: "Mon – Fri · 9 AM – 4 PM",
    verified: true,
    rating: 4.9,
    reviews: 312,
    bio: "Board-certified general practitioner known for patient-centered communication and holistic family wellness.",
    avatar: "SJ",
  },
  {
    id: "prov-006",
    name: "Dr. Michael Ade",
    specialty: "Cardiology",
    qualifications: "MD (University of Lagos), FACC",
    experience: "12 years",
    languages: "English, Yoruba",
    facility: "Lagos University Teaching Hospital",
    location: "Lagos, Nigeria",
    consultType: "Video",
    fee: "₦25,000",
    availability: "Tue, Wed, Thu · 10 AM – 2 PM",
    verified: true,
    rating: 4.8,
    reviews: 218,
    bio: "Consultant cardiologist specializing in hypertension, heart failure, and preventive cardiology in tertiary clinical settings.",
    avatar: "MA",
  },
  {
    id: "prov-007",
    name: "Dr. Afia Mensah",
    specialty: "Dermatology",
    qualifications: "MBChB (KNUST), MSc Dermatology (UCL)",
    experience: "6 years",
    languages: "English, Twi, Fante",
    facility: "Komfo Anokye Teaching Hospital",
    location: "Kumasi, Ghana",
    consultType: "In-person & Video",
    fee: "₦18,000",
    availability: "Mon – Thu · 9 AM – 4 PM",
    verified: true,
    rating: 4.7,
    reviews: 175,
    bio: "Dermatology consultant specialized in cutaneous disorders, allergy reactions, cosmetic dermatology, and dermatologic screening.",
    avatar: "AM",
  },
  {
    id: "prov-008",
    name: "Dr. Kwame Osei",
    specialty: "Neurology",
    qualifications: "MD (Legon), PhD Neuroscience (Edinburgh)",
    experience: "15 years",
    languages: "English, Twi, Ga",
    facility: "Korle Bu Teaching Hospital",
    location: "Accra, Ghana",
    consultType: "In-person & Video",
    fee: "₦30,000",
    availability: "Wed, Fri · 9 AM – 1 PM",
    verified: true,
    rating: 4.9,
    reviews: 289,
    bio: "Consultant neurologist and clinical research fellow specializing in cerebrovascular health, migraine syndromes, and neurodegenerative disorders.",
    avatar: "KO",
  },
]

export interface ProviderListResult {
  providers: ProviderRecord[]
  total: number
  limit: number
  offset: number
  specialties: string[]
}

/**
 * Retrieves providers with optional search, specialty, and consultation type filters.
 */
export async function getProviders(
  query: ProviderQueryInput,
): Promise<ProviderListResult> {
  const {
    search,
    specialty,
    consultType,
    verified,
    limit = 50,
    offset = 0,
  } = query

  let results = [...VERIFIED_PROVIDERS]

  // 1. Text search across name, specialty, location, facility, languages, bio
  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.specialty.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.facility.toLowerCase().includes(q) ||
        p.languages.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q),
    )
  }

  // 2. Specialty filter
  if (specialty && specialty.trim()) {
    const spec = specialty.trim().toLowerCase()
    results = results.filter((p) => p.specialty.toLowerCase() === spec)
  }

  // 3. Consultation type filter
  if (consultType && consultType.trim()) {
    const cType = consultType.trim().toLowerCase()
    results = results.filter((p) => p.consultType.toLowerCase().includes(cType))
  }

  // 4. Verified filter
  if (verified !== undefined) {
    results = results.filter((p) => p.verified === verified)
  }

  const total = results.length
  const paginated = results.slice(offset, offset + limit)

  // Extract distinct specialties from registry for UI filter dropdowns
  const specialties = Array.from(
    new Set(VERIFIED_PROVIDERS.map((p) => p.specialty)),
  ).sort()

  return {
    providers: paginated,
    total,
    limit,
    offset,
    specialties,
  }
}

/**
 * Retrieves a single verified provider by ID or slug.
 */
export async function getProviderById(id: string): Promise<ProviderRecord> {
  const normalizedId = (id || "").trim().toLowerCase()
  const provider = VERIFIED_PROVIDERS.find(
    (p) =>
      p.id.toLowerCase() === normalizedId ||
      p.name.toLowerCase().replace(/[^a-z0-9]/g, "-") === normalizedId,
  )

  if (!provider) {
    throw new AppError(
      404,
      ErrorCode.NOT_FOUND,
      "Healthcare provider not found",
    )
  }

  return provider
}

/**
 * Rejects patient mutation attempts on provider records.
 */
export async function rejectPatientProviderMutation(
  action: string,
): Promise<never> {
  throw new AppError(
    403,
    ErrorCode.FORBIDDEN,
    `Provider records can only be managed by authorized administrators. Patients cannot ${action} providers.`,
  )
}
