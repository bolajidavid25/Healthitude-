import { createBrowserRouter, Navigate } from "react-router"
import LandingPage from "@/pages/LandingPage"
import PatientAuthPage from "@/pages/patient/PatientAuthPage"
import PatientLayout from "@/pages/patient/PatientLayout"
import ProfAuthPage from "@/pages/professional/ProfAuthPage"
import ProfLayout from "@/pages/professional/ProfLayout"
import TelemedicinePage from "@/pages/TelemedicinePage"

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/telemedicine", Component: TelemedicinePage },

  // Patient portal
  { path: "/patient/login", element: <PatientAuthPage mode="login" /> },
  { path: "/patient/register", element: <PatientAuthPage mode="register" /> },
  { path: "/patient/dashboard", Component: PatientLayout },
  { path: "/patient", element: <Navigate to="/patient/login" replace /> },

  // Professional portal
  { path: "/professional/login", element: <ProfAuthPage mode="login" /> },
  { path: "/professional/register", element: <ProfAuthPage mode="register" /> },
  { path: "/professional/dashboard", Component: ProfLayout },
  {
    path: "/professional",
    element: <Navigate to="/professional/login" replace />,
  },

  // Fallback
  { path: "*", element: <Navigate to="/" replace /> },
])
