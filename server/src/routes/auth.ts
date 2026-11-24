import { Router } from "express"
import { validateBody } from "../middleware/validate"
import { loginSchema, changePasswordSchema } from "../validation/auth"
import { patientRegistrationSchema } from "../validation/onboarding"
import { registerPatientHandler } from "../controllers/patientController"
import {
  loginRateLimiter,
  registrationRateLimiter,
} from "../middleware/rateLimiter"
import { authenticate } from "../middleware/authenticate"
import { csrfProtection } from "../middleware/csrf"
import {
  loginHandler,
  logoutHandler,
  getMeHandler,
  getCsrfHandler,
  changePasswordHandler,
} from "../controllers/authController"
import {
  googlePatientAuthHandler,
  googlePatientRegisterHandler,
} from "../controllers/googleAuthController"

export const authRouter = Router()

/**
 * Public Authentication Routes
 */
authRouter.get("/csrf", getCsrfHandler)
authRouter.post(
  "/register",
  registrationRateLimiter,
  validateBody(patientRegistrationSchema),
  registerPatientHandler,
)
authRouter.post(
  "/login",
  loginRateLimiter,
  validateBody(loginSchema),
  loginHandler,
)
authRouter.post("/google", loginRateLimiter, googlePatientAuthHandler)
authRouter.post(
  "/google/register",
  registrationRateLimiter,
  googlePatientRegisterHandler,
)

/**
 * Protected Authentication Routes
 * Rule N: Validate session on every request.
 * Rule L: Verify CSRF token on state-changing logout.
 * Rule O: Invalidate session on logout.
 */
authRouter.get("/me", authenticate, getMeHandler)
authRouter.post("/logout", authenticate, csrfProtection, logoutHandler)
authRouter.post(
  "/change-password",
  authenticate,
  csrfProtection,
  validateBody(changePasswordSchema),
  changePasswordHandler,
)
