import { createApp } from "./app"
import { prisma } from "./config/prisma"
import { registerPatient } from "./services/patientRegistrationService"
import {
  createAppointment,
  rescheduleAppointment,
  cancelAppointment,
} from "./services/appointmentService"
import {
  createComplaint,
  updateComplaintStatus,
} from "./services/complaintService"
import {
  initiateEmergencyCase,
  respondToEmergencyCase,
  cancelEmergencyCase,
} from "./services/emergencyService"
import { createNotification } from "./services/notificationService"
import {
  generateSessionToken,
  hashSessionToken,
  generateCsrfToken,
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
} from "./utils/session"
import {
  Sex,
  PatientCategory,
  ConsentType,
  NotificationType,
  ComplaintStatus,
} from "./generated/prisma/enums"
import http from "http"

interface HttpResponse {
  status: number
  headers: http.IncomingHttpHeaders
  body: any
}

async function request(
  port: number,
  path: string,
  method = "GET",
  headers: Record<string, string> = {},
  body?: any,
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined
    const reqHeaders: Record<string, string> = {
      ...headers,
    }
    if (payload && !reqHeaders["Content-Type"]) {
      reqHeaders["Content-Type"] = "application/json"
    }
    if (payload) {
      reqHeaders["Content-Length"] = Buffer.byteLength(payload).toString()
    }

    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = ""
        res.on("data", (chunk) => (data += chunk))
        res.on("end", () => {
          let parsedBody
          try {
            parsedBody = JSON.parse(data)
          } catch {
            parsedBody = data
          }
          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body: parsedBody,
          })
        })
      },
    )

    req.on("error", reject)
    if (payload) {
      req.write(payload)
    }
    req.end()
  })
}

async function createAuthenticatedSession(userId: string) {
  const rawToken = generateSessionToken()
  const tokenHash = hashSessionToken(rawToken)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  })

  const csrfToken = generateCsrfToken()
  const cookieHeader = `${SESSION_COOKIE_NAME}=${rawToken}; ${CSRF_COOKIE_NAME}=${csrfToken}`

  return {
    rawToken,
    csrfToken,
    cookieHeader,
    headers: {
      Cookie: cookieHeader,
      "x-csrf-token": csrfToken,
    },
  }
}

async function runNotificationTests() {
  console.log(
    "================================================================================",
  )
  console.log(
    "HEALTHITUDE: IN-APP PATIENT NOTIFICATIONS BACKEND INTEGRATION TESTS",
  )
  console.log(
    "================================================================================",
  )

  const app = createApp()
  const server = http.createServer(app)

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve())
  })

  const addr = server.address() as any
  const port = addr.port
  console.log(`[Test Server] Running on http://127.0.0.1:${port}`)

  let patientA: any
  let sessionA: any
  let patientB: any
  let sessionB: any

  try {
    // Setup Patient A
    const emailA = `patient.notif.a.${Date.now()}@example.com`
    const regA = await registerPatient({
      account: {
        firstName: "Kofi",
        lastName: "Mensah",
        dateOfBirth: new Date("1992-05-14"),
        sex: Sex.MALE,
        email: emailA,
        phoneNumber: `+233${Math.floor(200000000 + Math.random() * 899999999)}`,
        password: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      },
      contact: {
        street: "24 Ring Road",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Akosua Mensah",
          relationship: "SPOUSE_PARTNER",
          phoneNumber: "+233240001122",
        },
      },
      patientCategory: {
        category: PatientCategory.GENERAL_PATIENT,
      },
      consents: {
        consents: [
          { consentType: "TERMS_AND_PRIVACY", accepted: true, version: "v1.0" },
          {
            consentType: "HEALTH_DATA_PROCESSING",
            accepted: true,
            version: "v1.0",
          },
          {
            consentType: "PROFESSIONAL_ACCESS",
            accepted: true,
            version: "v1.0",
          },
          {
            consentType: "PATIENT_DATA_ACKNOWLEDGEMENT",
            accepted: true,
            version: "v1.0",
          },
          { consentType: "AI_LIMITATIONS", accepted: true, version: "v1.0" },
          {
            consentType: "BREAK_GLASS_DISCLOSURE",
            accepted: true,
            version: "v1.0",
          },
          {
            consentType: "INFORMATION_ACCURACY",
            accepted: true,
            version: "v1.0",
          },
        ],
      },
    })
    patientA = regA.user
    sessionA = await createAuthenticatedSession(patientA.id)

    // Setup Patient B for cross-patient isolation testing
    const emailB = `patient.notif.b.${Date.now()}@example.com`
    const regB = await registerPatient({
      account: {
        firstName: "Abena",
        lastName: "Osei",
        dateOfBirth: new Date("1995-10-10"),
        sex: Sex.FEMALE,
        email: emailB,
        phoneNumber: `+233${Math.floor(200000000 + Math.random() * 899999999)}`,
        password: "ValidPassword123!",
        confirmPassword: "ValidPassword123!",
      },
      contact: {
        street: "15 Cantonments Rd",
        city: "Accra",
        state: "Greater Accra",
        emergencyContact: {
          fullName: "Kwame Osei",
          relationship: "SIBLING",
          phoneNumber: "+233240003344",
        },
      },
      patientCategory: {
        category: PatientCategory.GENERAL_PATIENT,
      },
      consents: {
        consents: [
          { consentType: "TERMS_AND_PRIVACY", accepted: true, version: "v1.0" },
          {
            consentType: "HEALTH_DATA_PROCESSING",
            accepted: true,
            version: "v1.0",
          },
          {
            consentType: "PROFESSIONAL_ACCESS",
            accepted: true,
            version: "v1.0",
          },
          {
            consentType: "PATIENT_DATA_ACKNOWLEDGEMENT",
            accepted: true,
            version: "v1.0",
          },
          { consentType: "AI_LIMITATIONS", accepted: true, version: "v1.0" },
          {
            consentType: "BREAK_GLASS_DISCLOSURE",
            accepted: true,
            version: "v1.0",
          },
          {
            consentType: "INFORMATION_ACCURACY",
            accepted: true,
            version: "v1.0",
          },
        ],
      },
    })
    patientB = regB.user
    sessionB = await createAuthenticatedSession(patientB.id)

    // -------------------------------------------------------------------------
    // Check 1: Unauthenticated access rejected with HTTP 401 Unauthorized
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 1: Unauthenticated access rejected with HTTP 401 ---",
    )
    const unauthGet = await request(port, "/api/patient/notifications")
    if (unauthGet.status !== 401) {
      throw new Error(
        `Expected unauthenticated GET to return 401, got ${unauthGet.status}`,
      )
    }
    const unauthCount = await request(
      port,
      "/api/patient/notifications/unread-count",
    )
    if (unauthCount.status !== 401) {
      throw new Error(
        `Expected unauthenticated unread-count to return 401, got ${unauthCount.status}`,
      )
    }
    const unauthPatch = await request(
      port,
      "/api/patient/notifications/mark-all-read",
      "PATCH",
    )
    if (unauthPatch.status !== 401) {
      throw new Error(
        `Expected unauthenticated PATCH mark-all-read to return 401, got ${unauthPatch.status}`,
      )
    }
    console.log(
      "[PASS] Check 1: All unauthenticated notification endpoints reject with HTTP 401",
    )

    // -------------------------------------------------------------------------
    // Check 2: Initial retrieval for newly registered patient returns 0 notifications
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 2: Initial retrieval returns empty list and 0 unread ---",
    )
    const initialRes = await request(
      port,
      "/api/patient/notifications",
      "GET",
      sessionA.headers,
    )
    if (
      initialRes.status !== 200 ||
      initialRes.body.data.items.length !== 0 ||
      initialRes.body.data.unreadCount !== 0
    ) {
      throw new Error(
        `Expected initial empty notifications, got: ${JSON.stringify(initialRes.body)}`,
      )
    }
    const initialCount = await request(
      port,
      "/api/patient/notifications/unread-count",
      "GET",
      sessionA.headers,
    )
    if (
      initialCount.status !== 200 ||
      initialCount.body.data.unreadCount !== 0
    ) {
      throw new Error(
        `Expected initial unreadCount 0, got: ${JSON.stringify(initialCount.body)}`,
      )
    }
    console.log(
      "[PASS] Check 2: Initial patient notifications correctly initialized to empty inbox",
    )

    // -------------------------------------------------------------------------
    // Check 3: Appointment Booking automatically triggers APPOINTMENT_CONFIRMED notification
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 3: Appointment Booking triggers APPOINTMENT_CONFIRMED notification ---",
    )
    const apt = await createAppointment(patientA.id, {
      doctorName: "Dr. Kofi Boateng",
      department: "Cardiology",
      type: "Initial Consultation",
      reason: "High blood pressure check",
      date: "2026-11-20",
      time: "09:30 AM",
      documents: [],
    })

    const notifAfterBooking = await request(
      port,
      "/api/patient/notifications",
      "GET",
      sessionA.headers,
    )
    if (
      notifAfterBooking.status !== 200 ||
      notifAfterBooking.body.data.items.length !== 1
    ) {
      throw new Error(
        `Expected 1 notification after booking, got: ${JSON.stringify(notifAfterBooking.body)}`,
      )
    }
    const bookingNotif = notifAfterBooking.body.data.items[0]
    if (
      bookingNotif.type !== NotificationType.APPOINTMENT_CONFIRMED ||
      bookingNotif.read !== false
    ) {
      throw new Error(
        `Invalid booking notification payload: ${JSON.stringify(bookingNotif)}`,
      )
    }
    console.log(
      `[PASS] Check 3: APPOINTMENT_CONFIRMED created: "${bookingNotif.title}" - "${bookingNotif.message}"`,
    )

    // -------------------------------------------------------------------------
    // Check 4: Appointment Rescheduling triggers APPOINTMENT_RESCHEDULED notification
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 4: Appointment Rescheduling triggers APPOINTMENT_RESCHEDULED notification ---",
    )
    await rescheduleAppointment(patientA.id, apt.id, {
      date: "2026-11-25",
      time: "11:00 AM",
      reason: "Schedule clash",
    })

    const notifAfterResched = await request(
      port,
      "/api/patient/notifications",
      "GET",
      sessionA.headers,
    )
    if (
      notifAfterResched.body.data.items.length !== 2 ||
      notifAfterResched.body.data.items[0].type !==
        NotificationType.APPOINTMENT_RESCHEDULED
    ) {
      throw new Error(
        `Expected reschedule notification, got: ${JSON.stringify(notifAfterResched.body)}`,
      )
    }
    console.log(
      `[PASS] Check 4: APPOINTMENT_RESCHEDULED created: "${notifAfterResched.body.data.items[0].title}"`,
    )

    // -------------------------------------------------------------------------
    // Check 5: Appointment Cancellation triggers APPOINTMENT_CANCELLED notification
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 5: Appointment Cancellation triggers APPOINTMENT_CANCELLED notification ---",
    )
    await cancelAppointment(patientA.id, apt.id, "No longer needed")

    const notifAfterCancel = await request(
      port,
      "/api/patient/notifications",
      "GET",
      sessionA.headers,
    )
    if (
      notifAfterCancel.body.data.items.length !== 3 ||
      notifAfterCancel.body.data.items[0].type !==
        NotificationType.APPOINTMENT_CANCELLED
    ) {
      throw new Error(
        `Expected cancellation notification, got: ${JSON.stringify(notifAfterCancel.body)}`,
      )
    }
    console.log(
      `[PASS] Check 5: APPOINTMENT_CANCELLED created: "${notifAfterCancel.body.data.items[0].title}"`,
    )

    // -------------------------------------------------------------------------
    // Check 6: Health Complaint submission triggers COMPLAINT_SUBMITTED notification
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 6: Complaint submission triggers COMPLAINT_SUBMITTED notification ---",
    )
    const complaint = await createComplaint(patientA.id, {
      symptoms: "Persistent headache and mild fatigue",
      severity: "MODERATE" as any,
      duration: "3 days",
    })

    const notifAfterComplaint = await request(
      port,
      "/api/patient/notifications",
      "GET",
      sessionA.headers,
    )
    if (
      notifAfterComplaint.body.data.items.length !== 4 ||
      notifAfterComplaint.body.data.items[0].type !==
        NotificationType.COMPLAINT_SUBMITTED
    ) {
      throw new Error(
        `Expected complaint notification, got: ${JSON.stringify(notifAfterComplaint.body)}`,
      )
    }
    console.log(
      `[PASS] Check 6: COMPLAINT_SUBMITTED created: "${notifAfterComplaint.body.data.items[0].title}"`,
    )

    // -------------------------------------------------------------------------
    // Check 7: Complaint status update triggers COMPLAINT_UPDATED notification
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 7: Complaint status update triggers COMPLAINT_UPDATED notification ---",
    )
    await updateComplaintStatus(
      complaint.referenceId,
      ComplaintStatus.UNDER_REVIEW,
      "Doctor assigned for review",
      "Dr. Ama Bentil",
    )

    const notifAfterStatus = await request(
      port,
      "/api/patient/notifications",
      "GET",
      sessionA.headers,
    )
    if (
      notifAfterStatus.body.data.items.length !== 5 ||
      notifAfterStatus.body.data.items[0].type !==
        NotificationType.COMPLAINT_UPDATED
    ) {
      throw new Error(
        `Expected complaint update notification, got: ${JSON.stringify(notifAfterStatus.body)}`,
      )
    }
    console.log(
      `[PASS] Check 7: COMPLAINT_UPDATED created: "${notifAfterStatus.body.data.items[0].title}"`,
    )

    // -------------------------------------------------------------------------
    // Check 8: Emergency Break-Glass triggers EMERGENCY_ALERT notifications
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 8: Emergency Break-Glass events trigger EMERGENCY_ALERT notifications ---",
    )
    const emgResult = await initiateEmergencyCase(patientA.id, {
      reason: "Severe shortness of breath",
    })
    const caseNum = emgResult.emergencyCase.caseNumber

    // Responding clinician accepts
    await respondToEmergencyCase(caseNum, {
      responderName: "Dr. Ama Bentil",
      responderRole: "Verified GP",
    })

    // Patient cancels
    await cancelEmergencyCase(patientA.id, {
      reason: "Emergency resolved on scene",
    })

    const notifAfterEmg = await request(
      port,
      "/api/patient/notifications",
      "GET",
      sessionA.headers,
    )
    // Previous 5 + 3 emergency events = 8 notifications
    if (notifAfterEmg.body.data.items.length !== 8) {
      throw new Error(
        `Expected 8 notifications, got: ${notifAfterEmg.body.data.items.length}`,
      )
    }
    console.log(
      "[PASS] Check 8: Emergency Break-Glass workflow events (initiate, respond, cancel) emitted alerts",
    )

    // -------------------------------------------------------------------------
    // Check 9: Event Idempotency — Repeated event does NOT duplicate notification
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 9: Idempotency prevents duplicate notifications for identical event ---",
    )
    const eventId = "test_idempotent_event_9988"
    const firstCall = await createNotification({
      userId: patientA.id,
      type: NotificationType.GENERAL,
      title: "Test Idempotency",
      message: "This should only appear once.",
      eventId,
    })
    const secondCall = await createNotification({
      userId: patientA.id,
      type: NotificationType.GENERAL,
      title: "Test Idempotency Repeated",
      message: "This should be ignored or return the first.",
      eventId,
    })

    if (firstCall.id !== secondCall.id) {
      throw new Error(
        `Expected duplicate creation to return existing notification ID, got: ${firstCall.id} vs ${secondCall.id}`,
      )
    }

    const notifCountForEvent = await prisma.notification.count({
      where: { userId: patientA.id, eventId },
    })
    if (notifCountForEvent !== 1) {
      throw new Error(
        `Expected exactly 1 notification in DB for eventId, got: ${notifCountForEvent}`,
      )
    }
    console.log(
      "[PASS] Check 9: Event idempotency strictly enforced; zero duplicate notifications created",
    )

    // -------------------------------------------------------------------------
    // Check 10: Unread Count Endpoint matches persisted state
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 10: Unread Count Endpoint returns accurate count ---",
    )
    const unreadCountRes = await request(
      port,
      "/api/patient/notifications/unread-count",
      "GET",
      sessionA.headers,
    )
    // 8 + 1 (idempotent test) = 9 unread notifications
    if (
      unreadCountRes.status !== 200 ||
      unreadCountRes.body.data.unreadCount !== 9
    ) {
      throw new Error(
        `Expected 9 unread notifications, got: ${unreadCountRes.body.data.unreadCount}`,
      )
    }
    console.log(
      `[PASS] Check 10: Unread notification count matches persisted unread items (${unreadCountRes.body.data.unreadCount})`,
    )

    // -------------------------------------------------------------------------
    // Check 11: Mark Single Notification as Read (PATCH /api/patient/notifications/:id/read)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 11: Mark single notification as read ---")
    const targetNotif = notifAfterEmg.body.data.items[0]
    const markReadRes = await request(
      port,
      `/api/patient/notifications/${targetNotif.id}/read`,
      "PATCH",
      sessionA.headers,
    )
    if (
      markReadRes.status !== 200 ||
      markReadRes.body.data.read !== true ||
      !markReadRes.body.data.readAt
    ) {
      throw new Error(
        `Expected notification marked as read, got: ${JSON.stringify(markReadRes.body)}`,
      )
    }

    const countAfterOneRead = await request(
      port,
      "/api/patient/notifications/unread-count",
      "GET",
      sessionA.headers,
    )
    if (countAfterOneRead.body.data.unreadCount !== 8) {
      throw new Error(
        `Expected 8 unread notifications after 1 marked read, got: ${countAfterOneRead.body.data.unreadCount}`,
      )
    }
    console.log(
      "[PASS] Check 11: Single notification marked as read and unreadCount decremented",
    )

    // -------------------------------------------------------------------------
    // Check 12: Mark All Notifications as Read (PATCH /api/patient/notifications/mark-all-read)
    // -------------------------------------------------------------------------
    console.log("\n--- Check 12: Mark all notifications as read ---")
    const markAllRes = await request(
      port,
      "/api/patient/notifications/mark-all-read",
      "PATCH",
      sessionA.headers,
    )
    if (
      markAllRes.status !== 200 ||
      markAllRes.body.data.updatedCount !== 8 ||
      markAllRes.body.data.unreadCount !== 0
    ) {
      throw new Error(
        `Expected mark-all-read to update 8 notifications, got: ${JSON.stringify(markAllRes.body)}`,
      )
    }

    const countAfterAllRead = await request(
      port,
      "/api/patient/notifications/unread-count",
      "GET",
      sessionA.headers,
    )
    if (countAfterAllRead.body.data.unreadCount !== 0) {
      throw new Error(
        `Expected 0 unread notifications after mark-all-read, got: ${countAfterAllRead.body.data.unreadCount}`,
      )
    }

    const unreadFiltered = await request(
      port,
      "/api/patient/notifications?unreadOnly=true",
      "GET",
      sessionA.headers,
    )
    if (unreadFiltered.body.data.items.length !== 0) {
      throw new Error(
        `Expected 0 items when unreadOnly=true, got: ${unreadFiltered.body.data.items.length}`,
      )
    }
    console.log(
      "[PASS] Check 12: All notifications marked as read; unread count successfully reset to 0",
    )

    // -------------------------------------------------------------------------
    // Check 13: Cross-Patient Data Isolation (IDOR Defense)
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 13: Cross-Patient Data Isolation (IDOR Defense) ---",
    )
    const patientBInbox = await request(
      port,
      "/api/patient/notifications",
      "GET",
      sessionB.headers,
    )
    if (patientBInbox.body.data.items.length !== 0) {
      throw new Error(
        `Patient B should see 0 notifications, got: ${patientBInbox.body.data.items.length}`,
      )
    }

    // Patient B attempting to mark read Patient A's notification -> 403 Forbidden
    const crossRead = await request(
      port,
      `/api/patient/notifications/${targetNotif.id}/read`,
      "PATCH",
      sessionB.headers,
    )
    if (crossRead.status !== 403) {
      throw new Error(
        `Expected cross-patient mark read to return 403, got: ${crossRead.status}`,
      )
    }

    // Patient B attempting to delete Patient A's notification -> 403 Forbidden
    const crossDelete = await request(
      port,
      `/api/patient/notifications/${targetNotif.id}`,
      "DELETE",
      sessionB.headers,
    )
    if (crossDelete.status !== 403) {
      throw new Error(
        `Expected cross-patient delete to return 403, got: ${crossDelete.status}`,
      )
    }
    console.log(
      "[PASS] Check 13: Cross-patient data isolation verified (IDOR attempts return HTTP 403 Forbidden)",
    )

    // -------------------------------------------------------------------------
    // Check 14: Dismiss / Delete Notification from Inbox (DELETE /api/patient/notifications/:id)
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 14: Delete notification from inbox preserves underlying business record ---",
    )
    // Find the appointment notification
    const listBeforeDelete = await request(
      port,
      "/api/patient/notifications",
      "GET",
      sessionA.headers,
    )
    const aptNotif = listBeforeDelete.body.data.items.find(
      (n: any) => n.referenceId === apt.id,
    )
    if (!aptNotif) {
      throw new Error("Could not find appointment notification to delete")
    }

    const deleteRes = await request(
      port,
      `/api/patient/notifications/${aptNotif.id}`,
      "DELETE",
      sessionA.headers,
    )
    if (deleteRes.status !== 200 || !deleteRes.body.data.success) {
      throw new Error(
        `Expected successful notification deletion, got: ${JSON.stringify(deleteRes.body)}`,
      )
    }

    // Confirm notification removed from patient inbox
    const listAfterDelete = await request(
      port,
      "/api/patient/notifications",
      "GET",
      sessionA.headers,
    )
    const deletedFound = listAfterDelete.body.data.items.find(
      (n: any) => n.id === aptNotif.id,
    )
    if (deletedFound) {
      throw new Error("Deleted notification still returned in patient list")
    }

    // Rule 15: Verify underlying appointment in database was NOT deleted!
    const underlyingApt = await prisma.appointment.findFirst({
      where: { appointmentNumber: apt.id },
    })
    if (!underlyingApt) {
      throw new Error(
        "Rule 15 VIOLATION: Underlying appointment was deleted when notification was dismissed!",
      )
    }
    console.log(
      "[PASS] Check 14: Notification successfully dismissed from inbox; underlying appointment preserved",
    )

    // -------------------------------------------------------------------------
    // Check 15: Deleting Non-Existent Notification returns HTTP 404
    // -------------------------------------------------------------------------
    console.log(
      "\n--- Check 15: Deleting non-existent notification returns HTTP 404 ---",
    )
    const nonExistentDelete = await request(
      port,
      "/api/patient/notifications/00000000-0000-0000-0000-000000000000",
      "DELETE",
      sessionA.headers,
    )
    if (nonExistentDelete.status !== 404) {
      throw new Error(
        `Expected 404 for non-existent notification delete, got: ${nonExistentDelete.status}`,
      )
    }
    console.log(
      "[PASS] Check 15: Non-existent notification deletion properly returns HTTP 404 Not Found",
    )

    // -------------------------------------------------------------------------
    // Check 16: Pagination and Ordering
    // -------------------------------------------------------------------------
    console.log("\n--- Check 16: Pagination and Ordering ---")
    const page1 = await request(
      port,
      "/api/patient/notifications?page=1&limit=3",
      "GET",
      sessionA.headers,
    )
    if (
      page1.body.data.items.length !== 3 ||
      page1.body.data.page !== 1 ||
      page1.body.data.limit !== 3
    ) {
      throw new Error(
        `Expected page 1 with 3 items, got: ${JSON.stringify(page1.body)}`,
      )
    }
    const page2 = await request(
      port,
      "/api/patient/notifications?page=2&limit=3",
      "GET",
      sessionA.headers,
    )
    if (page2.body.data.items.length !== 3 || page2.body.data.page !== 2) {
      throw new Error(
        `Expected page 2 with 3 items, got: ${JSON.stringify(page2.body)}`,
      )
    }
    if (page1.body.data.items[0].id === page2.body.data.items[0].id) {
      throw new Error("Page 1 and Page 2 contain overlapping items")
    }
    console.log(
      `[PASS] Check 16: Pagination verified (Total: ${page1.body.data.total}, TotalPages: ${page1.body.data.totalPages})`,
    )

    console.log(
      "\n================================================================================",
    )
    console.log(
      "ALL 16 IN-APP PATIENT NOTIFICATION CHECKS PASSED WITH 100% SUCCESS!",
    )
    console.log(
      "================================================================================\n",
    )
  } finally {
    console.log("[Teardown] Cleaning up test data...")
    if (patientA?.id) {
      await prisma.user.delete({ where: { id: patientA.id } }).catch(() => {})
    }
    if (patientB?.id) {
      await prisma.user.delete({ where: { id: patientB.id } }).catch(() => {})
    }
    server.close()
    console.log("[Teardown] Test server closed cleanly.")
  }
}

runNotificationTests().catch((err) => {
  console.error("FATAL: Notification test run failed:", err)
  process.exit(1)
})
