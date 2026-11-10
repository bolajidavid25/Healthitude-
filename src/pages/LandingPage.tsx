import { useState, useEffect, useRef } from "react"
import { Link } from "react-router"
import logoBlue from "@/imports/Screenshot_2026-09-14_184508-removebg-preview.png"
import logoWhite from "@/imports/Screenshot_2026-09-14_184307-removebg-preview.png"
import AngitiaIcon from "@/components/AngitiaIcon"
import {
  User,
  Stethoscope,
  Users,
  Zap,
  Building2,
  Microscope,
  AlertTriangle,
  Pill,
  Shield,
  Droplets,
  Scale,
  Clock,
  Heart,
  Baby,
  Syringe,
  FlaskConical,
  BarChart3,
  Globe,
  Smartphone,
  Bot,
  HeartPulse,
  ChevronRight,
  ArrowRight,
  X,
  Menu,
  Video,
  FileText,
  GitBranch,
  Send,
  Check,
  AlertCircle,
} from "lucide-react"

const BLUE = "#1a3fcf"
const NAVY = "#0d1b4b"
const SKY = "#0ea5e9"

// ── Navbar ──────────────────────────────────────────────────────────────────

type PortalMode = "signin" | "register"

function PortalPicker({
  mode,
  onClose,
}: {
  mode: PortalMode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3
            className="font-display text-lg font-bold"
            style={{ color: NAVY }}
          >
            {mode === "signin" ? "Sign in as…" : "Get started as…"}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-none hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <Link
          to={mode === "signin" ? "/patient/login" : "/patient/register"}
          onClick={onClose}
          className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-150 shadow-sm group"
        >
          <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">Patient</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Access your records, appointments, and prescriptions
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          to={
            mode === "signin" ? "/professional/login" : "/professional/register"
          }
          onClick={onClose}
          className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50/40 transition-all duration-150 shadow-sm group"
        >
          <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors">
            <Stethoscope className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">
              Healthcare Professional
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              For doctors, nurses, pharmacists & administrators
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-0.5 transition-all" />
        </Link>

        {mode === "signin" ? (
          <p className="text-center text-xs text-gray-400 pt-1">
            No account yet?{" "}
            <Link
              to="/patient/register"
              className="text-blue-600 hover:underline font-medium"
              onClick={onClose}
            >
              Get started free
            </Link>
          </p>
        ) : (
          <p className="text-center text-xs text-gray-400 pt-1">
            Already have an account?{" "}
            <Link
              to="/patient/login"
              className="text-blue-600 hover:underline font-medium"
              onClick={onClose}
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [picker, setPicker] = useState<PortalMode | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const links = [
    { label: "About", href: "#about" },
    { label: "Services", href: "#services" },
    { label: "Telemedicine", href: "#telemedicine" },
    { label: "For Professionals", href: "#professionals" },
    { label: "Blog", href: "#blog" },
  ]

  return (
    <>
      {picker && <PortalPicker mode={picker} onClose={() => setPicker(null)} />}

      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-3"
        style={{
          background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
          boxShadow: scrolled ? "0 1px 20px rgba(13,27,75,0.06)" : "none",
          backdropFilter: scrolled ? "blur(12px)" : "none",
        }}
      >
        <div className="w-[88%] max-w-7xl mx-auto px-4 sm:px-6 py-2.5 grid grid-cols-2 md:grid-cols-[200px_1fr_220px] items-center gap-4">
          {/* Left: Branding */}
          <div className="flex items-center flex-shrink-0">
            <a href="#top" className="flex items-center">
              <img
                src={scrolled ? logoBlue : logoWhite}
                alt="Healthitude"
                className="h-9 object-contain transition-all duration-300"
              />
            </a>
          </div>

          {/* Center: Primary Navigation (strictly horizontally centered) */}
          <div className="hidden md:flex items-center justify-center gap-8">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium transition-colors duration-150"
                style={{ color: scrolled ? NAVY : "rgba(255,255,255,0.92)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = scrolled ? BLUE : "#ffffff")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = scrolled
                    ? NAVY
                    : "rgba(255,255,255,0.92)")
                }
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right: Actions on Desktop */}
          <div className="hidden md:flex items-center justify-end gap-3">
            <button
              onClick={() => setPicker("signin")}
              className={scrolled ? "btn-fill-slide !text-sm !py-2 !px-4" : "btn-fill-slide-dark !text-sm !py-2 !px-4"}
            >
              Sign In
            </button>
            <button
              onClick={() => setPicker("register")}
              className="btn-glow !text-sm !py-2 !px-4 font-semibold text-white"
            >
              Get Started
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden justify-end">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg cursor-pointer"
              style={{ color: scrolled ? NAVY : "white" }}
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3 shadow-lg">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium text-gray-700 hover:text-blue-700 py-1.5 transition-colors"
              >
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setMenuOpen(false)
                  setPicker("signin")
                }}
                className="btn-underline flex-1 justify-center"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  setPicker("register")
                }}
                className="btn-glow flex-1 justify-center font-semibold text-white"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const [picker, setPicker] = useState<PortalMode | null>(null)
  return (
    <>
      {picker && <PortalPicker mode={picker} onClose={() => setPicker(null)} />}
      <section
        id="top"
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #1a3fcf 55%, #0ea5e9 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute top-20 right-10 w-80 h-80 rounded-full opacity-10"
          style={{ background: SKY, filter: "blur(80px)" }}
        />
        <div
          className="absolute bottom-20 left-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: BLUE, filter: "blur(60px)" }}
        />

        <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-20 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
              style={{
                borderColor: "rgba(255,255,255,0.25)",
                color: "rgba(255,255,255,0.85)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Now in Phase 1 · Trusted by 12,000+ patients
            </div>
            <h1 className="font-display text-5xl lg:text-6xl font-bold text-white leading-tight">
              Your Health,
              <br />
              <span style={{ color: "#7dd3fc" }}>Continuous</span>
              <br />
              &amp; Connected.
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-xl">
              Healthitude brings patients, doctors, nurses, pharmacists, and
              administrators onto one secure platform — making healthcare
              continuity the standard, not the exception.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setPicker("register")}
                className="btn-glow px-7 py-3.5 text-sm font-bold text-white shadow-lg"
              >
                Get Started Free
              </button>
              <button
                onClick={() => setPicker("signin")}
                className="btn-fill-slide-dark px-7 py-3.5 text-sm font-semibold"
              >
                Sign In
              </button>
            </div>
            <div className="flex items-center gap-5 text-xs text-white/50">
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                HIPAA-compliant infrastructure
              </span>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              style={{ aspectRatio: "4/3" }}
            >
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop&auto=format"
                alt="Doctor using Healthitude platform"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(13,27,75,0.5) 0%, transparent 60%)",
                }}
              />
            </div>
            <div className="absolute -left-8 top-8 bg-white rounded-xl shadow-xl p-3 flex items-center gap-3 border border-gray-100">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "#dcfce7" }}
              >
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Verified Professionals</p>
                <p className="font-bold text-gray-800 text-sm">1,840+</p>
              </div>
            </div>
            <div className="absolute -right-6 bottom-16 bg-white rounded-xl shadow-xl p-3 flex items-center gap-3 border border-gray-100">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "#dbeafe" }}
              >
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Patients Served</p>
                <p className="font-bold text-gray-800 text-sm">12,000+</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full"
          >
            <path
              d="M0 80L1440 80L1440 20C1200 80 960 0 720 40C480 80 240 20 0 60L0 80Z"
              fill="#f7f9ff"
            />
          </svg>
        </div>
      </section>
    </>
  )
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function Stats() {
  const stats = [
    {
      value: "12,000+",
      label: "Active Patients",
      icon: <Users className="w-5 h-5 text-blue-600" />,
    },
    {
      value: "1,840+",
      label: "Verified Professionals",
      icon: <Stethoscope className="w-5 h-5 text-blue-600" />,
    },
    {
      value: "99.9%",
      label: "Platform Uptime",
      icon: <Zap className="w-5 h-5 text-blue-600" />,
    },
    {
      value: "40+",
      label: "Pharmaceutical Partners",
      icon: <Building2 className="w-5 h-5 text-blue-600" />,
    },
    {
      value: "6",
      label: "Healthcare Specialties",
      icon: <Microscope className="w-5 h-5 text-blue-600" />,
    },
    {
      value: "24/7",
      label: "Emergency Break-Glass",
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
    },
  ]

  return (
    <section className="py-16 px-6" style={{ background: "#f7f9ff" }}>
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm text-center space-y-2 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 mx-auto rounded-lg bg-blue-50 flex items-center justify-center">
              {s.icon}
            </div>
            <p
              className="text-2xl font-bold font-display"
              style={{ color: BLUE }}
            >
              {s.value}
            </p>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── What We Do ────────────────────────────────────────────────────────────────

function WhatWeDo() {
  const [flippedCard, setFlippedCard] = useState<number | null>(null)

  const pillars = [
    {
      index: "01",
      tag: "Continuity",
      icon: <FileText className="w-10 h-10 text-white stroke-[1.8]" />,
      title: "Continuous Clinical Records",
      body: "Your health history travels with you. Verified clinical records created by qualified professionals — always accessible, never lost between providers.",
      benefit: "Secure, audited & provider-portable",
    },
    {
      index: "02",
      tag: "Telemedicine",
      icon: <Video className="w-10 h-10 text-white stroke-[1.8]" />,
      title: "Telemedicine, Anytime",
      body: "Consult a verified doctor from your home. Video and in-person consultations available — no waiting rooms, no lost referrals.",
      benefit: "Encrypted HD video & instant chat",
    },
    {
      index: "03",
      tag: "Pharmacy",
      icon: <Pill className="w-10 h-10 text-white stroke-[1.8]" />,
      title: "Prescription & Medication",
      body: "Digital prescriptions issued by your doctor, tracked adherence, refill reminders, and direct access to verified pharmacists.",
      benefit: "Formulary-checked & refill reminders",
    },
    {
      index: "04",
      tag: "Emergency",
      icon: <HeartPulse className="w-10 h-10 text-white stroke-[1.8]" />,
      title: "Break-Glass Emergency Access",
      body: "In a genuine emergency, instantly connect with a verified nearby doctor. A controlled health snapshot is shared automatically — no prior relationship required.",
      benefit: "Instant verified responder matching",
    },
  ]

  const toggleFlip = (i: number) => {
    setFlippedCard((prev) => (prev === i ? null : i))
  }

  return (
    <section id="about" className="py-24 px-6 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-16">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: BLUE }}
          >
            What We Do
          </span>
          <h2
            className="font-display text-4xl font-bold mt-3 mb-5"
            style={{ color: NAVY }}
          >
            Healthcare continuity is
            <br />
            our core promise.
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Healthitude is not just another app. It is an infrastructure layer
            for healthcare — connecting every role in the care chain onto one
            secure, audited, and patient-centered platform.
          </p>
        </div>

        {/* 3D Flip Card Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, i) => {
            const isFlipped = flippedCard === i
            return (
              <div
                key={p.index}
                className={`flip-card-container h-[350px] w-full cursor-pointer select-none group ${
                  isFlipped ? "is-flipped" : ""
                }`}
                onClick={() => toggleFlip(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    toggleFlip(i)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Flip ${p.title} card for details`}
              >
                <div className="flip-card-inner">
                  {/* FRONT SIDE: Blue Background + White Icon & White Text */}
                  <div
                    className="flip-card-front border border-blue-600/40 group-hover:border-blue-400 shadow-md group-hover:shadow-xl transition-all p-7 flex flex-col items-center justify-between text-center rounded-none text-white"
                    style={{ backgroundColor: BLUE }}
                  >
                    {/* Top Tag & Index */}
                    <div className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-100/90">
                      <span>{p.tag}</span>
                      <span className="text-white font-mono font-bold">{p.index}</span>
                    </div>

                    {/* Prominent Center: Bigger White Icon & Subtopic */}
                    <div className="flex flex-col items-center my-auto">
                      <div className="w-20 h-20 bg-white/15 border border-white/25 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 rounded-none text-white backdrop-blur-sm">
                        {p.icon}
                      </div>
                      <h3 className="font-display text-xl font-bold mt-5 leading-snug px-2 text-white">
                        {p.title}
                      </h3>
                    </div>

                    {/* Bottom Flip Cue */}
                    <div className="w-full pt-3 border-t border-white/20 flex items-center justify-center gap-1.5 text-xs text-blue-100 group-hover:text-white transition-colors">
                      <span>Hover or tap to flip</span>
                      <span className="text-sm">↻</span>
                    </div>
                  </div>

                  {/* BACK SIDE: Subtopic + Full Explanation */}
                  <div className="flip-card-back bg-white border border-blue-400 border-t-4 border-t-[#1a3fcf] shadow-lg p-7 flex flex-col justify-between text-left rounded-none">
                    <div>
                      {/* Top Meta */}
                      <div className="flex items-center justify-between mb-3 text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-[#1a3fcf]">{p.tag}</span>
                        <span className="text-gray-400 font-mono">{p.index}</span>
                      </div>

                      {/* Subtopic */}
                      <h3
                        className="font-display text-lg font-bold"
                        style={{ color: NAVY }}
                      >
                        {p.title}
                      </h3>

                      {/* Detailed Explanation */}
                      <p className="text-sm text-gray-600 leading-relaxed mt-4">
                        {p.body}
                      </p>
                    </div>

                    {/* Bottom Highlight & Flip-back cue */}
                    <div className="pt-4 border-t border-gray-100 mt-4">
                      <div className="text-[11px] font-semibold text-blue-700 bg-blue-50/80 px-2.5 py-1.5 border border-blue-100 inline-block mb-3 rounded-none">
                        ✓ {p.benefit}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1 text-[#1a3fcf] font-medium">
                          Learn more <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-gray-400">↻ Flip</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── About Us ──────────────────────────────────────────────────────────────────

function AboutUs() {
  return (
    <section
      className="py-24 px-6 overflow-hidden"
      style={{ background: "#f7f9ff" }}
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
        <div className="relative">
          <div
            className="rounded-2xl overflow-hidden shadow-xl"
            style={{ aspectRatio: "5/4" }}
          >
            <img
              src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=700&h=560&fit=crop&auto=format"
              alt="Healthitude medical team"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-5 border border-gray-100 max-w-xs">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: BLUE }}
              >
                H
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  Healthitude Mission
                </p>
                <p className="text-xs text-gray-400">
                  Founded 2024 · Accra, Ghana
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              "To make healthcare continuity the baseline expectation for every
              patient — regardless of where they seek care."
            </p>
          </div>
        </div>

        <div className="space-y-7">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: BLUE }}
            >
              About Us
            </span>
            <h2
              className="font-display text-4xl font-bold mt-3 mb-5"
              style={{ color: NAVY }}
            >
              Built for a healthcare
              <br />
              system that works.
            </h2>
          </div>
          <p className="text-gray-500 leading-relaxed">
            Healthitude was founded by clinicians and technologists who
            experienced firsthand how fragmented healthcare records,
            disconnected professionals, and opaque pricing cause real harm to
            real patients.
          </p>
          <p className="text-gray-500 leading-relaxed">
            We built a platform where every clinical interaction is recorded,
            every verified professional is reachable, and every patient —
            regardless of their billing category — receives continuity of care.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "Patient-first design",
                desc: "Every feature starts with patient safety and dignity.",
              },
              {
                label: "Professional-grade verification",
                desc: "Only licensed, verified professionals hold clinical privileges.",
              },
              {
                label: "Audited at every step",
                desc: "Every access, every record, every emergency — logged.",
              },
              {
                label: "Open to all billing types",
                desc: "NHIS, Insurance, Civil Servant, General — everyone is covered.",
              },
            ].map((v) => (
              <div key={v.label} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#dcfce7" }}
                >
                  <svg
                    className="w-3 h-3 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {v.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/patient/register"
            className="btn-send px-6 py-3 font-semibold text-white"
          >
            <span>Join Healthitude Today</span>
            <ArrowRight className="w-4 h-4 btn-arrow" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Services ──────────────────────────────────────────────────────────────────

function Services() {
  const services = [
    {
      badge: "Live",
      badgeType: "blue" as const,
      title: "Video Telemedicine",
      desc: "Consult a verified doctor from anywhere. Secure video sessions, appointment scheduling, and full visit documentation.",
      icon: <Video className="w-6 h-6 text-blue-600" />,
    },
    {
      badge: "Core",
      badgeType: "blue" as const,
      title: "Clinical Records",
      desc: "Verified clinical records by your care team — vitals, diagnoses, lab results, treatment notes — all in one place.",
      icon: <FileText className="w-6 h-6 text-blue-600" />,
    },
    {
      badge: "Core",
      badgeType: "blue" as const,
      title: "Prescriptions & Medications",
      desc: "Digital prescriptions from verified doctors, adherence tracking, refill reminders, and pharmacist review.",
      icon: <Pill className="w-6 h-6 text-blue-600" />,
    },
    {
      badge: "Core",
      badgeType: "blue" as const,
      title: "Complaint → Referral Flow",
      desc: "Submit a complaint to your primary doctor. If specialist care is needed, your records travel with the referral.",
      icon: <GitBranch className="w-6 h-6 text-blue-600" />,
    },
    {
      badge: "Beta",
      badgeType: "purple" as const,
      title: "AI Angitia",
      desc: "Ask health questions, understand your records, prepare for doctor visits. Educational only — not a diagnosis.",
      icon: <Bot className="w-6 h-6 text-purple-600" />,
    },
    {
      badge: "Critical",
      badgeType: "red" as const,
      title: "Break-Glass Emergency",
      desc: "Genuine emergency? Instantly alert verified nearby doctors. A controlled health snapshot is shared automatically.",
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
    },
  ]

  return (
    <section id="services" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: BLUE }}
          >
            Our Services
          </span>
          <h2
            className="font-display text-4xl font-bold mt-3 mb-5"
            style={{ color: NAVY }}
          >
            Everything your health journey needs.
          </h2>
          <p className="text-gray-500 leading-relaxed">
            From your first complaint to ongoing prescriptions and emergency
            care — Healthitude covers the full care cycle.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <div
              key={i}
              className="group rounded-xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md hover:border-blue-200 transition-all duration-150 bg-white"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    s.badgeType === "red"
                      ? "bg-red-50"
                      : s.badgeType === "purple"
                        ? "bg-purple-50"
                        : "bg-blue-50"
                  }`}
                >
                  {s.icon}
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    s.badgeType === "red"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : s.badgeType === "purple"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {s.badge}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-base mb-2">
                {s.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Telemedicine ──────────────────────────────────────────────────────────────

function Telemedicine() {
  const steps = [
    {
      n: "01",
      title: "Find your provider",
      desc: "Browse verified doctors by specialty, location, and availability.",
    },
    {
      n: "02",
      title: "Choose your reason",
      desc: "Tell us why you're visiting — general consult, follow-up, maternal care, or more.",
    },
    {
      n: "03",
      title: "Complete your intake",
      desc: "Fill in your symptoms, duration, and attach relevant documents before the visit.",
    },
    {
      n: "04",
      title: "Consult & receive care",
      desc: "Video or in-person session. Records, diagnosis, and prescriptions added instantly.",
    },
  ]

  return (
    <section
      id="telemedicine"
      className="py-24 px-6 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, #1a3fcf 100%)`,
      }}
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-8">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#7dd3fc" }}
            >
              Telemedicine
            </span>
            <h2 className="font-display text-4xl font-bold mt-3 text-white leading-tight">
              See a doctor without
              <br />
              leaving your home.
            </h2>
            <p className="text-white/60 mt-4 leading-relaxed">
              Healthitude telemedicine connects you to a verified, licensed
              doctor in minutes. No commute. No waiting room. Your records
              travel with you automatically.
            </p>
          </div>
          <div className="space-y-5">
            {steps.map((s) => (
              <div key={s.n} className="flex items-start gap-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#7dd3fc",
                  }}
                >
                  {s.n}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{s.title}</p>
                  <p className="text-white/55 text-sm mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/patient/register"
              className="btn-rise px-6 py-3 font-semibold text-white"
            >
              Book a Consultation
            </Link>
            <a
              href="#services"
              className="btn-fill-slide-dark px-6 py-3 font-medium"
            >
              View all services
            </a>
          </div>
        </div>
        <div className="relative hidden lg:block">
          <div
            className="rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{ aspectRatio: "4/3" }}
          >
            <img
              src="https://images.unsplash.com/photo-1588776814546-daab30f310ce?w=700&h=525&fit=crop&auto=format"
              alt="Doctor conducting telemedicine consultation"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute top-4 left-4 bg-white/95 rounded-xl p-3 shadow-lg flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            <p className="text-xs font-semibold text-gray-800">
              Dr. Ama Bentil is available now
            </p>
          </div>
          <div className="absolute bottom-4 right-4 bg-white/95 rounded-xl p-3 shadow-lg">
            <p className="text-xs text-gray-500 mb-1">Average wait time</p>
            <p className="text-lg font-bold" style={{ color: BLUE }}>
              {"< 8 min"}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── For Professionals ─────────────────────────────────────────────────────────

function ForProfessionals() {
  const roles = [
    {
      icon: <Stethoscope className="w-6 h-6 text-green-600" />,
      bg: "bg-green-50",
      title: "Doctors",
      desc: "Manage complaint queues, write clinical records, create referrals, and prescribe — all verified and audited.",
    },
    {
      icon: <HeartPulse className="w-6 h-6 text-sky-600" />,
      bg: "bg-sky-50",
      title: "Nurses",
      desc: "Record vitals, assist with clinical workflows, and coordinate care within your verified professional scope.",
    },
    {
      icon: <Pill className="w-6 h-6 text-purple-600" />,
      bg: "bg-purple-50",
      title: "Pharmacists",
      desc: "Review digital prescriptions, manage dispensing, and provide medication counselling to patients.",
    },
    {
      icon: <Shield className="w-6 h-6 text-rose-600" />,
      bg: "bg-rose-50",
      title: "Administrators",
      desc: "Manage professional verification, configure pricing plans, and oversee platform operations.",
    },
  ]

  return (
    <section
      id="professionals"
      className="py-24 px-6"
      style={{ background: "#f7f9ff" }}
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
        <div className="space-y-6">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: BLUE }}
            >
              For Professionals
            </span>
            <h2
              className="font-display text-4xl font-bold mt-3 mb-5"
              style={{ color: NAVY }}
            >
              A platform built around
              <br />
              your clinical workflow.
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Healthitude is not just for patients. Every professional role has
              a tailored, verified workflow — with audit trails, credential
              management, and patient record access scoped to your permitted
              role.
            </p>
          </div>
          <div className="space-y-3">
            {[
              "Full credential verification before clinical access",
              "Patient records scoped to your verified specialty",
              "Complaint queue management and referral workflows",
              "Prescription creation with pharmacist handoff",
              "Professional public profile for patient discovery",
              "Ongoing licence renewal reminders and audit logs",
            ].map((f) => (
              <div
                key={f}
                className="flex items-center gap-3 text-sm text-gray-700"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {f}
              </div>
            ))}
          </div>
          <Link
            to="/professional/register"
            className="btn-send px-6 py-3 font-semibold text-white"
          >
            <span>Register as a Professional</span>
            <ArrowRight className="w-4 h-4 btn-arrow" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {roles.map((r) => (
            <div
              key={r.title}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-blue-100 transition-all"
            >
              <div
                className={`w-11 h-11 rounded-lg ${r.bg} flex items-center justify-center mb-3`}
              >
                {r.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{r.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Pharmaceutical Partners ───────────────────────────────────────────────────

function PharmaceuticalPartners() {
  const partners: { name: string; logo: string }[] = [
    { name: "Pfizer", logo: "/logos/pfizer.png" },
    { name: "Roche", logo: "/logos/roche.svg" },
    { name: "Novartis", logo: "/logos/novartis.png" },
    { name: "AstraZeneca", logo: "/logos/astrazeneca.png" },
    { name: "Sanofi", logo: "/logos/sanofi.svg" },
    { name: "GlaxoSmithKline", logo: "/logos/gsk.png" },
    { name: "Merck", logo: "/logos/merck.png" },
    { name: "Abbott", logo: "/logos/abbott.png" },
    { name: "Emzor Pharma", logo: "/logos/emzor.png" },
    { name: "May & Baker", logo: "/logos/may-and-baker.png" },
  ]

  // Render a partner card without border
  const renderCard = (p: { name: string; logo: string }, key: string) => (
    <div
      key={key}
      className="h-20 w-44 sm:w-48 md:w-52 shrink-0 rounded-none flex items-center justify-center p-3.5 transition-all duration-200 cursor-pointer bg-transparent group/card select-none"
    >
      <img
        src={p.logo}
        alt={p.name}
        className="max-h-10 sm:max-h-11 max-w-[130px] w-auto h-auto object-contain transition-all duration-300 filter grayscale opacity-75 group-hover/card:grayscale-0 group-hover/card:opacity-100 group-hover/card:scale-105"
        loading="lazy"
      />
    </div>
  )

  return (
    <section className="py-20 bg-white border-y border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center mb-12">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: BLUE }}
        >
          Verified Partners
        </span>
        <h2
          className="font-display text-3xl font-bold mt-3"
          style={{ color: NAVY }}
        >
          Backed by trusted pharmaceutical companies.
        </h2>
        <p className="text-gray-400 mt-3 text-sm max-w-2xl mx-auto">
          Our formulary and pharmaceutical partnerships are reviewed and
          approved by qualified pharmacists.
        </p>
      </div>

      {/* Infinite loop marquee track */}
      <div className="relative w-full overflow-hidden group">
        {/* Left & Right gradient edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 md:w-40 z-10 pointer-events-none bg-gradient-to-r from-white via-white/80 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 md:w-40 z-10 pointer-events-none bg-gradient-to-l from-white via-white/80 to-transparent" />

        {/* Marquee container with two identical sets for seamless continuous loop */}
        <div className="flex animate-marquee py-2">
          {/* First set */}
          <div className="flex items-center gap-4 sm:gap-6 pr-4 sm:pr-6 shrink-0">
            {partners.map((p, idx) => renderCard(p, `marquee-1-${idx}`))}
          </div>

          {/* Second identical set for seamless infinite loop */}
          <div className="flex items-center gap-4 sm:gap-6 pr-4 sm:pr-6 shrink-0" aria-hidden="true">
            {partners.map((p, idx) => renderCard(p, `marquee-2-${idx}`))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-xs text-gray-400 mt-8">
          Partner logos are representative. Formal partnership agreements are
          governed by Healthitude's pharmaceutical review process.
        </p>
      </div>
    </section>
  )
}

// ── Health Tools ──────────────────────────────────────────────────────────────

function HealthTools() {
  const tools = [
    {
      icon: <Droplets className="w-6 h-6 text-red-500" />,
      title: "Blood Group Compatibility",
      desc: "Quickly check blood type compatibility for transfusion or donation scenarios.",
    },
    {
      icon: <Scale className="w-6 h-6 text-blue-500" />,
      title: "BMI Calculator",
      desc: "Calculate Body Mass Index and understand what your result means for your health.",
    },
    {
      icon: <Clock className="w-6 h-6 text-amber-500" />,
      title: "Medication Reminder Planner",
      desc: "Set up a personal medication schedule and get daily reminders from the Healthitude app.",
    },
    {
      icon: <Heart className="w-6 h-6 text-rose-500" />,
      title: "Heart Rate Zone Guide",
      desc: "Understand your target heart rate zones for rest, cardio, and peak exertion.",
    },
    {
      icon: <Baby className="w-6 h-6 text-indigo-500" />,
      title: "Due Date Calculator",
      desc: "Estimate your pregnancy due date and get a trimester-by-trimester health guide.",
    },
    {
      icon: <Syringe className="w-6 h-6 text-teal-500" />,
      title: "Vaccination Tracker",
      desc: "Track your immunisation history and get reminders for upcoming vaccinations.",
    },
  ]

  return (
    <section className="py-24 px-6" style={{ background: "#f7f9ff" }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: BLUE }}
          >
            Health Tools
          </span>
          <h2
            className="font-display text-4xl font-bold mt-3 mb-4"
            style={{ color: NAVY }}
          >
            Free tools for a healthier life.
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Educational health tools designed with clinician input — available
            to all Healthitude users, free of charge.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((t) => (
            <button
              key={t.title}
              className="group text-left bg-white rounded-none border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center mb-4">
                {t.icon}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900">{t.title}</h3>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">{t.desc}</p>
            </button>
          ))}
        </div>
        <div className="text-center mt-8">
          <p className="text-sm text-gray-400">
            More health tools coming with Healthitude Phase 2.
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Blog / Health Tips ────────────────────────────────────────────────────────

function Blog() {
  const posts = [
    {
      category: "Telemedicine",
      title: "How telemedicine is changing primary care in West Africa",
      excerpt:
        "With smartphone penetration growing rapidly, patients in rural communities are accessing verified doctors for the first time. Here is what the data shows.",
      author: "Dr. Kofi Boateng",
      role: "General Practitioner",
      date: "Sep 10, 2026",
      readTime: "5 min read",
      img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop&auto=format",
    },
    {
      category: "Medication Safety",
      title:
        "Why your pharmacist is one of your most important healthcare allies",
      excerpt:
        "Pharmacists do far more than dispense medication. They review drug interactions, counsel patients, and flag dosing errors — often before they reach you.",
      author: "Pharm. Kwame Adu",
      role: "Clinical Pharmacist",
      date: "Aug 28, 2026",
      readTime: "4 min read",
      img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=400&fit=crop&auto=format",
    },
    {
      category: "Patient Health",
      title: "Understanding your clinical records: a patient's guide",
      excerpt:
        "Your clinical records belong to you. Knowing how to read vitals, lab results, and diagnoses helps you participate in your own care — and catch errors early.",
      author: "Dr. Efua Asante",
      role: "Cardiologist",
      date: "Aug 14, 2026",
      readTime: "6 min read",
      img: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop&auto=format",
    },
  ]

  return (
    <section id="blog" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: BLUE }}
            >
              Health Tips &amp; Blog
            </span>
            <h2
              className="font-display text-4xl font-bold mt-3"
              style={{ color: NAVY }}
            >
              Written by the professionals
              <br />
              who use the platform.
            </h2>
          </div>
          <button
            className="btn-fill-slide px-5 py-2.5 font-medium"
          >
            View all articles
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-7">
          {posts.map((p) => (
            <article
              key={p.title}
              className="group cursor-pointer rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all bg-white"
            >
              <div className="overflow-hidden" style={{ aspectRatio: "3/2" }}>
                <img
                  src={p.img}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5 space-y-3">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: BLUE }}
                >
                  {p.category}
                </span>
                <h3 className="font-display font-semibold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors">
                  {p.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                  {p.excerpt}
                </p>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: BLUE }}
                  >
                    {p.author.split(" ").slice(-1)[0][0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {p.author}
                    </p>
                    <p className="text-xs text-gray-400">
                      {p.date} · {p.readTime}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Testimonials ──────────────────────────────────────────────────────────────

function Testimonials() {
  const testimonials = [
    {
      quote:
        "Before Healthitude, I had to carry paper files to every hospital. Now my doctor sees my full history before I even sit down. That is what good healthcare should feel like.",
      name: "Ama Mensah",
      role: "Patient · NHIS User",
      initials: "AM",
    },
    {
      quote:
        "As a cardiologist, having access to a patient's verified medication history and previous test results before the consultation changes everything. Safer decisions, faster care.",
      name: "Dr. Efua Asante",
      role: "Cardiologist · Korle Bu Teaching Hospital",
      initials: "EA",
    },
    {
      quote:
        "The Break-Glass feature is genuinely life-saving in concept. A patient came in unconscious — we had their allergies, blood group, and current medications within seconds.",
      name: "Dr. Samuel Osei",
      role: "Emergency Medicine · 37 Military Hospital",
      initials: "SO",
    },
  ]

  return (
    <section className="py-24 px-6" style={{ background: "#f7f9ff" }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: BLUE }}
          >
            Testimonials
          </span>
          <h2
            className="font-display text-4xl font-bold mt-3"
            style={{ color: NAVY }}
          >
            Trusted by patients and
            <br />
            professionals alike.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-7">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-xl border border-gray-100 p-7 hover:shadow-md transition-all"
            >
              <svg
                className="w-8 h-8 mb-4 opacity-20"
                style={{ color: BLUE }}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-gray-600 leading-relaxed text-sm mb-6">
                {t.quote}
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: BLUE }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Roadmap ───────────────────────────────────────────────────────────────────

function Roadmap() {
  const upcoming = [
    {
      icon: <FlaskConical className="w-5 h-5 text-blue-600" />,
      label: "Lab result uploads & integration",
      phase: "Phase 2",
    },
    {
      icon: <Pill className="w-5 h-5 text-blue-600" />,
      label: "Pharmacy dispensing integration",
      phase: "Phase 2",
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
      label: "Population health analytics",
      phase: "Phase 2",
    },
    {
      icon: <Globe className="w-5 h-5 text-amber-600" />,
      label: "Multi-language support",
      phase: "Phase 3",
    },
    {
      icon: <Smartphone className="w-5 h-5 text-green-600" />,
      label: "Mobile app (iOS & Android)",
      phase: "Phase 4",
    },
    {
      icon: <Bot className="w-5 h-5 text-pink-600" />,
      label: "AI-powered symptom triage",
      phase: "Phase 5",
    },
  ]

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: BLUE }}
          >
            What's Next
          </span>
          <h2
            className="font-display text-3xl font-bold mt-3"
            style={{ color: NAVY }}
          >
            More coming in the next phase.
          </h2>
          <p className="text-gray-400 mt-3 text-sm max-w-xl mx-auto">
            Phase 1 is live. Here is a preview of what Healthitude is building
            next.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {upcoming.map((u) => {
            const badge: Record<string, { bg: string text: string }> = {
              "Phase 2": { bg: "#e8eeff", text: BLUE },
              "Phase 3": { bg: "#fef3c7", text: "#b45309" },
              "Phase 4": { bg: "#dcfce7", text: "#15803d" },
              "Phase 5": { bg: "#fce7f3", text: "#be185d" },
            }
            const b = badge[u.phase] ?? { bg: "#e8eeff", text: BLUE }
            return (
              <div
                key={u.label}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  {u.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{u.label}</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: b.bg, color: b.text }}
                  >
                    {u.phase}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── CTA ───────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section
      className="py-24 px-6"
      style={{ background: `linear-gradient(135deg, ${NAVY}, ${BLUE})` }}
    >
      <div className="max-w-3xl mx-auto text-center space-y-7">
        <h2 className="font-display text-4xl lg:text-5xl font-bold text-white leading-tight">
          Your health, connected.
          <br />
          Start today.
        </h2>
        <p className="text-white/60 text-lg leading-relaxed">
          Join 12,000+ patients and 1,840+ verified professionals on the
          platform built for healthcare continuity.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/patient/register"
            className="btn-glow px-8 py-3.5 text-sm font-bold text-white shadow-lg"
          >
            Register as a Patient
          </Link>
          <Link
            to="/professional/register"
            className="btn-underline-dark px-8 py-3.5 text-sm font-semibold"
          >
            Register as a Professional
          </Link>
        </div>
        <p className="text-white/40 text-xs">
          No credit card required · HIPAA-compliant · NDPC-registered · Free to
          get started
        </p>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  const cols = [
    {
      heading: "Platform",
      links: [
        "Patient Portal",
        "Professional Portal",
        "Telemedicine",
        "Clinical Records",
        "Prescriptions",
        "Break-Glass Emergency",
      ],
    },
    {
      heading: "Company",
      links: [
        "About Us",
        "Our Mission",
        "Careers",
        "Press & Media",
        "Contact Us",
      ],
    },
    {
      heading: "Resources",
      links: [
        "Health Blog",
        "Health Tools",
        "FAQs",
        "Developer API",
        "System Status",
      ],
    },
    {
      heading: "Legal",
      links: [
        "Privacy Policy",
        "Terms of Service",
        "Data Processing Agreement",
        "Cookie Policy",
        "NDPC Compliance",
      ],
    },
  ]

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-10 mb-14">
          <div className="md:col-span-1">
            <img
              src={logoBlue}
              alt="Healthitude"
              className="h-9 object-contain object-left mb-4"
            />
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              Healthcare continuity, for everyone. Built in Ghana.
            </p>
            <div className="flex gap-3">
              {["T", "L", "F", "I"].map((s) => (
                <div
                  key={s}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                >
                  <span className="text-xs text-gray-400">{s}</span>
                </div>
              ))}
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-800 mb-4">
                {col.heading}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="link-underline text-sm"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            © 2026 Healthitude Health Technologies Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="link-underline cursor-pointer">NDPC Registered</span>
            <span>·</span>
            <span className="link-underline cursor-pointer">HIPAA Compliant</span>
            <span>·</span>
            <span className="link-underline cursor-pointer">ISO 27001 Aligned</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ── Public AI Chat ────────────────────────────────────────────────────────────

const PUBLIC_SUGGESTIONS = [
  "What is hypertension?",
  "How does telemedicine work?",
  "What vaccinations do adults need?",
  "What is a normal blood pressure reading?",
  "How do I manage Type 2 diabetes?",
  "What does NHIS cover?",
]

function PublicAIChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I am Angitia — Healthitude's health assistant. Ask me anything about general health: symptoms, conditions, medications, or how Healthitude works. I cannot diagnose, prescribe, or replace your doctor.",
    },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg) return
    setMessages((m) => [
      ...m,
      { role: "user", text: msg },
      {
        role: "assistant",
        text: "That's a great health question. For personalised advice, I recommend consulting a verified Healthitude doctor. As general information: maintaining a balanced diet, regular physical activity, routine check-ups, and adhering to prescribed medications are cornerstones of good health. Create a free Healthitude account to connect with a verified professional who can give you advice specific to your situation.",
      },
    ])
    setInput("")
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{ width: "360px", height: "500px" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
            style={{ background: `linear-gradient(135deg, ${NAVY}, ${BLUE})` }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <AngitiaIcon size={18} color="white" pulseColor="#bfdbfe" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">
                  Angitia
                </p>
                <p className="text-white/60 text-xs">
                  General health knowledge · Free
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              aria-label="Close Angitia chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Disclaimer */}
          <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            General information only — not a medical diagnosis or prescription.
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-sm leading-snug ${
                    m.role === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-700 rounded-bl-sm"
                  }`}
                  style={m.role === "user" ? { background: BLUE } : {}}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions — show only before first user message */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {PUBLIC_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-2.5 py-1 border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 px-3 py-2.5 flex gap-2 items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ask a health question..."
            />
            <button
              onClick={() => send()}
              className="btn-send !p-0 w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-lg text-white"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 btn-arrow" />
            </button>
          </div>
        </div>
      )}

      {/* FAB with Ripple */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`group fixed bottom-6 right-6 z-50 flex items-center overflow-visible text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
          open ? "bg-slate-700" : "btn-ripple"
        }`}
        style={{
          borderRadius: "9999px",
          width: open ? "3.5rem" : undefined,
          height: "3.5rem",
          padding: open ? "0" : undefined,
          justifyContent: "center",
        }}
        aria-label="Angitia"
      >
        <span className="flex items-center gap-0 group-hover:gap-2.5 transition-all duration-300 px-4 group-hover:pr-5">
          {open ? (
            <X className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AngitiaIcon size={28} color="white" pulseColor="#bfdbfe" />
          )}
          {!open && (
            <span className="text-sm font-semibold whitespace-nowrap max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300">
              Ask Angitia
            </span>
          )}
        </span>
      </button>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Stats />
      <WhatWeDo />
      <AboutUs />
      <Services />
      <Telemedicine />
      <ForProfessionals />
      <PharmaceuticalPartners />
      <HealthTools />
      <Blog />
      <Testimonials />
      <Roadmap />
      <CTA />
      <Footer />
      <PublicAIChat />
    </div>
  )
}
