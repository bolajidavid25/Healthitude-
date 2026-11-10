import { useState, useRef, useEffect } from "react"
import {
  Stethoscope,
  RotateCcw,
  Heart,
  Baby,
  Pill,
  Microscope,
  FileEdit,
  MapPin,
  Globe,
  Video,
  Building2,
  Clock,
  Search,
  Check,
  CheckCircle2,
  Calendar,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  MoreHorizontal,
  Activity,
  AlertTriangle,
  FileText,
  UploadCloud,
  ChevronRight,
} from "lucide-react"

const BLUE = "#1a3fcf"
const NAVY = "#0d1b4b"
const SKY = "#0ea5e9"

// ─── Data ─────────────────────────────────────────────────────────────────────

const DOCTORS = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    specialty: "General Practitioner",
    qualifications: [
      "MBChB (University of Ghana)",
      "FWACP (Family Medicine)",
      "Fellow, Ghana Medical Association",
    ],
    experience: 8,
    rating: 4.9,
    reviews: 312,
    consultations: 1420,
    location: "Accra, Ghana",
    languages: ["English", "Twi"],
    fee: "₦15,000",
    nextAvailable: "Today, 2:30 PM",
    video: true,
    inPerson: true,
    avatar: "SJ",
    avatarColor: "#7c3aed",
    bio: "Dr. Sarah Johnson is a board-certified General Practitioner with over 8 years of clinical experience. She specialises in preventive care, chronic disease management, and family health. She is known for her patient-centered approach and clear communication.",
    tags: [
      "General Practice",
      "Preventive Care",
      "Chronic Disease",
      "Family Health",
    ],
    slots: {
      Today: ["09:00 AM", "09:30 AM", "10:00 AM", "2:30 PM", "3:00 PM"],
      Tomorrow: ["09:00 AM", "09:30 AM", "11:00 AM", "1:00 PM"],
      "Wed 17": ["10:00 AM", "10:30 AM", "2:00 PM", "3:30 PM"],
    },
  },
  {
    id: 2,
    name: "Dr. Michael Ade",
    specialty: "Cardiologist",
    qualifications: [
      "MD (University of Lagos)",
      "FACC (Cardiology)",
      "Fellow, Nigerian Cardiac Society",
    ],
    experience: 12,
    rating: 4.8,
    reviews: 218,
    consultations: 980,
    location: "Lagos, Nigeria",
    languages: ["English", "Yoruba"],
    fee: "₦25,000",
    nextAvailable: "Tomorrow, 10:00 AM",
    video: true,
    inPerson: false,
    avatar: "MA",
    avatarColor: "#0369a1",
    bio: "Dr. Michael Ade is a consultant cardiologist specialising in hypertension, heart failure, and preventive cardiology. He brings 12 years of tertiary hospital experience to digital healthcare.",
    tags: ["Cardiology", "Hypertension", "Heart Failure", "ECG Interpretation"],
    slots: {
      Today: [],
      Tomorrow: ["10:00 AM", "10:30 AM", "11:00 AM"],
      "Wed 17": ["09:00 AM", "09:30 AM", "10:00 AM"],
    },
  },
  {
    id: 3,
    name: "Dr. Afia Mensah",
    specialty: "Dermatologist",
    qualifications: [
      "MBChB (KNUST)",
      "MSc Dermatology (UCL)",
      "Member, Ghana Dermatology Society",
    ],
    experience: 6,
    rating: 4.7,
    reviews: 175,
    consultations: 640,
    location: "Kumasi, Ghana",
    languages: ["English", "Twi", "Fante"],
    fee: "₦18,000",
    nextAvailable: "Today, 4:00 PM",
    video: true,
    inPerson: true,
    avatar: "AM",
    avatarColor: "#be185d",
    bio: "Dr. Afia Mensah is a dermatologist focused on skin conditions, cosmetic dermatology, and skin cancer screening. She completed her postgraduate training at University College London.",
    tags: [
      "Dermatology",
      "Skin Conditions",
      "Cosmetic",
      "Skin Cancer Screening",
    ],
    slots: {
      Today: ["4:00 PM", "4:30 PM"],
      Tomorrow: ["09:00 AM", "10:00 AM", "11:30 AM"],
      "Wed 17": ["09:00 AM", "10:00 AM", "2:00 PM"],
    },
  },
  {
    id: 4,
    name: "Dr. Kwame Osei",
    specialty: "Neurologist",
    qualifications: [
      "MD (Legon)",
      "PhD Neuroscience (Edinburgh)",
      "Fellow, WFN",
    ],
    experience: 15,
    rating: 4.9,
    reviews: 289,
    consultations: 1100,
    location: "Accra, Ghana",
    languages: ["English", "Twi", "Ga"],
    fee: "₦30,000",
    nextAvailable: "Wed 17, 9:00 AM",
    video: true,
    inPerson: true,
    avatar: "KO",
    avatarColor: "#047857",
    bio: "Prof. Kwame Osei is a consultant neurologist with 15 years of experience in stroke, epilepsy, migraine, and neurodegenerative diseases. He is a research fellow of the World Federation of Neurology.",
    tags: ["Neurology", "Stroke", "Epilepsy", "Migraine", "Parkinson's"],
    slots: {
      Today: [],
      Tomorrow: [],
      "Wed 17": ["09:00 AM", "09:30 AM", "10:00 AM"],
    },
  },
]

const SPECIALTIES = [
  "All",
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Obstetrics",
  "Orthopedics",
  "Psychiatry",
  "ENT",
]
const CONSULT_TYPES = ["All", "Video", "In-Person", "Follow-up"]

const VISIT_REASONS: {
  id: string
  icon: React.ReactNode
  title: string
  desc: string
}[] = [
  {
    id: "general",
    icon: <Stethoscope className="w-5 h-5 text-blue-600" />,
    title: "General Consultation",
    desc: "For common health concerns and symptoms.",
  },
  {
    id: "followup",
    icon: <RotateCcw className="w-5 h-5 text-indigo-600" />,
    title: "Follow-up",
    desc: "Continue care from a previous consultation.",
  },
  {
    id: "maternal",
    icon: <Heart className="w-5 h-5 text-pink-600" />,
    title: "Maternal Care",
    desc: "Pregnancy, postpartum, and maternal health support.",
  },
  {
    id: "child",
    icon: <Baby className="w-5 h-5 text-amber-600" />,
    title: "Child Health",
    desc: "Health concerns involving children.",
  },
  {
    id: "meds",
    icon: <Pill className="w-5 h-5 text-emerald-600" />,
    title: "Medication Review",
    desc: "Discuss current medications and treatment.",
  },
  {
    id: "specialist",
    icon: <Microscope className="w-5 h-5 text-purple-600" />,
    title: "Specialist Consultation",
    desc: "Consult a doctor for a specific specialty.",
  },
  {
    id: "other",
    icon: <FileEdit className="w-5 h-5 text-gray-600" />,
    title: "Other",
    desc: "Describe another reason for your visit.",
  },
]

const ADDITIONAL_SYMPTOMS = [
  "Fever",
  "Nausea",
  "Vomiting",
  "Dizziness",
  "Fatigue",
  "Chest pain",
  "Shortness of breath",
  "Joint pain",
  "Back pain",
  "Rash",
  "Swelling",
  "Loss of appetite",
]
const CONDITIONS = [
  "None",
  "Asthma",
  "Diabetes",
  "Hypertension",
  "Heart disease",
  "Kidney disease",
  "Arthritis",
  "HIV/AIDS",
  "Cancer",
  "Other",
]

const CALENDAR_DAYS = [
  { label: "MON", num: "15", key: "Today" },
  { label: "TUE", num: "16", key: "Tomorrow" },
  { label: "WED", num: "17", key: "Wed 17" },
  { label: "THU", num: "18", key: "Thu 18" },
  { label: "FRI", num: "19", key: "Fri 19" },
]

const MORNING_SLOTS = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
]
const AFTERNOON_SLOTS = [
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
]
const UNAVAILABLE = ["10:30 AM", "11:00 AM", "01:30 PM", "03:00 PM"]

const SAMPLE_RECORDS = [
  {
    date: "September 16, 2026",
    type: "General Consultation",
    doctor: "Dr. Sarah Johnson",
    specialty: "General Practitioner",
    diagnosis: "Tension Headache, Mild Dehydration",
    prescription: "Paracetamol 500mg, ORS sachets",
    notes:
      "Patient presented with headache and fatigue. Vital signs stable. Advised rest, increased fluid intake.",
    status: "completed",
  },
  {
    date: "August 02, 2026",
    type: "Follow-up Consultation",
    doctor: "Dr. Michael Ade",
    specialty: "Cardiologist",
    diagnosis: "Controlled Hypertension",
    prescription: "Amlodipine 5mg (continued)",
    notes:
      "Blood pressure within target range. Continue current medication. Lifestyle modifications ongoing.",
    status: "completed",
  },
  {
    date: "June 14, 2026",
    type: "Specialist Consultation",
    doctor: "Dr. Afia Mensah",
    specialty: "Dermatologist",
    diagnosis: "Contact Dermatitis",
    prescription: "Hydrocortisone cream 1%, Cetirizine 10mg",
    notes:
      "Allergic reaction to new soap product. Prescribed topical steroid and antihistamine. Follow up in 2 weeks.",
    status: "completed",
  },
]

// ─── Small components ──────────────────────────────────────────────────────────

function VerifiedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "#dcfce7", color: "#15803d" }}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
      Verified Doctor
    </span>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-3.5 h-3.5 ${
              i < Math.floor(rating)
                ? "text-amber-400 fill-amber-400"
                : "text-gray-200 fill-gray-200"
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
      <span className="text-sm font-semibold text-gray-700">{rating}</span>
    </span>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 group cursor-pointer"
    >
      <svg
        className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      Back
    </button>
  )
}

function SectionCard({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
      {title && <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>}
      {children}
    </div>
  )
}

function AvatarCircle({
  initials,
  color,
  size = 56,
}: {
  initials: string
  color: string
  size?: number
}) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.3,
      }}
    >
      {initials}
    </div>
  )
}

function PrimaryBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn-glow px-5 py-2.5 text-white font-semibold"
    >
      {children}
    </button>
  )
}

function OutlineBtn({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="btn-underline px-5 py-2.5"
    >
      {children}
    </button>
  )
}

function IntakeProgress({ step }: { step: number }) {
  const steps = [
    "Symptoms",
    "Medical History",
    "Medications",
    "Documents",
    "Review",
  ]
  return (
    <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
              style={{
                background: i <= step ? BLUE : "#e5e7eb",
                color: i <= step ? "white" : "#9ca3af",
              }}
            >
              {i < step ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className="text-xs font-medium whitespace-nowrap"
              style={{
                color: i === step ? BLUE : i < step ? "#6b7280" : "#9ca3af",
              }}
            >
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="w-6 h-0.5 flex-shrink-0 mx-1"
              style={{ background: i < step ? BLUE : "#e5e7eb" }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Screen 01 — Find a Provider ──────────────────────────────────────────────

function FindProvider({
  onSelect,
}: {
  onSelect: (d: typeof DOCTORS[0]) => void
}) {
  const [search, setSearch] = useState("")
  const [specialty, setSpecialty] = useState("All")
  const [consultType, setConsultType] = useState("All")

  const filtered = DOCTORS.filter((d) => {
    const matchSearch =
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase())
    const matchSpec =
      specialty === "All" ||
      d.specialty.toLowerCase().includes(specialty.toLowerCase())
    const matchType =
      consultType === "All" ||
      (consultType === "Video" && d.video) ||
      (consultType === "In-Person" && d.inPerson)
    return matchSearch && matchSpec && matchType
  })

  return (
    <div>
      <div className="mb-6">
        <h2
          className="font-display text-2xl font-bold mb-1"
          style={{ color: NAVY }}
        >
          Find a Doctor
        </h2>
        <p className="text-sm text-gray-500">
          Search and book a consultation with a verified healthcare
          professional.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search doctors, specialties..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ ["--tw-ring-color" as string]: BLUE + "40" }}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2"
            style={{ ["--tw-ring-color" as string]: BLUE + "40" }}
          >
            {SPECIALTIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={consultType}
            onChange={(e) => setConsultType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2"
          >
            {CONSULT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        {["Available today", "Highly rated", "Under ₦20,000"].map((f) => (
          <button
            key={f}
            className="border border-gray-200 rounded-none px-3 py-2 text-xs text-gray-600 bg-white hover:border-blue-400 hover:text-blue-700 transition-colors"
          >
            {f}
          </button>
        ))}
      </div>

      {/* Results */}
      <p className="text-xs text-gray-400 mb-4">
        {filtered.length} doctor{filtered.length !== 1 ? "s" : ""} found
      </p>

      <div className="space-y-4">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all shadow-xs"
          >
            <div className="flex gap-4">
              <AvatarCircle
                initials={doc.avatar}
                color={doc.avatarColor}
                size={60}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-base">
                        {doc.name}
                      </h3>
                      <VerifiedBadge />
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {doc.specialty} · {doc.experience} yrs experience
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">{doc.fee}</p>
                    <p className="text-xs text-gray-400">per consultation</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <Stars rating={doc.rating} />
                  <span className="text-xs text-gray-400">
                    {doc.reviews} reviews · {doc.consultations.toLocaleString()}{" "}
                    consultations
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />{" "}
                    {doc.location}
                  </span>
                  {doc.video && (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <Video className="w-3.5 h-3.5" /> Video
                    </span>
                  )}
                  {doc.inPerson && (
                    <span className="text-blue-600 font-medium flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> In-person
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1"
                    style={{ background: "#f0fdf4", color: "#15803d" }}
                  >
                    <Clock className="w-3 h-3 text-green-700" />
                    <span>Next: {doc.nextAvailable}</span>
                  </span>
                  <div className="flex gap-2">
                    <OutlineBtn onClick={() => onSelect(doc)}>
                      View Profile
                    </OutlineBtn>
                    <PrimaryBtn onClick={() => onSelect(doc)}>
                      Book Consultation
                    </PrimaryBtn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-600">
              No doctors match your search
            </p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Screen 02 — Doctor Profile ────────────────────────────────────────────────

function DoctorProfile({
  doctor,
  onBook,
  onBack,
}: {
  doctor: typeof DOCTORS[0]
  onBook: () => void
  onBack: () => void
}) {
  const [selectedDay, setSelectedDay] = useState("Today")
  const [selectedTime, setSelectedTime] = useState("")

  const slots = (doctor.slots as Record<string, string[]>)[selectedDay] ?? []

  return (
    <div>
      <BackBtn onClick={onBack} />

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4 shadow-sm">
        <div className="flex gap-5 flex-wrap">
          <AvatarCircle
            initials={doctor.avatar}
            color={doctor.avatarColor}
            size={80}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2
                className="font-display text-xl font-bold"
                style={{ color: NAVY }}
              >
                {doctor.name}
              </h2>
              <VerifiedBadge />
            </div>
            <p className="text-gray-500 text-sm mb-2">
              {doctor.specialty} · {doctor.experience} years experience
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Stars rating={doctor.rating} />{" "}
                <span className="text-gray-400">
                  ({doctor.reviews} reviews)
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />{" "}
                {doctor.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-gray-400" />{" "}
                {doctor.languages.join(", ")}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-sm font-bold" style={{ color: BLUE }}>
                {doctor.fee} / consultation
              </span>
              {doctor.video && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1"
                  style={{ background: "#e0f2fe", color: "#0369a1" }}
                >
                  <Video className="w-3 h-3" /> Video
                </span>
              )}
              {doctor.inPerson && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1"
                  style={{ background: "#ede9fe", color: "#7c3aed" }}
                >
                  <Building2 className="w-3 h-3" /> In-Person
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <SectionCard title="About">
            <p className="text-sm text-gray-600 leading-relaxed">
              {doctor.bio}
            </p>
          </SectionCard>

          <SectionCard title="Qualifications">
            <ul className="space-y-2">
              {doctor.qualifications.map((q) => (
                <li
                  key={q}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {q}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Specialties">
            <div className="flex flex-wrap gap-2">
              {doctor.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-600 bg-gray-50"
                >
                  {t}
                </span>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Consultation Types">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  icon: (
                    <Video className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  ),
                  title: "Video",
                  desc: "Consult from home",
                  enabled: doctor.video,
                },
                {
                  icon: (
                    <Building2 className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
                  ),
                  title: "In-Person",
                  desc: "Visit the clinic",
                  enabled: doctor.inPerson,
                },
                {
                  icon: (
                    <RotateCcw className="w-6 h-6 text-sky-600 mx-auto mb-1" />
                  ),
                  title: "Follow-up",
                  desc: "Existing patients",
                  enabled: true,
                },
              ].map((t) => (
                <div
                  key={t.title}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    t.enabled
                      ? "border-blue-200 bg-blue-50/50 cursor-pointer hover:bg-blue-50"
                      : "border-gray-100 bg-gray-50 opacity-50"
                  }`}
                >
                  <div className="mb-1">{t.icon}</div>
                  <p className="font-semibold text-sm text-gray-800">
                    {t.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                  {!t.enabled && (
                    <p className="text-xs text-gray-400 mt-1">Unavailable</p>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Availability */}
        <div>
          <SectionCard title="Availability">
            <div className="flex gap-1.5 mb-4">
              {CALENDAR_DAYS.slice(0, 3).map((d) => (
                <button
                  key={d.key}
                  onClick={() => {
                    setSelectedDay(d.key)
                    setSelectedTime("")
                  }}
                  className="flex-1 py-2 rounded-xl text-center border transition-all text-xs"
                  style={
                    selectedDay === d.key
                      ? { background: BLUE, color: "white", borderColor: BLUE }
                      : { borderColor: "#e5e7eb", color: "#6b7280" }
                  }
                >
                  <div className="font-medium">{d.label}</div>
                  <div className="font-bold">{d.num}</div>
                </button>
              ))}
            </div>

            {slots.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {slots.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className="py-2 rounded-lg text-xs font-medium border transition-all"
                    style={
                      selectedTime === t
                        ? {
                            background: BLUE,
                            color: "white",
                            borderColor: BLUE,
                          }
                        : { borderColor: "#e5e7eb", color: "#374151" }
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No slots available
              </p>
            )}

            <PrimaryBtn onClick={onBook}>
              {selectedTime ? `Book ${selectedTime}` : "Book Consultation"}
            </PrimaryBtn>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

// ─── Screen 03 — Reason for Visit ─────────────────────────────────────────────

function ReasonForVisit({
  onSelect,
  onBack,
}: {
  onSelect: (r: string) => void
  onBack: () => void
}) {
  const [selected, setSelected] = useState("")

  return (
    <div className="max-w-2xl mx-auto">
      <BackBtn onClick={onBack} />
      <h2
        className="font-display text-2xl font-bold mb-2"
        style={{ color: NAVY }}
      >
        What brings you to Healthitude?
      </h2>
      <p className="text-sm text-gray-500 mb-8">
        Choose the reason for your visit so we can prepare your consultation.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {VISIT_REASONS.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelected(r.id)}
            className="p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm"
            style={
              selected === r.id
                ? { borderColor: BLUE, background: BLUE + "08" }
                : { borderColor: "#e5e7eb", background: "white" }
            }
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{r.icon}</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{r.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
              </div>
              {selected === r.id && (
                <div
                  className="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: BLUE }}
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <OutlineBtn onClick={onBack}>Back</OutlineBtn>
        <PrimaryBtn
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
        >
          Continue
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ─── Screen 04 — Medical Intake ────────────────────────────────────────────────

function MedicalIntake({
  onComplete,
  onBack,
}: {
  onComplete: (data: Record<string, unknown>) => void
  onBack: () => void
}) {
  const [subStep, setSubStep] = useState(0)
  const [symptoms, setSymptoms] = useState("")
  const [onset, setOnset] = useState("")
  const [severity, setSeverity] = useState("")
  const [additionalSymptoms, setAdditionalSymptoms] = useState<string[]>([])
  const [conditions, setConditions] = useState<string[]>([])
  const [prevCondition, setPrevCondition] = useState("")
  const [prevSurgery, setPrevSurgery] = useState("")
  const [allergies, setAllergies] = useState("")
  const [additionalHistory, setAdditionalHistory] = useState("")
  const [medications, setMedications] = useState([
    {
      name: "Paracetamol",
      dosage: "500 mg",
      frequency: "2× daily",
      duration: "3 days",
    },
  ])
  const [noMeds, setNoMeds] = useState(false)
  const [files, setFiles] = useState([
    { name: "Blood_Test.pdf", size: "1.2 MB", type: "pdf" },
  ])
  const fileRef = useRef<HTMLInputElement>(null)

  const toggleAdditionalSymptom = (s: string) => {
    setAdditionalSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    )
  }

  const toggleCondition = (c: string) => {
    setConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    )
  }

  const addMedication = () => {
    setMedications((m) => [
      ...m,
      { name: "", dosage: "", frequency: "", duration: "" },
    ])
  }

  const ONSET_OPTIONS = [
    "Today",
    "2–3 days ago",
    "Within the last week",
    "1–4 weeks ago",
    "More than a month ago",
  ]
  const SEVERITY_OPTIONS = [
    { key: "mild", label: "Mild", desc: "Manageable", color: "#22c55e" },
    {
      key: "moderate",
      label: "Moderate",
      desc: "Affecting daily life",
      color: "#f59e0b",
    },
    {
      key: "severe",
      label: "Severe",
      desc: "Significantly limiting",
      color: "#ef4444",
    },
  ]

  const next = () => setSubStep((s) => Math.min(s + 1, 4))
  const prev = () => {
    if (subStep === 0) onBack()
    else setSubStep((s) => s - 1)
  }

  const data = {
    symptoms,
    onset,
    severity,
    additionalSymptoms,
    conditions,
    prevCondition,
    prevSurgery,
    allergies,
    additionalHistory,
    medications,
    noMeds,
    files,
  }

  return (
    <div className="max-w-2xl mx-auto">
      <BackBtn onClick={prev} />
      <h2
        className="font-display text-2xl font-bold mb-1"
        style={{ color: NAVY }}
      >
        Tell us about your health concern
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Your doctor will review this information before your consultation.
      </p>
      <IntakeProgress step={subStep} />

      {/* Step 0 — Symptoms */}
      {subStep === 0 && (
        <div className="space-y-6">
          <SectionCard title="Main symptoms">
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={4}
              placeholder="What symptoms are you experiencing?"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none"
              style={{ ["--tw-ring-color" as string]: BLUE + "40" }}
            />
          </SectionCard>

          <SectionCard title="When did they start?">
            <div className="flex flex-wrap gap-2">
              {ONSET_OPTIONS.map((o) => (
                <button
                  key={o}
                  onClick={() => setOnset(o)}
                  className="px-4 py-2 rounded-xl border text-sm transition-all"
                  style={
                    onset === o
                      ? { background: BLUE, color: "white", borderColor: BLUE }
                      : { borderColor: "#e5e7eb", color: "#374151" }
                  }
                >
                  {o}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Severity">
            <div className="grid grid-cols-3 gap-3">
              {SEVERITY_OPTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSeverity(s.key)}
                  className="py-4 rounded-xl border-2 text-center transition-all"
                  style={
                    severity === s.key
                      ? { borderColor: s.color, background: s.color + "14" }
                      : { borderColor: "#e5e7eb" }
                  }
                >
                  <div
                    className="w-3 h-3 rounded-full mx-auto mb-2 transition-all"
                    style={{
                      background: severity === s.key ? s.color : "#e5e7eb",
                    }}
                  />
                  <p className="font-semibold text-sm text-gray-800">
                    {s.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Additional symptoms">
            <div className="flex flex-wrap gap-2">
              {ADDITIONAL_SYMPTOMS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleAdditionalSymptom(s)}
                  className="px-3 py-1.5 rounded-full text-xs border transition-all"
                  style={
                    additionalSymptoms.includes(s)
                      ? { background: BLUE, color: "white", borderColor: BLUE }
                      : { borderColor: "#e5e7eb", color: "#374151" }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Step 1 — Medical History */}
      {subStep === 1 && (
        <div className="space-y-5">
          <SectionCard title="Existing medical conditions">
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleCondition(c)}
                  className="px-3 py-1.5 rounded-full text-xs border transition-all"
                  style={
                    conditions.includes(c)
                      ? { background: BLUE, color: "white", borderColor: BLUE }
                      : { borderColor: "#e5e7eb", color: "#374151" }
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Previous similar condition">
            <div className="flex gap-3">
              {["Yes", "No"].map((v) => (
                <button
                  key={v}
                  onClick={() => setPrevCondition(v)}
                  className="px-6 py-2.5 rounded-xl border text-sm font-medium transition-all"
                  style={
                    prevCondition === v
                      ? { background: BLUE, color: "white", borderColor: BLUE }
                      : { borderColor: "#e5e7eb", color: "#374151" }
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Previous surgeries or hospitalisation">
            <div className="flex gap-3">
              {["Yes", "No"].map((v) => (
                <button
                  key={v}
                  onClick={() => setPrevSurgery(v)}
                  className="px-6 py-2.5 rounded-xl border text-sm font-medium transition-all"
                  style={
                    prevSurgery === v
                      ? { background: BLUE, color: "white", borderColor: BLUE }
                      : { borderColor: "#e5e7eb", color: "#374151" }
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Known allergies">
            <textarea
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              rows={3}
              placeholder="e.g. Penicillin, peanuts, latex..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
            />
          </SectionCard>

          <SectionCard title="Additional medical information">
            <textarea
              value={additionalHistory}
              onChange={(e) => setAdditionalHistory(e.target.value)}
              rows={4}
              placeholder="Any other medical information your doctor should know..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
            />
          </SectionCard>
        </div>
      )}

      {/* Step 2 — Medications */}
      {subStep === 2 && (
        <div className="space-y-4">
          <SectionCard title="Current medications">
            {!noMeds &&
              medications.map((med, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-3 mb-4 p-4 bg-gray-50 rounded-xl"
                >
                  <input
                    defaultValue={med.name}
                    placeholder="Medication name"
                    className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                  <input
                    defaultValue={med.dosage}
                    placeholder="Dosage (e.g. 500 mg)"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                  <input
                    defaultValue={med.frequency}
                    placeholder="Frequency (e.g. 2× daily)"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                  <input
                    defaultValue={med.duration}
                    placeholder="Duration (e.g. 7 days)"
                    className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              ))}
            {!noMeds && (
              <button
                onClick={addMedication}
                className="flex items-center gap-2 text-sm font-medium mt-2 transition-colors"
                style={{ color: BLUE }}
              >
                <span
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-lg leading-none"
                  style={{ borderColor: BLUE }}
                >
                  +
                </span>
                Add medication
              </button>
            )}
            <label className="flex items-center gap-2 cursor-pointer mt-4 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={noMeds}
                onChange={(e) => setNoMeds(e.target.checked)}
                className="rounded accent-blue-600"
              />
              I am not currently taking any medication
            </label>
          </SectionCard>
        </div>
      )}

      {/* Step 3 — Documents */}
      {subStep === 3 && (
        <div className="space-y-4">
          <SectionCard title="Upload relevant documents">
            <p className="text-xs text-gray-500 mb-4">
              Upload medical reports, test results, prescriptions, scans, or
              other documents that may help your doctor.
            </p>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all"
            >
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    const newFiles = Array.from(e.target.files).map((f) => ({
                      name: f.name,
                      size: (f.size / 1024 / 1024).toFixed(1) + " MB",
                      type: f.name.split(".").pop() ?? "file",
                    }))
                    setFiles((prev) => [...prev, ...newFiles])
                  }
                }}
              />
              <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="font-medium text-gray-700 text-sm">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, JPG, PNG, DOCX up to 20 MB each
              </p>
            </div>
            <div className="flex gap-2 flex-wrap mt-3 text-xs text-gray-400">
              {["PDF", "JPG", "PNG", "DOCX"].map((f) => (
                <span
                  key={f}
                  className="px-2 py-1 rounded border border-gray-200 bg-gray-50"
                >
                  {f}
                </span>
              ))}
            </div>
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white uppercase"
                      style={{
                        background:
                          f.type === "pdf"
                            ? "#ef4444"
                            : f.type === "jpg" || f.type === "png"
                              ? "#f59e0b"
                              : "#6366f1",
                      }}
                    >
                      {f.type}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {f.name}
                      </p>
                      <p className="text-xs text-gray-400">{f.size}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs text-blue-600 hover:underline">
                        Preview
                      </button>
                      <button
                        onClick={() =>
                          setFiles((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* Step 4 — Review intake */}
      {subStep === 4 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">
            Review your information
          </h3>
          {[
            {
              title: "Symptoms",
              body: symptoms || "—",
              sub: onset ? `Started: ${onset}` : undefined,
              badge: severity
                ? severity.charAt(0).toUpperCase() + severity.slice(1)
                : undefined,
            },
            {
              title: "Additional symptoms",
              body: additionalSymptoms.length
                ? additionalSymptoms.join(", ")
                : "None reported",
            },
            {
              title: "Medical conditions",
              body: conditions.length ? conditions.join(", ") : "None reported",
            },
            {
              title: "Medications",
              body: noMeds
                ? "Not currently taking medication"
                : medications
                    .map((m) => `${m.name} — ${m.dosage} — ${m.frequency}`)
                    .join("; "),
            },
            {
              title: "Documents",
              body: files.length
                ? `${files.length} document${
                    files.length > 1 ? "s" : ""
                  } attached`
                : "None",
            },
          ].map((row) => (
            <div
              key={row.title}
              className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  {row.title}
                </p>
                <p className="text-sm text-gray-700">{row.body}</p>
                {row.sub && (
                  <p className="text-xs text-gray-400 mt-0.5">{row.sub}</p>
                )}
                {row.badge && (
                  <span
                    className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "#fef3c7", color: "#b45309" }}
                  >
                    {row.badge}
                  </span>
                )}
              </div>
              <button
                className="text-xs text-blue-600 hover:underline flex-shrink-0"
                onClick={() => setSubStep(0)}
              >
                Edit
              </button>
            </div>
          ))}
          <p className="text-xs text-gray-400 border border-gray-100 rounded-xl p-4 bg-gray-50">
            Your information will be shared with your selected healthcare
            provider for the purpose of your consultation.
          </p>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
            <input type="checkbox" className="rounded accent-blue-600" />I
            confirm that the information provided is accurate.
          </label>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <OutlineBtn onClick={prev}>
          {subStep === 0 ? "Back" : "Back"}
        </OutlineBtn>
        <PrimaryBtn onClick={subStep < 4 ? next : () => onComplete(data)}>
          {subStep < 4 ? "Continue" : "Continue to Appointment"}
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ─── Screen 05 — Select Date & Time ───────────────────────────────────────────

function SelectDateTime({
  doctor,
  onConfirm,
  onBack,
}: {
  doctor: typeof DOCTORS[0]
  onConfirm: (date: string, time: string) => void
  onBack: () => void
}) {
  const [selectedDay, setSelectedDay] = useState(CALENDAR_DAYS[0])
  const [selectedTime, setSelectedTime] = useState("")

  return (
    <div className="max-w-lg mx-auto">
      <BackBtn onClick={onBack} />
      <h2
        className="font-display text-2xl font-bold mb-1"
        style={{ color: NAVY }}
      >
        Choose your appointment
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Select a date and time that works for you.
      </p>

      {/* Doctor summary */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 mb-6 shadow-xs">
        <AvatarCircle
          initials={doctor.avatar}
          color={doctor.avatarColor}
          size={48}
        />
        <div>
          <p className="font-semibold text-gray-800">{doctor.name}</p>
          <p className="text-sm text-gray-500">{doctor.specialty}</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-sky-100 text-sky-800">
          <Video className="w-3.5 h-3.5 text-sky-600" /> Video
        </span>
      </div>

      {/* Date selector */}
      <SectionCard>
        <h3 className="font-semibold text-gray-700 mb-3 text-sm">
          Select date
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
          {CALENDAR_DAYS.map((d) => (
            <button
              key={d.key}
              onClick={() => {
                setSelectedDay(d)
                setSelectedTime("")
              }}
              className="flex-shrink-0 w-16 py-3 rounded-xl border-2 text-center transition-all"
              style={
                selectedDay.key === d.key
                  ? { background: BLUE, borderColor: BLUE, color: "white" }
                  : { borderColor: "#e5e7eb", color: "#6b7280" }
              }
            >
              <div className="text-xs font-medium">{d.label}</div>
              <div className="text-lg font-bold mt-0.5">{d.num}</div>
            </button>
          ))}
        </div>

        {/* Time slots */}
        <h3 className="font-semibold text-gray-700 mb-3 text-sm">Morning</h3>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {MORNING_SLOTS.map((t) => {
            const unavail = UNAVAILABLE.includes(t)
            return (
              <button
                key={t}
                disabled={unavail}
                onClick={() => setSelectedTime(t)}
                className="py-2.5 rounded-xl border text-xs font-medium transition-all"
                style={
                  unavail
                    ? {
                        borderColor: "#f3f4f6",
                        color: "#d1d5db",
                        background: "#f9fafb",
                        cursor: "not-allowed",
                      }
                    : selectedTime === t
                      ? { background: BLUE, color: "white", borderColor: BLUE }
                      : { borderColor: "#e5e7eb", color: "#374151" }
                }
              >
                {unavail ? <span className="line-through">{t}</span> : t}
              </button>
            )
          })}
        </div>

        <h3 className="font-semibold text-gray-700 mb-3 text-sm">Afternoon</h3>
        <div className="grid grid-cols-3 gap-2">
          {AFTERNOON_SLOTS.map((t) => {
            const unavail = UNAVAILABLE.includes(t)
            return (
              <button
                key={t}
                disabled={unavail}
                onClick={() => setSelectedTime(t)}
                className="py-2.5 rounded-xl border text-xs font-medium transition-all"
                style={
                  unavail
                    ? {
                        borderColor: "#f3f4f6",
                        color: "#d1d5db",
                        background: "#f9fafb",
                        cursor: "not-allowed",
                      }
                    : selectedTime === t
                      ? { background: BLUE, color: "white", borderColor: BLUE }
                      : { borderColor: "#e5e7eb", color: "#374151" }
                }
              >
                {unavail ? <span className="line-through">{t}</span> : t}
              </button>
            )
          })}
        </div>
      </SectionCard>

      <div className="flex justify-between mt-6">
        <OutlineBtn onClick={onBack}>Back</OutlineBtn>
        <PrimaryBtn
          onClick={() =>
            selectedTime && onConfirm(selectedDay.key, selectedTime)
          }
          disabled={!selectedTime}
        >
          Continue
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ─── Screen 06 — Appointment Review ───────────────────────────────────────────

function AppointmentReview({
  doctor,
  date,
  time,
  reason,
  onConfirm,
  onBack,
}: {
  doctor: typeof DOCTORS[0]
  date: string
  time: string
  reason: string
  onConfirm: () => void
  onBack: () => void
}) {
  const reasonLabel =
    VISIT_REASONS.find((r) => r.id === reason)?.title ?? reason
  const rows = [
    { label: "Doctor", value: doctor.name },
    { label: "Specialty", value: doctor.specialty },
    {
      label: "Date",
      value: `${
        date === "Today"
          ? "Monday, September 15"
          : date === "Tomorrow"
            ? "Tuesday, September 16"
            : date
      }, 2026`,
    },
    {
      label: "Time",
      value: `${time} – ${time.replace(/(\d+):(\d+)/, (_, h, m) => {
        const hr =
          (parseInt(h) + (time.includes("PM") && parseInt(h) < 12 ? 12 : 0)) %
          24
        const mr = (parseInt(m) + 30) % 60
        const nextHr = parseInt(h) + (parseInt(m) + 30 >= 60 ? 1 : 0)
        return `${nextHr}:${mr.toString().padStart(2, "0")}`
      })} ${time.includes("PM") ? "PM" : "AM"}`,
    },
    { label: "Type", value: "Video Consultation" },
    { label: "Reason", value: reasonLabel },
    { label: "Consultation fee", value: doctor.fee, highlight: true },
  ]

  return (
    <div className="max-w-md mx-auto">
      <BackBtn onClick={onBack} />
      <h2
        className="font-display text-2xl font-bold mb-6"
        style={{ color: NAVY }}
      >
        Review your appointment
      </h2>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6 shadow-sm">
        <div className="p-5 flex items-center gap-4 border-b border-gray-100">
          <AvatarCircle
            initials={doctor.avatar}
            color={doctor.avatarColor}
            size={52}
          />
          <div>
            <p className="font-bold text-gray-900">{doctor.name}</p>
            <VerifiedBadge />
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between px-5 py-3.5"
            >
              <span className="text-sm text-gray-500">{r.label}</span>
              <span
                className={`text-sm font-semibold ${
                  r.highlight ? "" : "text-gray-800"
                }`}
                style={r.highlight ? { color: BLUE } : {}}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-6 text-center">
        Payment will be processed after confirming your appointment. No charges
        apply before confirmation.
      </p>

      <div className="flex gap-3">
        <OutlineBtn onClick={onBack}>Back</OutlineBtn>
        <div className="flex-1">
          <PrimaryBtn onClick={onConfirm}>Confirm Appointment</PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

// ─── Screen 07 — Appointment Confirmed ────────────────────────────────────────

function AppointmentConfirmed({
  doctor,
  date,
  time,
  onDone,
}: {
  doctor: typeof DOCTORS[0]
  date: string
  time: string
  onDone: () => void
}) {
  return (
    <div className="max-w-md mx-auto text-center py-8">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: "#dcfce7" }}
      >
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="#16a34a"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2
        className="font-display text-2xl font-bold mb-2"
        style={{ color: NAVY }}
      >
        Your appointment is confirmed
      </h2>
      <p className="text-gray-500 text-sm mb-8">
        A confirmation has been sent to your registered email.
      </p>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 text-left shadow-sm">
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
          <AvatarCircle
            initials={doctor.avatar}
            color={doctor.avatarColor}
            size={52}
          />
          <div>
            <p className="font-bold text-gray-900">{doctor.name}</p>
            <p className="text-sm text-gray-500">{doctor.specialty}</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />{" "}
            {date === "Today"
              ? "Monday, September 15"
              : "Tuesday, September 16"}
            , 2026
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" /> {time}
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Video className="w-4 h-4 text-gray-400" /> Video Consultation
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-6">
        Your doctor can review your pre-consultation information before the
        appointment.
      </p>

      <div className="flex flex-col gap-3">
        <PrimaryBtn onClick={onDone}>View Appointment</PrimaryBtn>
        <OutlineBtn onClick={onDone}>Return to Dashboard</OutlineBtn>
        <button className="text-sm text-blue-600 hover:underline">
          Add to Calendar
        </button>
      </div>
    </div>
  )
}

// ─── Screen 08 — Upcoming Appointment ─────────────────────────────────────────

function UpcomingAppointment({
  doctor,
  date,
  time,
  onJoin,
  onVideo,
}: {
  doctor: typeof DOCTORS[0]
  date: string
  time: string
  onJoin: () => void
  onVideo: () => void
}) {
  return (
    <div className="max-w-lg mx-auto">
      <h2
        className="font-display text-2xl font-bold mb-6"
        style={{ color: NAVY }}
      >
        Upcoming Consultation
      </h2>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4 shadow-sm">
        {/* Status bar */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${BLUE}, ${SKY})` }}
        >
          <span className="text-white text-xs font-semibold uppercase tracking-wider">
            Confirmed
          </span>
          <span className="text-white/80 text-xs">Today · {time}</span>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <AvatarCircle
              initials={doctor.avatar}
              color={doctor.avatarColor}
              size={56}
            />
            <div>
              <p className="font-bold text-gray-900">{doctor.name}</p>
              <p className="text-sm text-gray-500">{doctor.specialty}</p>
              <VerifiedBadge />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              {
                icon: <Calendar className="w-5 h-5 text-blue-600 mx-auto" />,
                label: "Date",
                value: date === "Today" ? "Sep 15, 2026" : "Sep 16, 2026",
              },
              {
                icon: <Clock className="w-5 h-5 text-indigo-600 mx-auto" />,
                label: "Time",
                value: time,
              },
              {
                icon: <Video className="w-5 h-5 text-emerald-600 mx-auto" />,
                label: "Type",
                value: "Video",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="p-3 rounded-xl bg-gray-50 text-center"
              >
                <div className="mb-1">{item.icon}</div>
                <p className="text-xs text-gray-400 mt-1">{item.label}</p>
                <p className="text-sm font-semibold text-gray-700 mt-0.5">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <OutlineBtn onClick={onJoin}>View Details</OutlineBtn>
            <button
              onClick={onVideo}
              className="flex-1 py-2.5 rounded-none text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #16a34a, #22c55e)",
                boxShadow: "0 4px 14px rgba(22,163,74,0.35)",
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Join Consultation
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        The Join button activates when your appointment is within 15 minutes.
      </p>
    </div>
  )
}

// ─── Screen 09 — Video Consultation ───────────────────────────────────────────

function VideoConsultation({
  doctor,
  onEnd,
}: {
  doctor: typeof DOCTORS[0]
  onEnd: () => void
}) {
  const [muted, setMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col"
      style={{ background: "#0a0f1e" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/70 text-sm font-medium">
            Healthitude · Secure Consultation
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-xs">Connected</span>
          <span className="font-mono text-green-400 text-sm font-semibold">
            {timeFormatted}
          </span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div
          className="flex-1 relative flex items-center justify-center"
          style={{ background: "#0d1526" }}
        >
          {/* Doctor video (main) */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <AvatarCircle
                initials={doctor.avatar}
                color={doctor.avatarColor}
                size={96}
              />
              <p className="text-white/60 text-sm mt-4">{doctor.name}</p>
              <p className="text-white/30 text-xs mt-1">Video connected</p>
            </div>
          </div>
          {/* Patient self-view PiP */}
          <div
            className="absolute top-4 right-4 w-32 h-24 rounded-xl border border-white/20 flex items-center justify-center overflow-hidden"
            style={{ background: camOff ? "#1e293b" : "#1a2744" }}
          >
            {camOff ? (
              <svg
                className="w-8 h-8 text-white/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            ) : (
              <div className="text-center">
                <AvatarCircle initials="ME" color="#374151" size={36} />
                <p className="text-white/40 text-xs mt-1">You</p>
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div
          className="hidden lg:flex w-80 flex-col border-l border-white/10 overflow-y-auto"
          style={{ background: "#111827" }}
        >
          <div className="p-4 border-b border-white/10">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-3">
              Patient Information
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                JD
              </div>
              <div>
                <p className="text-white text-sm font-medium">John Doe</p>
                <p className="text-white/50 text-xs">Patient · 34 yrs</p>
              </div>
            </div>
          </div>
          {[
            {
              title: "Symptoms",
              content:
                "Headache, fatigue, dizziness. Started 5 days ago. Severity: Moderate.",
            },
            {
              title: "Medical History",
              content:
                "No reported conditions. Previous headaches: Yes. No known allergies.",
            },
            {
              title: "Current Medications",
              content: "Paracetamol 500mg · 2× daily · 3 days",
            },
            { title: "Documents", content: "Blood_Test.pdf · 1.2 MB" },
          ].map((section) => (
            <div key={section.title} className="p-4 border-b border-white/10">
              <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
                {section.title}
              </p>
              <p className="text-white/80 text-xs leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div
        className="flex items-center justify-between px-6 py-4 border-t border-white/10"
        style={{ background: "#0a0f1e" }}
      >
        <div className="flex items-center gap-3">
          {[
            {
              icon: muted ? (
                <MicOff className="w-5 h-5 text-red-400" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              ),
              label: muted ? "Unmute" : "Mute",
              active: muted,
              onClick: () => setMuted((m) => !m),
            },
            {
              icon: camOff ? (
                <VideoOff className="w-5 h-5 text-red-400" />
              ) : (
                <Video className="w-5 h-5 text-white" />
              ),
              label: camOff ? "Start Camera" : "Stop Camera",
              active: camOff,
              onClick: () => setCamOff((c) => !c),
            },
            {
              icon: <Monitor className="w-5 h-5 text-white" />,
              label: "Share Screen",
              active: false,
              onClick: () => {},
            },
            {
              icon: <MoreHorizontal className="w-5 h-5 text-white" />,
              label: "More",
              active: false,
              onClick: () => {},
            },
          ].map((ctrl) => (
            <button
              key={ctrl.label}
              onClick={ctrl.onClick}
              className="flex flex-col items-center justify-center gap-1 w-16 py-2 rounded-none transition-all hover:bg-white/10 cursor-pointer"
              style={ctrl.active ? { background: "rgba(239,68,68,0.2)" } : {}}
            >
              <div className="flex items-center justify-center h-6">
                {ctrl.icon}
              </div>
              <span className="text-white/50 text-[10px]">{ctrl.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onEnd}
          className="px-6 py-3 rounded-none text-white text-sm font-bold transition-all hover:opacity-90 cursor-pointer shadow-md"
          style={{ background: "#dc2626" }}
        >
          End Consultation
        </button>
      </div>
    </div>
  )
}

// ─── Screen 10 — Consultation Summary ─────────────────────────────────────────

function ConsultationSummary({
  doctor,
  onClose,
}: {
  doctor: typeof DOCTORS[0]
  onClose: () => void
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl font-bold" style={{ color: NAVY }}>
          Consultation Summary
        </h2>
        <span
          className="text-xs px-3 py-1.5 rounded-full font-semibold inline-flex items-center gap-1.5"
          style={{ background: "#dcfce7", color: "#15803d" }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Consultation Concluded</span>
        </span>
      </div>

      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 mb-4 text-xs text-blue-900 space-y-1">
        <p className="font-semibold">
          Physician Clinical Review & Notes Policy
        </p>
        <p className="text-blue-800 leading-relaxed text-[11px]">
          Official consultation notes, clinical diagnoses, and prescriptions are
          documented by your physician and appear in your{" "}
          <strong>Medical Records</strong> once digitally signed. Your
          appointment remains active in your patient record.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 mb-4 shadow-sm">
        <AvatarCircle
          initials={doctor.avatar}
          color={doctor.avatarColor}
          size={52}
        />
        <div>
          <p className="font-bold text-gray-900">{doctor.name}</p>
          <p className="text-sm text-gray-500">{doctor.specialty}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm font-medium text-gray-700">
            September 16, 2026
          </p>
          <p className="text-xs text-gray-400">Video Consultation</p>
        </div>
      </div>

      <div className="space-y-4">
        <SectionCard title="Consultation Notes">
          <p className="text-sm text-gray-600 leading-relaxed">
            Patient presented with 5-day history of headache, fatigue, and
            dizziness. No fever or vomiting. Vital signs within normal limits.
            Likely tension-type headache with mild dehydration. Advised adequate
            rest, oral rehydration, and pain relief as needed. No neurological
            deficits noted.
          </p>
        </SectionCard>

        <SectionCard title="Diagnosis">
          <div className="space-y-2">
            {["Tension-type headache (G44.2)", "Mild dehydration (E86.0)"].map(
              (d) => (
                <div
                  key={d}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}
                >
                  <Activity className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-blue-800">{d}</span>
                </div>
              ),
            )}
          </div>
        </SectionCard>

        <SectionCard title="Prescription">
          <div className="space-y-3">
            {[
              {
                name: "Paracetamol",
                dosage: "500 mg",
                freq: "Every 6 hours as needed",
                duration: "5 days",
                note: "Take with food. Do not exceed 4g per day.",
              },
              {
                name: "ORS sachets",
                dosage: "1 sachet",
                freq: "After each loose stool or 3× daily",
                duration: "3 days",
                note: "Dissolve in 200ml clean water.",
              },
            ].map((med) => (
              <div
                key={med.name}
                className="p-4 rounded-xl border border-gray-100 bg-gray-50"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-blue-600" />
                    <span>{med.name}</span>
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500 mt-2">
                  <span>Dosage: {med.dosage}</span>
                  <span>Frequency: {med.freq}</span>
                  <span className="col-span-2">Duration: {med.duration}</span>
                </div>
                <p className="text-xs text-amber-700 mt-2 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>{med.note}</span>
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Doctor's Recommendations">
          <ul className="space-y-2">
            {[
              "Increase water intake to at least 2.5L per day",
              "Rest and avoid strenuous activities for 48 hours",
              "Avoid prolonged screen time",
              "If headache worsens or persists beyond 7 days, seek urgent review",
            ].map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Follow-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">
                Follow-up in 2 weeks
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Monday, October 16, 2026 · If symptoms persist
              </p>
            </div>
            <PrimaryBtn onClick={onClose}>Schedule Follow-up</PrimaryBtn>
          </div>
        </SectionCard>
      </div>

      <div className="flex gap-3 mt-6">
        <OutlineBtn onClick={onClose}>Download Summary</OutlineBtn>
        <PrimaryBtn onClick={onClose}>Return to Dashboard</PrimaryBtn>
      </div>
    </div>
  )
}

// ─── Screen 11 — Medical Records ──────────────────────────────────────────────

function MedicalRecordsView({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState("All")
  const [expanded, setExpanded] = useState<number | null>(0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="font-display text-2xl font-bold"
            style={{ color: NAVY }}
          >
            My Medical Records
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Your full consultation history with Healthitude.
          </p>
        </div>
        <OutlineBtn onClick={onBack}>← Back</OutlineBtn>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["All", "General", "Follow-up", "Specialist", "2026", "2025"].map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
              style={
                filter === f
                  ? { background: BLUE, color: "white", borderColor: BLUE }
                  : {
                      borderColor: "#e5e7eb",
                      color: "#6b7280",
                      background: "white",
                    }
              }
            >
              {f}
            </button>
          ),
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
        <div className="space-y-6">
          {SAMPLE_RECORDS.map((rec, i) => (
            <div key={i} className="relative pl-14">
              {/* Dot */}
              <div
                className="absolute left-3.5 top-5 w-3 h-3 rounded-full border-2 border-white"
                style={{ background: BLUE }}
              />
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-blue-200 transition-all shadow-xs hover:shadow-sm">
                <button
                  className="w-full p-5 text-left"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{rec.date}</p>
                      <p className="font-semibold text-gray-800">{rec.type}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {rec.doctor} · {rec.specialty}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "#dcfce7", color: "#15803d" }}
                      >
                        Completed
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          expanded === i ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
                {expanded === i && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Diagnosis
                      </p>
                      <p className="text-sm text-gray-700">{rec.diagnosis}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Prescription
                      </p>
                      <p className="text-sm text-gray-700">
                        {rec.prescription}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Notes
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {rec.notes}
                      </p>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <OutlineBtn>View Full Details</OutlineBtn>
                      <OutlineBtn>Download PDF</OutlineBtn>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main flow orchestrator ────────────────────────────────────────────────────

type TeleScreen = "find" | "profile" | "reason" | "intake" | "datetime" | "appt-review" | "confirmed" | "upcoming" | "video" | "summary" | "records"

export default function TelemedicineFlow() {
  const [screen, setScreen] = useState<TeleScreen>("find")
  const [selectedDoctor, setSelectedDoctor] = useState(DOCTORS[0])
  const [selectedReason, setSelectedReason] = useState("general")
  const [selectedDate, setSelectedDate] = useState("Today")
  const [selectedTime, setSelectedTime] = useState("2:30 PM")

  const go = (s: TeleScreen) => setScreen(s)

  // Video consultation takes full viewport
  if (screen === "video") {
    return (
      <VideoConsultation doctor={selectedDoctor} onEnd={() => go("summary")} />
    )
  }

  return (
    <div>
      {/* Telemedicine sub-nav */}
      {screen !== "records" && (
        <div className="flex items-center gap-2 mb-6 text-xs text-gray-400 overflow-x-auto pb-1">
          {([
            "find",
            "profile",
            "reason",
            "intake",
            "datetime",
            "appt-review",
            "confirmed",
            "upcoming",
            "summary",
          ] as TeleScreen[]).map((s, i) => {
            const labels: Record<TeleScreen, string> = {
              find: "Find Doctor",
              profile: "Profile",
              reason: "Reason",
              intake: "Intake",
              datetime: "Schedule",
              "appt-review": "Review",
              confirmed: "Confirmed",
              upcoming: "Upcoming",
              video: "Consultation",
              summary: "Summary",
              records: "Records",
            }
            const idx = ([
              "find",
              "profile",
              "reason",
              "intake",
              "datetime",
              "appt-review",
              "confirmed",
              "upcoming",
              "summary",
            ] as TeleScreen[]).indexOf(screen)
            const active = s === screen
            const past = i < idx
            return (
              <div key={s} className="flex items-center gap-1 flex-shrink-0">
                <span
                  className={`font-medium ${
                    active ? "" : past ? "text-gray-400" : "text-gray-300"
                  }`}
                  style={active ? { color: BLUE } : {}}
                >
                  {labels[s]}
                </span>
                {i < 8 && <span className="text-gray-200">›</span>}
              </div>
            )
          })}
          <button
            onClick={() => go("records")}
            className="ml-auto text-xs text-blue-600 hover:underline flex-shrink-0 inline-flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Records</span>
          </button>
        </div>
      )}

      {screen === "find" && (
        <FindProvider
          onSelect={(doc) => {
            setSelectedDoctor(doc)
            go("profile")
          }}
        />
      )}
      {screen === "profile" && (
        <DoctorProfile
          doctor={selectedDoctor}
          onBook={() => go("reason")}
          onBack={() => go("find")}
        />
      )}
      {screen === "reason" && (
        <ReasonForVisit
          onSelect={(r) => {
            setSelectedReason(r)
            go("intake")
          }}
          onBack={() => go("profile")}
        />
      )}
      {screen === "intake" && (
        <MedicalIntake
          onComplete={() => go("datetime")}
          onBack={() => go("reason")}
        />
      )}
      {screen === "datetime" && (
        <SelectDateTime
          doctor={selectedDoctor}
          onConfirm={(date, time) => {
            setSelectedDate(date)
            setSelectedTime(time)
            go("appt-review")
          }}
          onBack={() => go("intake")}
        />
      )}
      {screen === "appt-review" && (
        <AppointmentReview
          doctor={selectedDoctor}
          date={selectedDate}
          time={selectedTime}
          reason={selectedReason}
          onConfirm={() => go("confirmed")}
          onBack={() => go("datetime")}
        />
      )}
      {screen === "confirmed" && (
        <AppointmentConfirmed
          doctor={selectedDoctor}
          date={selectedDate}
          time={selectedTime}
          onDone={() => go("upcoming")}
        />
      )}
      {screen === "upcoming" && (
        <UpcomingAppointment
          doctor={selectedDoctor}
          date={selectedDate}
          time={selectedTime}
          onJoin={() => {}}
          onVideo={() => go("video")}
        />
      )}
      {screen === "summary" && (
        <ConsultationSummary
          doctor={selectedDoctor}
          onClose={() => go("find")}
        />
      )}
      {screen === "records" && <MedicalRecordsView onBack={() => go("find")} />}
    </div>
  )
}
