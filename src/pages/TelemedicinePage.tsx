import { useState, useRef, useEffect } from "react"
import { Link } from "react-router"
import logoBlue from "@/imports/Screenshot_2026-09-14_184508-removebg-preview.png"
import {
  Stethoscope,
  RotateCcw,
  Heart,
  Baby,
  Pill,
  Microscope,
  FileEdit,
  Activity,
  MapPin,
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
  FileText,
  UploadCloud,
  ChevronRight,
  Play,
  AlertTriangle,
  CreditCard,
  ArrowLeft,
} from "lucide-react"

// ─── Design tokens ─────────────────────────────────────────────────────────────
const BLUE = "#1a3fcf"
const NAVY = "#0d1b4b"
const SKY = "#0ea5e9"
const GREEN = "#16a34a"

// ─── Sample data ───────────────────────────────────────────────────────────────
const DOCTORS = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    specialty: "General Practitioner",
    qualifications: [
      "MBChB — University of Ghana",
      "FWACP (Family Medicine)",
      "Fellow, Ghana Medical Association",
    ],
    experience: 8,
    rating: 4.9,
    reviews: 312,
    consultations: 1420,
    location: "Accra, Ghana",
    fee: "₦15,000",
    nextSlot: "Today, 2:30 PM",
    video: true,
    inPerson: true,
    avatar: "SJ",
    color: "#7c3aed",
    bio: "Dr. Sarah Johnson is a board-certified General Practitioner with 8 years of clinical experience specialising in preventive care, chronic disease management, and family health. Known for patient-centred communication and clear explanations.",
    tags: [
      "General Practice",
      "Preventive Care",
      "Chronic Disease",
      "Family Health",
    ],
    slots: {
      "Mon 15": ["09:00 AM", "10:00 AM", "2:30 PM", "3:00 PM"],
      "Tue 16": ["09:30 AM", "11:00 AM", "1:00 PM"],
      "Wed 17": ["10:00 AM", "2:00 PM", "3:30 PM"],
    },
  },
  {
    id: 2,
    name: "Dr. Michael Ade",
    specialty: "Cardiologist",
    qualifications: [
      "MD — University of Lagos",
      "FACC (Cardiology)",
      "Fellow, Nigerian Cardiac Society",
    ],
    experience: 12,
    rating: 4.8,
    reviews: 218,
    consultations: 980,
    location: "Lagos, Nigeria",
    fee: "₦25,000",
    nextSlot: "Tomorrow, 10:00 AM",
    video: true,
    inPerson: false,
    avatar: "MA",
    color: "#0369a1",
    bio: "Dr. Michael Ade is a consultant cardiologist with 12 years of tertiary hospital experience in hypertension, heart failure, and preventive cardiology.",
    tags: ["Cardiology", "Hypertension", "Heart Failure", "ECG"],
    slots: {
      "Mon 15": [],
      "Tue 16": ["10:00 AM", "10:30 AM", "11:00 AM"],
      "Wed 17": ["09:00 AM", "09:30 AM"],
    },
  },
  {
    id: 3,
    name: "Dr. Afia Mensah",
    specialty: "Dermatologist",
    qualifications: [
      "MBChB — KNUST",
      "MSc Dermatology — UCL",
      "Ghana Dermatology Society",
    ],
    experience: 6,
    rating: 4.7,
    reviews: 175,
    consultations: 640,
    location: "Kumasi, Ghana",
    fee: "₦18,000",
    nextSlot: "Today, 4:00 PM",
    video: true,
    inPerson: true,
    avatar: "AM",
    color: "#be185d",
    bio: "Dr. Afia Mensah completed her postgraduate training at University College London and specialises in skin conditions, cosmetic dermatology, and skin cancer screening.",
    tags: ["Dermatology", "Skin Conditions", "Cosmetic", "Cancer Screening"],
    slots: {
      "Mon 15": ["4:00 PM", "4:30 PM"],
      "Tue 16": ["09:00 AM", "10:00 AM", "11:30 AM"],
      "Wed 17": ["09:00 AM", "10:00 AM"],
    },
  },
  {
    id: 4,
    name: "Dr. Kwame Osei",
    specialty: "Neurologist",
    qualifications: [
      "MD — Legon",
      "PhD Neuroscience — Edinburgh",
      "Fellow, WFN",
    ],
    experience: 15,
    rating: 4.9,
    reviews: 289,
    consultations: 1100,
    location: "Accra, Ghana",
    fee: "₦30,000",
    nextSlot: "Wed 17, 9:00 AM",
    video: true,
    inPerson: true,
    avatar: "KO",
    color: "#047857",
    bio: "Prof. Kwame Osei is a consultant neurologist and research fellow of the World Federation of Neurology, specialising in stroke, epilepsy, and neurodegenerative diseases.",
    tags: ["Neurology", "Stroke", "Epilepsy", "Migraine", "Parkinson's"],
    slots: {
      "Mon 15": [],
      "Tue 16": [],
      "Wed 17": ["09:00 AM", "09:30 AM", "10:00 AM"],
    },
  },
  {
    id: 5,
    name: "Dr. Fatima Al-Hassan",
    specialty: "Obstetrician & Gynaecologist",
    qualifications: [
      "MBChB — ABU Zaria",
      "FMCOG (O&G)",
      "Fellow, West African College",
    ],
    experience: 10,
    rating: 4.8,
    reviews: 401,
    consultations: 1890,
    location: "Abuja, Nigeria",
    fee: "₦22,000",
    nextSlot: "Tomorrow, 9:00 AM",
    video: true,
    inPerson: true,
    avatar: "FA",
    color: "#c2410c",
    bio: "Dr. Fatima Al-Hassan is a consultant OB-GYN with a decade of experience in high-risk pregnancy, maternal-foetal medicine, and minimally invasive gynaecological surgery.",
    tags: ["Obstetrics", "Gynaecology", "High-Risk Pregnancy", "Maternal Care"],
    slots: {
      "Mon 15": [],
      "Tue 16": ["09:00 AM", "09:30 AM", "2:00 PM"],
      "Wed 17": ["10:00 AM", "11:00 AM"],
    },
  },
  {
    id: 6,
    name: "Dr. Emmanuel Boateng",
    specialty: "Paediatrician",
    qualifications: [
      "MBChB — UDS",
      "FWACP (Paediatrics)",
      "Ghana Paediatric Association",
    ],
    experience: 9,
    rating: 4.9,
    reviews: 533,
    consultations: 2200,
    location: "Tamale, Ghana",
    fee: "₦14,000",
    nextSlot: "Today, 3:00 PM",
    video: true,
    inPerson: true,
    avatar: "EB",
    color: "#0891b2",
    bio: "Dr. Emmanuel Boateng is a paediatric consultant passionate about child health, vaccination advocacy, and neonatal care across northern Ghana.",
    tags: ["Paediatrics", "Neonatal Care", "Child Health", "Vaccination"],
    slots: {
      "Mon 15": ["3:00 PM", "3:30 PM", "4:00 PM"],
      "Tue 16": ["09:00 AM", "10:00 AM"],
      "Wed 17": ["09:00 AM", "10:00 AM", "11:00 AM"],
    },
  },
]

const SPECIALTIES = [
  "All Specialties",
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Obstetrics & Gynaecology",
  "Paediatrics",
  "Orthopedics",
  "Psychiatry",
  "ENT",
  "Ophthalmology",
]
const CONSULT_TYPES = [
  "All Types",
  "Video Consultation",
  "In-Person",
  "Follow-up",
]

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
    desc: "Common health concerns and symptoms.",
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
    desc: "Pregnancy, postpartum, and maternal health.",
  },
  {
    id: "child",
    icon: <Baby className="w-5 h-5 text-amber-600" />,
    title: "Child Health",
    desc: "Health concerns involving children.",
  },
  {
    id: "medication",
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
    id: "mental",
    icon: <Activity className="w-5 h-5 text-cyan-600" />,
    title: "Mental Health",
    desc: "Anxiety, depression, stress, and wellbeing.",
  },
  {
    id: "other",
    icon: <FileEdit className="w-5 h-5 text-gray-600" />,
    title: "Other",
    desc: "Describe another reason for your visit.",
  },
]

const SYMPTOMS_LIST = [
  "Fever",
  "Headache",
  "Nausea",
  "Vomiting",
  "Dizziness",
  "Fatigue",
  "Cough",
  "Chest pain",
  "Shortness of breath",
  "Joint pain",
  "Back pain",
  "Rash",
  "Swelling",
  "Abdominal pain",
  "Loss of appetite",
  "Insomnia",
  "Palpitations",
  "Visual changes",
]
const CONDITIONS_LIST = [
  "None",
  "Asthma",
  "Diabetes (Type 1)",
  "Diabetes (Type 2)",
  "Hypertension",
  "Heart disease",
  "Kidney disease",
  "Arthritis",
  "Thyroid disorder",
  "HIV/AIDS",
  "Sickle cell disease",
  "Cancer",
  "Other",
]

const CALENDAR = [
  { short: "MON", day: "15", key: "Mon 15" },
  { short: "TUE", day: "16", key: "Tue 16" },
  { short: "WED", day: "17", key: "Wed 17" },
  { short: "THU", day: "18", key: "Thu 18" },
  { short: "FRI", day: "19", key: "Fri 19" },
]

const MORNING = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
]
const AFTERNOON = [
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
]
const UNAVAILABLE_SLOTS = ["10:30 AM", "01:30 PM", "03:00 PM"]

const RECORDS = [
  {
    date: "September 16, 2026",
    type: "General Consultation",
    doctor: "Dr. Sarah Johnson",
    specialty: "General Practitioner",
    diagnosis: "Tension-type headache (G44.2), Mild dehydration (E86.0)",
    prescription:
      "Paracetamol 500mg · 2× daily · 5 days; ORS sachets · 3× daily · 3 days",
    notes:
      "Patient presented with 5-day headache, fatigue, dizziness. Vitals normal. Likely tension headache with dehydration. Advised rest and increased fluid intake.",
  },
  {
    date: "August 02, 2026",
    type: "Follow-up Consultation",
    doctor: "Dr. Michael Ade",
    specialty: "Cardiologist",
    diagnosis: "Controlled Hypertension (I10)",
    prescription: "Amlodipine 5mg · Once daily (continued)",
    notes:
      "BP within target range. Continue current regimen. Lifestyle modifications ongoing. Next review in 3 months.",
  },
  {
    date: "June 14, 2026",
    type: "Specialist Consultation",
    doctor: "Dr. Afia Mensah",
    specialty: "Dermatologist",
    diagnosis: "Allergic contact dermatitis (L23.9)",
    prescription:
      "Hydrocortisone cream 1% · BD · 7 days; Cetirizine 10mg · Once nightly · 14 days",
    notes:
      "Allergic reaction to new detergent. Patch testing recommended. Avoid identified allergen.",
  },
]

type Doctor = typeof DOCTORS[0]

// ─── Tiny shared components ────────────────────────────────────────────────────

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
      Verified
    </span>
  )
}

function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${
            i < Math.floor(n)
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200 fill-gray-200"
          }`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

function Avatar({
  initials,
  color,
  size = 48,
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
        fontSize: size * 0.31,
      }}
    >
      {initials}
    </div>
  )
}

function Pill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-1.5 rounded-none text-sm font-medium border transition-all whitespace-nowrap cursor-pointer"
      style={
        active
          ? { background: BLUE, color: "white", borderColor: BLUE }
          : { borderColor: "#e5e7eb", color: "#374151", background: "white" }
      }
    >
      {children}
    </button>
  )
}

function Btn({
  children,
  onClick,
  disabled,
  variant = "primary",
  full,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: "primary" | "outline" | "green"
  full?: boolean
}) {
  const fullClass = full ? "!w-full justify-center" : ""
  if (variant === "outline")
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`btn-underline ${fullClass}`}
      >
        {children}
      </button>
    )
  if (variant === "green")
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`btn-ripple ${fullClass} text-white font-semibold`}
      >
        {children}
      </button>
    )
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-glow ${fullClass} text-white font-semibold`}
    >
      {children}
    </button>
  )
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all duration-150 ${className}`}
    >
      {children}
    </div>
  )
}

function SectionHead({
  step,
  total,
  title,
  sub,
}: {
  step: number
  total: number
  title: string
  sub?: string
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: BLUE }}
        >
          Step {step} of {total}
        </span>
        <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(step / total) * 100}%`, background: BLUE }}
          />
        </div>
      </div>
      <h2 className="font-display text-2xl font-bold" style={{ color: NAVY }}>
        {title}
      </h2>
      {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function BackBtn({
  onClick,
  label = "Back",
}: {
  onClick: () => void
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 group transition-colors"
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
      {label}
    </button>
  )
}

// ─── Screen 1: Find a Doctor ───────────────────────────────────────────────────

function ScreenFind({ onSelect }: { onSelect: (d: Doctor) => void }) {
  const [q, setQ] = useState("")
  const [spec, setSpec] = useState("All Specialties")
  const [ctype, setCtype] = useState("All Types")

  const list = DOCTORS.filter((d) => {
    const sq =
      !q ||
      d.name.toLowerCase().includes(q.toLowerCase()) ||
      d.specialty.toLowerCase().includes(q.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(q.toLowerCase()))
    const ss =
      spec === "All Specialties" ||
      d.specialty.toLowerCase().includes(spec.split(" ")[0].toLowerCase())
    const sc =
      ctype === "All Types" ||
      (ctype.includes("Video") && d.video) ||
      (ctype.includes("In-Person") && d.inPerson)
    return sq && ss && sc
  })

  return (
    <div>
      <div className="mb-8">
        <h1
          className="font-display text-3xl font-bold mb-2"
          style={{ color: NAVY }}
        >
          Find a Doctor
        </h1>
        <p className="text-gray-500">
          Search and book a consultation with a verified healthcare
          professional.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300"
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
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search doctors, specialties, conditions..."
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent shadow-sm"
          style={{ "--tw-ring-color": BLUE + "30" } as React.CSSProperties}
        />
      </div>

      {/* Filter row */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
        <select
          value={spec}
          onChange={(e) => setSpec(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white text-gray-700 focus:outline-none flex-shrink-0 shadow-sm"
        >
          {SPECIALTIES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={ctype}
          onChange={(e) => setCtype(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white text-gray-700 focus:outline-none flex-shrink-0 shadow-sm"
        >
          {CONSULT_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {["Available today", "4.8+ rating", "Under ₦20,000"].map((f) => (
          <button
            key={f}
            className="border border-gray-200 rounded-none px-4 py-2.5 text-xs text-gray-600 bg-white hover:border-blue-300 hover:text-blue-700 transition-colors flex-shrink-0 shadow-sm whitespace-nowrap"
          >
            {f}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-5 font-medium">
        {list.length} doctor{list.length !== 1 ? "s" : ""} found
      </p>

      <div className="grid gap-4">
        {list.map((doc) => (
          <Card
            key={doc.id}
            className="p-5 hover:border-blue-200 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex gap-4">
              <div className="relative flex-shrink-0">
                <Avatar initials={doc.avatar} color={doc.color} size={64} />
                {doc.video && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-base group-hover:text-blue-700 transition-colors">
                        {doc.name}
                      </h3>
                      <VerifiedBadge />
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {doc.specialty} · {doc.experience} yrs experience
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900 text-base">
                      {doc.fee}
                    </p>
                    <p className="text-xs text-gray-400">per consultation</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 my-2">
                  <span className="flex items-center gap-1">
                    <Stars n={doc.rating} />
                    <span className="text-sm font-semibold text-gray-700 ml-1">
                      {doc.rating}
                    </span>
                    <span className="text-xs text-gray-400 ml-0.5">
                      ({doc.reviews})
                    </span>
                  </span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-500">
                    {doc.consultations.toLocaleString()} consultations
                  </span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />{" "}
                    {doc.location}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {doc.video && (
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1"
                      style={{ background: "#e0f2fe", color: "#0369a1" }}
                    >
                      <Video className="w-3 h-3" /> Video
                    </span>
                  )}
                  {doc.inPerson && (
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1"
                      style={{ background: "#ede9fe", color: "#7c3aed" }}
                    >
                      <Building2 className="w-3 h-3" /> In-Person
                    </span>
                  )}
                  {doc.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className="text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1"
                    style={{ background: "#f0fdf4", color: GREEN }}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Next: {doc.nextSlot}</span>
                  </span>
                  <div className="flex gap-2">
                    <Btn variant="outline" onClick={() => onSelect(doc)}>
                      View Profile
                    </Btn>
                    <Btn onClick={() => onSelect(doc)}>Book Consultation</Btn>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {!list.length && (
          <div className="text-center py-20 text-gray-400">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-600">
              No doctors match your search
            </p>
            <p className="text-sm mt-1">
              Try adjusting your filters or search terms
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Screen 2: Doctor Profile ──────────────────────────────────────────────────

function ScreenProfile({
  doc,
  onBook,
  onBack,
}: {
  doc: Doctor
  onBook: () => void
  onBack: () => void
}) {
  const [day, setDay] = useState(CALENDAR[0].key)
  const [time, setTime] = useState("")
  const slots = (doc.slots as Record<string, string[]>)[day] ?? []

  return (
    <div>
      <BackBtn onClick={onBack} label="Back to search" />

      {/* Hero card */}
      <Card className="p-6 mb-5">
        <div className="flex gap-5 flex-wrap">
          <Avatar initials={doc.avatar} color={doc.color} size={88} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1
                className="font-display text-2xl font-bold"
                style={{ color: NAVY }}
              >
                {doc.name}
              </h1>
              <VerifiedBadge />
            </div>
            <p className="text-gray-500 text-sm mb-3 flex items-center gap-1.5 flex-wrap">
              <span>
                {doc.specialty} · {doc.experience} years experience
              </span>
              <span className="text-gray-300">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> {doc.location}
              </span>
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Stars n={doc.rating} />
                <span className="font-semibold text-gray-700 ml-1">
                  {doc.rating}
                </span>
                <span className="text-gray-400 ml-0.5">
                  ({doc.reviews} reviews)
                </span>
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-600">
                {doc.consultations.toLocaleString()} consultations
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="font-bold text-sm" style={{ color: BLUE }}>
                {doc.fee} / consultation
              </span>
              {doc.video && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1"
                  style={{ background: "#e0f2fe", color: "#0369a1" }}
                >
                  <Video className="w-3 h-3" /> Video
                </span>
              )}
              {doc.inPerson && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1"
                  style={{ background: "#ede9fe", color: "#7c3aed" }}
                >
                  <Building2 className="w-3 h-3" /> In-Person
                </span>
              )}
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1"
                style={{ background: "#fef3c7", color: "#b45309" }}
              >
                <RotateCcw className="w-3 h-3" /> Follow-up
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-3">About</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{doc.bio}</p>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-3">
              Qualifications & Memberships
            </h3>
            <ul className="space-y-2.5">
              {doc.qualifications.map((q) => (
                <li
                  key={q}
                  className="flex items-center gap-2.5 text-sm text-gray-600"
                >
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {doc.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 bg-gray-50"
                >
                  {t}
                </span>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-3">
              Consultation Types
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: (
                    <Video className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  ),
                  title: "Video",
                  avail: doc.video,
                },
                {
                  icon: (
                    <Building2 className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
                  ),
                  title: "In-Person",
                  avail: doc.inPerson,
                },
                {
                  icon: (
                    <RotateCcw className="w-6 h-6 text-sky-600 mx-auto mb-1" />
                  ),
                  title: "Follow-up",
                  avail: true,
                },
              ].map((t) => (
                <div
                  key={t.title}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    t.avail
                      ? "border-blue-100 bg-blue-50/40"
                      : "border-gray-100 bg-gray-50 opacity-50"
                  }`}
                >
                  <div className="mb-1">{t.icon}</div>
                  <p className="font-semibold text-sm text-gray-800">
                    {t.title}
                  </p>
                  {!t.avail && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Not available
                    </p>
                  )}
                  <p className="text-2xl mb-1">{t.icon}</p>
                  <p className="font-semibold text-sm text-gray-800">
                    {t.title}
                  </p>
                  {!t.avail && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Not available
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Booking sidebar */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">
              Book Appointment
            </h3>
            {/* Day strip */}
            <div className="flex gap-1.5 mb-5">
              {CALENDAR.slice(0, 3).map((d) => (
                <button
                  key={d.key}
                  onClick={() => {
                    setDay(d.key)
                    setTime("")
                  }}
                  className="flex-1 py-2.5 rounded-xl border-2 text-center transition-all"
                  style={
                    day === d.key
                      ? { background: BLUE, borderColor: BLUE, color: "white" }
                      : { borderColor: "#e5e7eb", color: "#6b7280" }
                  }
                >
                  <div className="text-xs font-medium">{d.short}</div>
                  <div className="text-base font-bold mt-0.5">{d.day}</div>
                </button>
              ))}
            </div>
            {/* Slots */}
            {slots.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 mb-5">
                {slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => setTime(s)}
                    className="py-2 rounded-xl border text-xs font-medium transition-all"
                    style={
                      time === s
                        ? {
                            background: BLUE,
                            color: "white",
                            borderColor: BLUE,
                          }
                        : { borderColor: "#e5e7eb", color: "#374151" }
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-5 bg-gray-50 rounded-xl mb-4">
                No slots on this day
              </p>
            )}
            <Btn full onClick={onBook}>
              {time ? `Book ${time}` : "Book Consultation"}
            </Btn>
            <p className="text-xs text-gray-400 text-center mt-2">
              Free cancellation up to 24h before
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100 text-amber-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                This service is for consultations only. In case of emergency,
                call 112 or go to the nearest A&E immediately.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Screen 3: Reason for Visit ────────────────────────────────────────────────

function ScreenReason({
  onNext,
  onBack,
}: {
  onNext: (r: string) => void
  onBack: () => void
}) {
  const [picked, setPicked] = useState("")

  return (
    <div className="max-w-2xl mx-auto">
      <BackBtn onClick={onBack} />
      <SectionHead
        step={1}
        total={5}
        title="What brings you to Healthitude?"
        sub="Choose the reason for your visit so we can prepare your consultation."
      />

      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {VISIT_REASONS.map((r) => (
          <button
            key={r.id}
            onClick={() => setPicked(r.id)}
            className="p-4 rounded-xl border text-left transition-all hover:shadow-sm cursor-pointer"
            style={
              picked === r.id
                ? { borderColor: BLUE, background: BLUE + "08" }
                : { borderColor: "#e5e7eb", background: "white" }
            }
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                {r.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{r.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {r.desc}
                </p>
              </div>
              {picked === r.id && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: BLUE }}
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
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
        <Btn variant="outline" onClick={onBack}>
          Back
        </Btn>
        <Btn onClick={() => picked && onNext(picked)} disabled={!picked}>
          Continue
        </Btn>
      </div>
    </div>
  )
}

// ─── Screen 4: Medical Intake (multi-step) ─────────────────────────────────────

const INTAKE_STEPS = [
  "Symptoms",
  "Medical History",
  "Medications",
  "Documents",
  "Review",
]

function ScreenIntake({
  onDone,
  onBack,
}: {
  onDone: () => void
  onBack: () => void
}) {
  const [sub, setSub] = useState(0)
  const [symptoms, setSymptoms] = useState("")
  const [onset, setOnset] = useState("")
  const [severity, setSeverity] = useState("")
  const [extra, setExtra] = useState<string[]>([])
  const [conditions, setConds] = useState<string[]>([])
  const [prevCond, setPrevCond] = useState("")
  const [prevSurg, setPrevSurg] = useState("")
  const [allergies, setAllergies] = useState("")
  const [meds, setMeds] = useState([
    { name: "Paracetamol", dose: "500mg", freq: "2× daily", dur: "3 days" },
  ])
  const [noMeds, setNoMeds] = useState(false)
  const [files, setFiles] = useState([
    { name: "Blood_Test.pdf", size: "1.2 MB", ext: "pdf" },
  ])
  const [confirmed, setConfirmed] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const toggle = (
    arr: string[],
    setArr: React.Dispatch<React.SetStateAction<string[]>>,
    v: string,
  ) => setArr((a) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]))

  const ONSET_OPTS = [
    "Today",
    "2–3 days ago",
    "Within the last week",
    "1–4 weeks ago",
    "More than a month ago",
  ]
  const SEV = [
    { k: "mild", label: "Mild", desc: "Manageable", dot: "#22c55e" },
    {
      k: "moderate",
      label: "Moderate",
      desc: "Affecting daily life",
      dot: "#f59e0b",
    },
    {
      k: "severe",
      label: "Severe",
      desc: "Significantly limiting",
      dot: "#ef4444",
    },
  ]

  const prevStep = () => {
    if (sub === 0) onBack()
    else setSub((s) => s - 1)
  }
  const nextStep = () => {
    if (sub < 4) setSub((s) => s + 1)
    else onDone()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <BackBtn onClick={prevStep} />
      <SectionHead
        step={2}
        total={5}
        title="Tell us about your health concern"
        sub="Your doctor will review this information before your consultation."
      />

      {/* Progress tabs */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {INTAKE_STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: i <= sub ? BLUE : "#e5e7eb",
                  color: i <= sub ? "white" : "#9ca3af",
                }}
              >
                {i < sub ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className="text-xs font-medium"
                style={{
                  color: i === sub ? BLUE : i < sub ? "#9ca3af" : "#d1d5db",
                }}
              >
                {s}
              </span>
            </div>
            {i < INTAKE_STEPS.length - 1 && (
              <div
                className="w-5 h-px mx-1"
                style={{ background: i < sub ? BLUE : "#e5e7eb" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 0 — Symptoms */}
      {sub === 0 && (
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Main symptoms</h3>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={4}
              placeholder="Describe what you are experiencing in your own words..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none leading-relaxed"
            />
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-gray-700 mb-3">
              When did symptoms start?
            </h3>
            <div className="flex flex-wrap gap-2">
              {ONSET_OPTS.map((o) => (
                <Pill key={o} active={onset === o} onClick={() => setOnset(o)}>
                  {o}
                </Pill>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Severity</h3>
            <div className="grid grid-cols-3 gap-3">
              {SEV.map((s) => (
                <button
                  key={s.k}
                  onClick={() => setSeverity(s.k)}
                  className="py-5 rounded-xl border-2 text-center transition-all hover:shadow-sm"
                  style={
                    severity === s.k
                      ? { borderColor: s.dot, background: s.dot + "14" }
                      : { borderColor: "#e5e7eb" }
                  }
                >
                  <div
                    className="w-4 h-4 rounded-full mx-auto mb-2 transition-all"
                    style={{ background: severity === s.k ? s.dot : "#e5e7eb" }}
                  />
                  <p className="font-bold text-sm text-gray-800">{s.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-gray-700 mb-3">
              Additional symptoms
            </h3>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS_LIST.map((s) => (
                <button
                  key={s}
                  onClick={() => toggle(extra, setExtra, s)}
                  className="px-3 py-1.5 rounded-full text-xs border transition-all"
                  style={
                    extra.includes(s)
                      ? { background: BLUE, color: "white", borderColor: BLUE }
                      : { borderColor: "#e5e7eb", color: "#374151" }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Step 1 — Medical History */}
      {sub === 1 && (
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-700 mb-3">
              Existing medical conditions
            </h3>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS_LIST.map((c) => (
                <button
                  key={c}
                  onClick={() => toggle(conditions, setConds, c)}
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
          </Card>
          {[
            {
              label: "Previous similar condition?",
              val: prevCond,
              set: setPrevCond,
            },
            {
              label: "Previous surgeries or hospitalisation?",
              val: prevSurg,
              set: setPrevSurg,
            },
          ].map((row) => (
            <Card key={row.label} className="p-5">
              <h3 className="font-semibold text-gray-700 mb-3">{row.label}</h3>
              <div className="flex gap-3">
                {["Yes", "No"].map((v) => (
                  <Pill
                    key={v}
                    active={row.val === v}
                    onClick={() => row.set(v)}
                  >
                    {v}
                  </Pill>
                ))}
              </div>
            </Card>
          ))}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-700 mb-3">
              Known allergies
            </h3>
            <textarea
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              rows={3}
              placeholder="e.g. Penicillin, peanuts, latex, iodine..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
            />
          </Card>
        </div>
      )}

      {/* Step 2 — Medications */}
      {sub === 2 && (
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-700 mb-4">
              Current medications
            </h3>
            {!noMeds &&
              meds.map((m, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl mb-3"
                >
                  <input
                    defaultValue={m.name}
                    placeholder="Medication name"
                    className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white"
                  />
                  <input
                    defaultValue={m.dose}
                    placeholder="Dosage"
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white"
                  />
                  <input
                    defaultValue={m.freq}
                    placeholder="Frequency"
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white"
                  />
                  <input
                    defaultValue={m.dur}
                    placeholder="Duration"
                    className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white"
                  />
                </div>
              ))}
            {!noMeds && (
              <button
                onClick={() =>
                  setMeds((m) => [
                    ...m,
                    { name: "", dose: "", freq: "", dur: "" },
                  ])
                }
                className="flex items-center gap-2 text-sm font-medium mt-1 transition-colors"
                style={{ color: BLUE }}
              >
                <span
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-base leading-none"
                  style={{ borderColor: BLUE }}
                >
                  +
                </span>
                Add medication
              </button>
            )}
            <label className="flex items-center gap-2.5 cursor-pointer mt-4 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={noMeds}
                onChange={(e) => setNoMeds(e.target.checked)}
                className="rounded accent-blue-600 w-4 h-4"
              />
              I am not currently taking any medication
            </label>
          </Card>
        </div>
      )}

      {/* Step 3 — Documents */}
      {sub === 3 && (
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-700 mb-1">
              Upload relevant documents
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Upload reports, test results, prescriptions, or scans that may
              help your doctor.
            </p>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/20 transition-all"
            >
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files)
                    setFiles((f) => [
                      ...f,
                      ...Array.from(e.target.files!).map((x) => ({
                        name: x.name,
                        size: (x.size / 1048576).toFixed(1) + " MB",
                        ext: x.name.split(".").pop() || "file",
                      })),
                    ])
                }}
              />
              <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="font-semibold text-gray-700 text-sm">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, JPG, PNG, DOCX · Max 20 MB each
              </p>
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
                          f.ext === "pdf"
                            ? "#ef4444"
                            : f.ext === "jpg" || f.ext === "png"
                              ? "#f59e0b"
                              : "#6366f1",
                      }}
                    >
                      {f.ext}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {f.name}
                      </p>
                      <p className="text-xs text-gray-400">{f.size}</p>
                    </div>
                    <div className="flex gap-3">
                      <button className="text-xs text-blue-600 hover:underline">
                        Preview
                      </button>
                      <button
                        onClick={() =>
                          setFiles((x) => x.filter((_, j) => j !== i))
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
          </Card>
        </div>
      )}

      {/* Step 4 — Review */}
      {sub === 4 && (
        <div className="space-y-4">
          {[
            {
              title: "Symptoms",
              body: symptoms || "Not provided",
              meta: onset ? `Started ${onset}` : undefined,
              badge: severity,
            },
            {
              title: "Extra symptoms",
              body: extra.length ? extra.join(", ") : "None",
            },
            {
              title: "Conditions",
              body: conditions.length ? conditions.join(", ") : "None reported",
            },
            { title: "Allergies", body: allergies || "None reported" },
            {
              title: "Medications",
              body: noMeds
                ? "None"
                : meds
                    .map((m) => `${m.name} ${m.dose} · ${m.freq} · ${m.dur}`)
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
                {row.meta && (
                  <p className="text-xs text-gray-400 mt-0.5">{row.meta}</p>
                )}
                {row.badge && (
                  <span
                    className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                    style={{ background: "#fef3c7", color: "#b45309" }}
                  >
                    {row.badge}
                  </span>
                )}
              </div>
              <button
                className="text-xs text-blue-600 hover:underline flex-shrink-0"
                onClick={() => setSub(0)}
              >
                Edit
              </button>
            </div>
          ))}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
            Your information will be shared with your selected healthcare
            provider solely for the purpose of your consultation.
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-600">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="rounded accent-blue-600 w-4 h-4"
            />
            I confirm that the information provided is accurate.
          </label>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Btn variant="outline" onClick={prevStep}>
          Back
        </Btn>
        <Btn onClick={nextStep} disabled={sub === 4 && !confirmed}>
          {sub < 4 ? "Continue" : "Continue to Appointment"}
        </Btn>
      </div>
    </div>
  )
}

// ─── Screen 5: Select Date & Time ─────────────────────────────────────────────

function ScreenSchedule({
  doc,
  onNext,
  onBack,
}: {
  doc: Doctor
  onNext: (d: string, t: string) => void
  onBack: () => void
}) {
  const [day, setDay] = useState(CALENDAR[0])
  const [slot, setSlot] = useState("")

  return (
    <div className="max-w-xl mx-auto">
      <BackBtn onClick={onBack} />
      <SectionHead
        step={3}
        total={5}
        title="Choose your appointment"
        sub="Select a date and time that works for you."
      />

      <Card className="p-4 flex items-center gap-4 mb-6">
        <Avatar initials={doc.avatar} color={doc.color} size={48} />
        <div>
          <p className="font-bold text-gray-900">{doc.name}</p>
          <p className="text-sm text-gray-500">{doc.specialty}</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold bg-sky-100 text-sky-800">
          <Video className="w-3.5 h-3.5 text-sky-600" /> Video
        </span>
      </Card>

      {/* Date strip */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CALENDAR.map((d) => (
          <button
            key={d.key}
            onClick={() => {
              setDay(d)
              setSlot("")
            }}
            className="flex-shrink-0 w-16 py-3.5 rounded-xl border-2 text-center transition-all"
            style={
              day.key === d.key
                ? { background: BLUE, borderColor: BLUE, color: "white" }
                : {
                    borderColor: "#e5e7eb",
                    color: "#6b7280",
                    background: "white",
                  }
            }
          >
            <div className="text-xs font-semibold">{d.short}</div>
            <div className="text-xl font-bold mt-0.5">{d.day}</div>
          </button>
        ))}
      </div>

      <Card className="p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Morning
        </p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {MORNING.map((t) => {
            const off = UNAVAILABLE_SLOTS.includes(t)
            return (
              <button
                key={t}
                disabled={off}
                onClick={() => setSlot(t)}
                className="py-2.5 rounded-xl border text-xs font-medium transition-all"
                style={
                  off
                    ? {
                        borderColor: "#f3f4f6",
                        color: "#d1d5db",
                        background: "#f9fafb",
                        cursor: "not-allowed",
                      }
                    : slot === t
                      ? { background: BLUE, color: "white", borderColor: BLUE }
                      : { borderColor: "#e5e7eb", color: "#374151" }
                }
              >
                {off ? <s>{t}</s> : t}
              </button>
            )
          })}
        </div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Afternoon
        </p>
        <div className="grid grid-cols-3 gap-2">
          {AFTERNOON.map((t) => {
            const off = UNAVAILABLE_SLOTS.includes(t)
            return (
              <button
                key={t}
                disabled={off}
                onClick={() => setSlot(t)}
                className="py-2.5 rounded-xl border text-xs font-medium transition-all"
                style={
                  off
                    ? {
                        borderColor: "#f3f4f6",
                        color: "#d1d5db",
                        background: "#f9fafb",
                        cursor: "not-allowed",
                      }
                    : slot === t
                      ? { background: BLUE, color: "white", borderColor: BLUE }
                      : { borderColor: "#e5e7eb", color: "#374151" }
                }
              >
                {off ? <s>{t}</s> : t}
              </button>
            )
          })}
        </div>
      </Card>

      <div className="flex justify-between mt-6">
        <Btn variant="outline" onClick={onBack}>
          Back
        </Btn>
        <Btn onClick={() => slot && onNext(day.key, slot)} disabled={!slot}>
          Continue
        </Btn>
      </div>
    </div>
  )
}

// ─── Screen 6: Appointment Review ─────────────────────────────────────────────

function ScreenReview({
  doc,
  date,
  time,
  reason,
  onConfirm,
  onBack,
}: {
  doc: Doctor
  date: string
  time: string
  reason: string
  onConfirm: () => void
  onBack: () => void
}) {
  const reasonLabel =
    VISIT_REASONS.find((r) => r.id === reason)?.title ?? reason
  const fullDate =
    date === "Mon 15"
      ? "Monday, 15 September 2026"
      : "Tuesday, 16 September 2026"
  const rows = [
    { l: "Doctor", v: doc.name },
    { l: "Specialty", v: doc.specialty },
    { l: "Date", v: fullDate },
    { l: "Time", v: time },
    { l: "Consultation type", v: "Video Consultation" },
    { l: "Reason for visit", v: reasonLabel },
    { l: "Consultation fee", v: doc.fee, accent: true },
  ]

  return (
    <div className="max-w-md mx-auto">
      <BackBtn onClick={onBack} />
      <SectionHead step={4} total={5} title="Review your appointment" />

      <Card className="overflow-hidden mb-6">
        <div
          className="p-5 flex items-center gap-4"
          style={{ background: `linear-gradient(135deg,${NAVY},${BLUE})` }}
        >
          <Avatar initials={doc.avatar} color={doc.color + "cc"} size={52} />
          <div>
            <p className="font-bold text-white">{doc.name}</p>
            <VerifiedBadge />
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {rows.map((r) => (
            <div
              key={r.l}
              className="flex items-center justify-between px-5 py-3.5"
            >
              <span className="text-sm text-gray-500">{r.l}</span>
              <span
                className="text-sm font-semibold"
                style={r.accent ? { color: BLUE } : { color: "#111827" }}
              >
                {r.v}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-xs text-center text-gray-400 mb-6">
        Payment is processed after confirmation. No charges apply before you
        confirm.
      </p>

      <div className="flex gap-3">
        <Btn variant="outline" onClick={onBack}>
          Back
        </Btn>
        <div className="flex-1">
          <Btn full onClick={onConfirm}>
            Confirm Appointment
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Screen 7: Confirmed ───────────────────────────────────────────────────────

function ScreenConfirmed({
  doc,
  date,
  time,
  onDone,
}: {
  doc: Doctor
  date: string
  time: string
  onDone: () => void
}) {
  return (
    <div className="max-w-md mx-auto text-center py-8">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: "#dcfce7" }}
      >
        <svg
          className="w-12 h-12"
          fill="none"
          stroke={GREEN}
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
        A confirmation has been sent to your registered email address.
      </p>

      <Card className="p-6 text-left mb-6">
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-gray-100">
          <Avatar initials={doc.avatar} color={doc.color} size={52} />
          <div>
            <p className="font-bold text-gray-900">{doc.name}</p>
            <p className="text-sm text-gray-500">{doc.specialty}</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            {
              i: <Calendar className="w-4 h-4 text-blue-600" />,
              v: `${date === "Mon 15" ? "Monday" : "Tuesday"}, ${
                date === "Mon 15" ? "15" : "16"
              } September 2026`,
            },
            { i: <Clock className="w-4 h-4 text-indigo-600" />, v: time },
            {
              i: <Video className="w-4 h-4 text-emerald-600" />,
              v: "Video Consultation",
            },
            { i: <CreditCard className="w-4 h-4 text-gray-500" />, v: doc.fee },
          ].map((row) => (
            <div
              key={row.v}
              className="flex items-center gap-3 text-sm text-gray-700"
            >
              <span className="flex-shrink-0">{row.i}</span>
              {row.v}
            </div>
          ))}
        </div>
      </Card>

      <p className="text-xs text-gray-400 mb-6">
        Your doctor can review your pre-consultation information before the
        appointment.
      </p>
      <div className="flex flex-col gap-3">
        <Btn full onClick={onDone}>
          View Upcoming Appointment
        </Btn>
        <Btn variant="outline" full onClick={onDone}>
          Return to Dashboard
        </Btn>
        <button className="text-sm text-blue-600 hover:underline">
          Add to Calendar
        </button>
      </div>
    </div>
  )
}

// ─── Screen 8: Upcoming Appointment ───────────────────────────────────────────

function ScreenUpcoming({
  doc,
  date,
  time,
  onJoin,
}: {
  doc: Doctor
  date: string
  time: string
  onJoin: () => void
}) {
  return (
    <div className="max-w-lg mx-auto">
      <h2
        className="font-display text-2xl font-bold mb-6"
        style={{ color: NAVY }}
      >
        Upcoming Consultation
      </h2>
      <Card className="overflow-hidden mb-4">
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg,${BLUE},${SKY})` }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
            <span className="text-white text-xs font-bold uppercase tracking-wider">
              Confirmed
            </span>
          </div>
          <span className="text-white/80 text-xs">
            {date === "Mon 15" ? "Today" : "Tomorrow"} · {time}
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <Avatar initials={doc.avatar} color={doc.color} size={60} />
            <div>
              <p className="font-bold text-gray-900 text-base">{doc.name}</p>
              <p className="text-sm text-gray-500">{doc.specialty}</p>
              <div className="mt-1">
                <VerifiedBadge />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              {
                i: <Calendar className="w-5 h-5 text-blue-600 mx-auto" />,
                l: "Date",
                v: date === "Mon 15" ? "Sep 15" : "Sep 16",
              },
              {
                i: <Clock className="w-5 h-5 text-indigo-600 mx-auto" />,
                l: "Time",
                v: time,
              },
              {
                i: <Video className="w-5 h-5 text-emerald-600 mx-auto" />,
                l: "Type",
                v: "Video",
              },
            ].map((x) => (
              <div key={x.l} className="p-3 rounded-xl bg-gray-50 text-center">
                <div className="mb-1">{x.i}</div>
                <p className="text-xs text-gray-400 mt-1">{x.l}</p>
                <p className="text-sm font-bold text-gray-700 mt-0.5">{x.v}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Btn variant="outline" onClick={onJoin}>
              View Details
            </Btn>
            <Btn variant="green" onClick={onJoin}>
              <span className="inline-flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Join Consultation</span>
              </span>
            </Btn>
          </div>
        </div>
      </Card>
      <p className="text-xs text-center text-gray-400">
        The Join button activates when your appointment is within 15 minutes.
      </p>
    </div>
  )
}

// ─── Screen 9: Video Consultation ─────────────────────────────────────────────

function ScreenVideo({ doc, onEnd }: { doc: Doctor onEnd: () => void }) {
  const [muted, setMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  const controls = [
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
      label: camOff ? "Cam on" : "Cam off",
      active: camOff,
      onClick: () => setCamOff((c) => !c),
    },
    {
      icon: <Monitor className="w-5 h-5 text-white" />,
      label: sharing ? "Stop" : "Share",
      active: sharing,
      onClick: () => setSharing((s) => !s),
    },
    {
      icon: <MoreHorizontal className="w-5 h-5 text-white" />,
      label: "More",
      active: false,
      onClick: () => {},
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#070d1a" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src={logoBlue}
            alt="Healthitude"
            className="h-7 brightness-0 invert opacity-70 object-contain"
          />
          <span className="text-white/50 text-xs hidden sm:inline">
            Secure Consultation Room
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Connected
          </span>
          <span
            className="font-mono text-base font-bold"
            style={{ color: SKY }}
          >
            00:{fmt(elapsed)}
          </span>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video */}
        <div className="flex-1 relative" style={{ background: "#0d1526" }}>
          {/* Doctor main feed */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center select-none">
              <div
                className="mx-auto mb-4"
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: doc.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                {doc.avatar}
              </div>
              <p className="text-white/60 text-sm">{doc.name}</p>
              <p className="text-white/30 text-xs mt-1">Video connected</p>
            </div>
          </div>
          {/* Self PiP */}
          <div
            className="absolute top-4 right-4 w-36 h-24 rounded-xl border border-white/20 overflow-hidden flex items-center justify-center"
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
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: "bold",
                    color: "white",
                    margin: "0 auto",
                  }}
                >
                  ME
                </div>
                <p className="text-white/40 text-xs mt-1">You</p>
              </div>
            )}
          </div>
        </div>

        {/* Patient info panel */}
        <div
          className="hidden lg:flex w-80 flex-col border-l border-white/10 overflow-y-auto"
          style={{ background: "#111827" }}
        >
          <div className="p-4 border-b border-white/10">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">
              Patient Information
            </p>
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: BLUE,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "white",
                  fontSize: 14,
                }}
              >
                JD
              </div>
              <div>
                <p className="text-white text-sm font-semibold">John Doe</p>
                <p className="text-white/40 text-xs">Patient · 34 yrs</p>
              </div>
            </div>
          </div>
          {[
            { title: "Reason", content: "General Consultation" },
            {
              title: "Symptoms",
              content: "Headache, fatigue, dizziness — 5 days · Moderate",
            },
            {
              title: "History",
              content: "No reported conditions. Allergies: None.",
            },
            { title: "Medications", content: "Paracetamol 500mg · 2× daily" },
            {
              title: "Documents",
              content: "Blood_Test.pdf · Prescription.jpg",
            },
          ].map((s) => (
            <div key={s.title} className="p-4 border-b border-white/10">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1.5">
                {s.title}
              </p>
              <p className="text-white/75 text-xs leading-relaxed">
                {s.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div
        className="flex items-center justify-between px-6 py-4 border-t border-white/10"
        style={{ background: "#070d1a" }}
      >
        <div className="flex items-center gap-2">
          {controls.map((c) => (
            <button
              key={c.label}
              onClick={c.onClick}
              className="flex flex-col items-center justify-center gap-1 w-16 py-2 rounded-none transition-all hover:bg-white/10 cursor-pointer"
              style={c.active ? { background: "rgba(239,68,68,0.18)" } : {}}
            >
              <div className="flex items-center justify-center h-6">
                {c.icon}
              </div>
              <span className="text-[10px] text-white/50">{c.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onEnd}
          className="px-6 py-3 rounded-none font-bold text-sm text-white transition-all hover:brightness-110 cursor-pointer shadow-md"
          style={{ background: "#dc2626" }}
        >
          End Consultation
        </button>
      </div>
    </div>
  )
}

// ─── Screen 10: Consultation Summary ──────────────────────────────────────────

function ScreenSummary({ doc, onClose }: { doc: Doctor onClose: () => void }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold" style={{ color: NAVY }}>
          Consultation Summary
        </h2>
        <span
          className="text-xs px-3 py-1.5 rounded-full font-bold inline-flex items-center gap-1.5"
          style={{ background: "#dcfce7", color: GREEN }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed</span>
        </span>
      </div>

      <Card className="p-5 flex items-center gap-4 mb-5">
        <Avatar initials={doc.avatar} color={doc.color} size={52} />
        <div>
          <p className="font-bold text-gray-900">{doc.name}</p>
          <p className="text-sm text-gray-500">{doc.specialty}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm font-semibold text-gray-800">
            September 16, 2026
          </p>
          <p className="text-xs text-gray-400">Video Consultation</p>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-3">
            Consultation Notes
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Patient presented with 5-day history of headache, fatigue, and
            dizziness. No fever or vomiting. Vital signs within normal limits:
            BP 118/76, PR 74, SpO₂ 99%, Temp 36.8°C. Neurological examination
            unremarkable. Assessment: tension-type headache with mild
            dehydration. Advised adequate rest, oral rehydration, and pain
            relief as needed.
          </p>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Diagnosis</h3>
          <div className="space-y-2">
            {["Tension-type headache (G44.2)", "Mild dehydration (E86.0)"].map(
              (d) => (
                <div
                  key={d}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
                >
                  <Activity className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-blue-800">
                    {d}
                  </span>
                </div>
              ),
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Prescription</h3>
          <div className="space-y-3">
            {[
              {
                name: "Paracetamol",
                dose: "500 mg",
                freq: "Every 6 hours as needed",
                dur: "5 days",
                note: "Take with food. Max 4g/day.",
              },
              {
                name: "ORS sachets",
                dose: "1 sachet",
                freq: "3× daily or after each loose stool",
                dur: "3 days",
                note: "Dissolve in 200ml clean water.",
              },
            ].map((med) => (
              <div
                key={med.name}
                className="p-4 rounded-xl border border-gray-100 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-blue-600" />
                    <span>{med.name}</span>
                  </p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "#dcfce7", color: GREEN }}
                  >
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                  <span>
                    Dosage:{" "}
                    <strong className="text-gray-700">{med.dose}</strong>
                  </span>
                  <span>
                    Duration:{" "}
                    <strong className="text-gray-700">{med.dur}</strong>
                  </span>
                  <span className="col-span-2">
                    Frequency:{" "}
                    <strong className="text-gray-700">{med.freq}</strong>
                  </span>
                </div>
                <p
                  className="text-xs mt-2 px-2 py-1.5 rounded-lg flex items-center gap-1.5"
                  style={{ background: "#fffbeb", color: "#92400e" }}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>{med.note}</span>
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-3">
            Doctor's Recommendations
          </h3>
          <ul className="space-y-2">
            {[
              "Increase daily water intake to at least 2.5 L",
              "Rest for 48 hours — avoid strenuous activity",
              "Limit prolonged screen time",
              "Return if headache persists beyond 7 days or worsens",
            ].map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <Check className="w-3.5 h-3.5 text-sky-500 mt-0.5 flex-shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-gray-800">Follow-up</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                In 2 weeks — Monday, October 6, 2026
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                If symptoms persist or worsen
              </p>
            </div>
            <Btn onClick={onClose}>Schedule Follow-up</Btn>
          </div>
        </Card>
      </div>

      <div className="flex gap-3 mt-6">
        <Btn variant="outline" onClick={onClose}>
          Download PDF
        </Btn>
        <Btn onClick={onClose}>Return to Dashboard</Btn>
      </div>
    </div>
  )
}

// ─── Screen 11: Medical Records ────────────────────────────────────────────────

function ScreenRecords({ onBack }: { onBack: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(0)
  const [filter, setFilter] = useState("All")

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
            Complete consultation history from Healthitude.
          </p>
        </div>
        <Btn variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Back</span>
        </Btn>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {["All", "2026", "General", "Follow-up", "Specialist"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
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
        ))}
      </div>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
        <div className="space-y-5">
          {RECORDS.map((r, i) => (
            <div key={i} className="relative pl-14">
              <div
                className="absolute left-3.5 top-5 w-3 h-3 rounded-full border-2 border-white"
                style={{ background: BLUE }}
              />
              <Card className="overflow-hidden hover:border-blue-200 transition-all">
                <button
                  className="w-full p-5 text-left"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{r.date}</p>
                      <p className="font-bold text-gray-800">{r.type}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {r.doctor} · {r.specialty}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "#dcfce7", color: GREEN }}
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
                    {[
                      { l: "Diagnosis", v: r.diagnosis },
                      { l: "Prescription", v: r.prescription },
                      { l: "Clinical Notes", v: r.notes },
                    ].map((row) => (
                      <div key={row.l}>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {row.l}
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {row.v}
                        </p>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <Btn variant="outline">View Full Details</Btn>
                      <Btn variant="outline">Download PDF</Btn>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Flow orchestrator ─────────────────────────────────────────────────────────

type Screen = "find" | "profile" | "reason" | "intake" | "schedule" | "review" | "confirmed" | "upcoming" | "video" | "summary" | "records"

const FLOW: Screen[] = [
  "find",
  "profile",
  "reason",
  "intake",
  "schedule",
  "review",
  "confirmed",
  "upcoming",
  "video",
  "summary",
]
const LABELS: Record<Screen, string> = {
  find: "Find Doctor",
  profile: "Profile",
  reason: "Reason",
  intake: "Intake",
  schedule: "Schedule",
  review: "Review",
  confirmed: "Confirmed",
  upcoming: "Upcoming",
  video: "Consultation",
  summary: "Summary",
  records: "Records",
}

export default function TelemedicinePage() {
  const [screen, setScreen] = useState<Screen>("find")
  const [doctor, setDoctor] = useState<Doctor>(DOCTORS[0])
  const [reason, setReason] = useState("general")
  const [date, setDate] = useState("Mon 15")
  const [time, setTime] = useState("2:30 PM")

  const go = (s: Screen) => {
    setScreen(s)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Full-screen video takes over completely
  if (screen === "video") {
    return <ScreenVideo doc={doctor} onEnd={() => go("summary")} />
  }

  const flowIdx = FLOW.indexOf(screen)

  return (
    <div className="min-h-screen" style={{ background: "#f7f9ff" }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="w-[88%] max-w-7xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-2 lg:grid-cols-[180px_1fr_220px] items-center gap-4">
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="inline-flex items-center">
              <img
                src={logoBlue}
                alt="Healthitude"
                className="h-8 object-contain"
              />
            </Link>
          </div>
          <div className="hidden lg:flex items-center justify-center gap-1 overflow-x-auto">
            {FLOW.filter((s) => s !== "video").map((s, i) => {
              const active = s === screen
              const past = FLOW.indexOf(screen) > i
              return (
                <div key={s} className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => past && go(s)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    style={
                      active
                        ? { color: BLUE }
                        : past
                          ? { color: "#6b7280" }
                          : { color: "#d1d5db", cursor: "default" }
                    }
                  >
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                      style={{
                        background: active
                          ? BLUE
                          : past
                            ? "#e5e7eb"
                            : "transparent",
                        color: active ? "white" : past ? "#374151" : "#d1d5db",
                        border: active || past ? "none" : "1px solid #e5e7eb",
                      }}
                    >
                      {past ? (
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    {LABELS[s]}
                  </button>
                  {i < FLOW.length - 2 && (
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-end gap-2.5 flex-shrink-0">
            <button
              onClick={() => go("records")}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>My Records</span>
            </button>
            <Link
              to="/patient/dashboard"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white transition-all hover:bg-blue-800 shadow-xs cursor-pointer"
              style={{ background: BLUE }}
            >
              Dashboard
            </Link>
          </div>
        </div>
        {/* Mobile progress bar */}
        {flowIdx >= 0 && (
          <div className="h-0.5 bg-gray-100">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${((flowIdx + 1) / FLOW.length) * 100}%`,
                background: BLUE,
              }}
            />
          </div>
        )}
      </nav>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16">
        {screen === "find" && (
          <ScreenFind
            onSelect={(d) => {
              setDoctor(d)
              go("profile")
            }}
          />
        )}
        {screen === "profile" && (
          <ScreenProfile
            doc={doctor}
            onBook={() => go("reason")}
            onBack={() => go("find")}
          />
        )}
        {screen === "reason" && (
          <ScreenReason
            onNext={(r) => {
              setReason(r)
              go("intake")
            }}
            onBack={() => go("profile")}
          />
        )}
        {screen === "intake" && (
          <ScreenIntake
            onDone={() => go("schedule")}
            onBack={() => go("reason")}
          />
        )}
        {screen === "schedule" && (
          <ScreenSchedule
            doc={doctor}
            onNext={(d, t) => {
              setDate(d)
              setTime(t)
              go("review")
            }}
            onBack={() => go("intake")}
          />
        )}
        {screen === "review" && (
          <ScreenReview
            doc={doctor}
            date={date}
            time={time}
            reason={reason}
            onConfirm={() => go("confirmed")}
            onBack={() => go("schedule")}
          />
        )}
        {screen === "confirmed" && (
          <ScreenConfirmed
            doc={doctor}
            date={date}
            time={time}
            onDone={() => go("upcoming")}
          />
        )}
        {screen === "upcoming" && (
          <ScreenUpcoming
            doc={doctor}
            date={date}
            time={time}
            onJoin={() => go("video")}
          />
        )}
        {screen === "summary" && (
          <ScreenSummary doc={doctor} onClose={() => go("find")} />
        )}
        {screen === "records" && <ScreenRecords onBack={() => go("find")} />}
      </main>
    </div>
  )
}
