Yes. Since you're focusing on **UI first and UX later**, the prompt should tell the AI/design tool to build the **complete visual interface and screen structure**, without getting distracted by backend logic, API integrations, or clinical workflow implementation.

Here is a structured prompt you can use for Healthitude.

# HEALTHITUDE — TELEMEDICINE UI SYSTEM

## 1. PROJECT CONTEXT

Design and build the **Telemedicine / Doctor Consultation UI** for Healthitude, a modern healthcare web application.

Healthitude allows patients to:

* Find verified doctors
* Browse doctors by specialty
* View doctor availability
* Select a reason for consultation
* Complete a pre-consultation medical intake
* Upload relevant medical documents
* Book an appointment
* Attend a video consultation
* View consultation notes
* Receive diagnoses and prescriptions
* Schedule follow-up care
* Access their medical history

The goal at this stage is **UI implementation only**.

Do NOT focus on backend functionality, API integrations, authentication logic, database implementation, payment processing, video SDK integration, or advanced UX logic.

Create the complete visual interface and component structure so that functionality can be connected later.

---

# 2. DESIGN DIRECTION

Healthitude should feel:

* Professional
* Medical
* Trustworthy
* Calm
* Modern
* Premium
* Accessible
* Clean
* Human-centered

Avoid making the interface look like a generic hospital management system.

The product should feel like a modern digital healthcare platform similar to the quality level of leading telemedicine products.

Use generous whitespace, clear typography, subtle borders, rounded cards, clean icons, and strong visual hierarchy.

The interface should communicate **trust, safety, professionalism, and simplicity**.

---

# 3. EXISTING HEALTHITUDE DESIGN SYSTEM

Use the existing Healthitude brand identity and design system where available.

Do not introduce an unrelated visual style.

Maintain consistency with the existing:

* Colors
* Typography
* Buttons
* Inputs
* Cards
* Navigation
* Icons
* Border radius
* Shadows
* Spacing system

If existing Healthitude components are already available in the project, reuse them rather than creating duplicate components.

---

# 4. PATIENT TELEMEDICINE FLOW

Create the UI for the following patient journey:

```text
Find a Provider
        ↓
Choose Reason for Visit
        ↓
Complete Medical Intake
        ↓
Choose Date & Time
        ↓
Review Appointment
        ↓
Appointment Confirmed
        ↓
Upcoming Appointment
        ↓
Video Consultation
        ↓
Consultation Completed
        ↓
Diagnosis / Prescription / Notes
        ↓
Follow-up
```

Each stage should have its own polished UI.

---

# 5. SCREEN 01 — FIND A PROVIDER

Create a page titled:

## "Find a Doctor"

Include:

### Search

A prominent search field:

"Search doctors, specialties..."

### Filters

Create filter controls for:

* Specialty
* Location
* Consultation type
* Availability
* Gender
* Experience
* Price range

### Doctor Cards

Each doctor card should display:

* Doctor profile image
* Doctor name
* Verification badge
* Specialty
* Years of experience
* Rating
* Number of consultations
* Location
* Consultation fee
* Online / In-person availability
* Next available appointment
* "View Profile"
* "Book Consultation"

Example:

Dr. Sarah Johnson
✓ Verified Doctor
General Practitioner
8 years experience

★★★★★ 4.9

Next available:
Today, 2:30 PM

₦15,000 / consultation

[ View Profile ] [ Book Consultation ]

Include multiple doctor cards to demonstrate the layout.

---

# 6. SCREEN 02 — DOCTOR PROFILE

Create a detailed doctor profile page.

Include:

### Profile Header

* Profile image
* Doctor name
* Verified badge
* Specialty
* Experience
* Rating
* Consultation count
* Location

### About

Doctor biography and professional summary.

### Qualifications

* Medical degree
* Certifications
* Professional memberships

### Specialties

Display specialties as tags.

### Consultation Types

Cards for:

* Video consultation
* In-person consultation
* Follow-up consultation

### Availability

Show a calendar/date selector and available appointment times.

Example:

Today

09:00 AM
09:30 AM
10:00 AM
10:30 AM

Tomorrow

09:00 AM
09:30 AM
11:00 AM

Include:

[ Book Consultation ]

---

# 7. SCREEN 03 — CHOOSE REASON FOR VISIT

Create a clean selection screen.

Title:

## "What brings you to Healthitude?"

Subtitle:

"Choose the reason for your visit so we can prepare your consultation."

Create selectable cards:

### General Consultation

For common health concerns and symptoms.

### Follow-up

Continue care from a previous consultation.

### Maternal Care

Pregnancy, postpartum, and maternal health support.

### Child Health

Health concerns involving children.

### Medication Review

Discuss current medications and treatment.

### Specialist Consultation

Consult a doctor for a specific specialty.

### Other

Describe another reason for your visit.

Use selected/unselected states.

Include:

[ Back ]

[ Continue ]

---

# 8. SCREEN 04 — PRE-CONSULTATION INTAKE

Create a multi-section medical intake interface.

The patient should be able to provide information before meeting the doctor.

Page title:

## "Tell us about your health concern"

Subtitle:

"Your doctor will review this information before your consultation."

Create a progress indicator:

```text
Symptoms → Medical History → Medications → Documents → Review
```

---

## SECTION A — SYMPTOMS

Fields:

### Main symptoms

Large textarea:

"What symptoms are you experiencing?"

### When did they start?

Selectable options:

* Today
* 2–3 days ago
* Within the last week
* 1–4 weeks ago
* More than a month ago

### Severity

Use a visual scale:

Mild
Moderate
Severe

### Additional symptoms

Allow multiple symptom selections.

---

# 9. SECTION B — MEDICAL HISTORY

Create fields for:

### Existing medical conditions

Examples:

* Asthma
* Diabetes
* Hypertension
* None
* Other

### Previous similar condition

Yes / No

### Previous surgeries

Yes / No

### Allergies

Textarea or selectable options.

### Additional medical information

Large textarea.

---

# 10. SECTION C — CURRENT MEDICATIONS

Create a medication interface.

Title:

## "Current medications"

Allow users to add medications.

Each medication row/card should contain:

* Medication name
* Dosage
* Frequency
* Duration

Example:

Paracetamol
500 mg
2 times daily
3 days

Include:

[ + Add medication ]

Also provide:

"I am not currently taking any medication."

---

# 11. SECTION D — UPLOAD DOCUMENTS

Create a document upload area.

Title:

## "Upload relevant documents"

Subtitle:

"Upload medical reports, test results, prescriptions, scans, or other documents that may help your doctor."

Create a drag-and-drop/upload component.

Supported visual examples:

* PDF
* JPG
* PNG
* DOCX

Show uploaded files as cards:

Blood_Test.pdf
1.2 MB

[ Preview ] [ Remove ]

Include upload progress states.

---

# 12. SCREEN 05 — REVIEW INTAKE

Before booking, show a summary.

Title:

## "Review your information"

Sections:

### Reason for visit

General Consultation

[ Edit ]

### Symptoms

Headache, fatigue, dizziness

Duration:
5 days

Severity:
Moderate

[ Edit ]

### Medical history

No existing conditions reported.

[ Edit ]

### Medications

Paracetamol — 500 mg — 2x daily

[ Edit ]

### Documents

2 documents attached.

[ Edit ]

At the bottom:

"Your information will be shared with your selected healthcare provider for the purpose of your consultation."

Checkbox:

☐ I confirm that the information provided is accurate.

Button:

[ Continue to Appointment ]

---

# 13. SCREEN 06 — SELECT DATE & TIME

Create a scheduling interface entirely within Healthitude.

Do NOT use Calendly.

Title:

## "Choose your appointment"

Display:

### Doctor

Dr. Sarah Johnson
General Practitioner

### Consultation type

Video consultation

### Calendar

Create a modern horizontal date selector:

MON 15
TUE 16
WED 17
THU 18
FRI 19

Then show available time slots.

Example:

Morning

09:00 AM
09:30 AM
10:00 AM

Afternoon

01:00 PM
01:30 PM
02:00 PM

Unavailable times should appear disabled.

Selected time should have a strong active state.

Button:

[ Continue ]

---

# 14. SCREEN 07 — APPOINTMENT REVIEW

Create a final appointment confirmation page.

Display:

Doctor:

Dr. Sarah Johnson

Specialty:

General Medicine

Date:

Tuesday, September 16

Time:

2:30 PM – 3:00 PM

Type:

Video Consultation

Reason:

General Consultation

Consultation fee:

₦15,000

Include:

[ Back ]

[ Confirm Appointment ]

---

# 15. SCREEN 08 — APPOINTMENT CONFIRMED

Create a success screen.

Title:

## "Your appointment is confirmed"

Show:

✓

Dr. Sarah Johnson

Tuesday, September 16
2:30 PM

Video Consultation

Include:

[ Add to Calendar ]

[ View Appointment ]

[ Return to Dashboard ]

Also show:

"Your doctor can review your pre-consultation information before the appointment."

---

# 16. SCREEN 09 — UPCOMING APPOINTMENT

Create an appointment dashboard card.

Example:

## Upcoming Consultation

Dr. Sarah Johnson
General Medicine

Tomorrow
2:30 PM

Video Consultation

Status:
Confirmed

Buttons:

[ View Details ]

[ Join Consultation ]

The Join button should become visually prominent when the appointment is close to its scheduled time.

---

# 17. SCREEN 10 — VIDEO CONSULTATION

Create the Healthitude consultation interface.

Desktop layout:

```text
┌──────────────────────────────────────────────┐
│ Healthitude             Consultation 00:18:42│
├──────────────────────────────┬───────────────┤
│                              │ Patient Info   │
│                              │               │
│       VIDEO AREA             │ Symptoms      │
│                              │               │
│                              │ Medical       │
│                              │ History       │
│                              │               │
│                              │ Documents     │
├──────────────────────────────┴───────────────┤
│ 🎤  📹  🖥  ⋯                 End Consultation │
└──────────────────────────────────────────────┘
```

The UI should include:

* Patient video
* Doctor video
* Microphone control
* Camera control
* Screen sharing
* More options
* End consultation
* Connection status
* Consultation timer

Create a side panel for patient information.

---

# 18. SCREEN 11 — DOCTOR CONSULTATION NOTES

Create a doctor-facing interface.

Title:

## "Consultation"

Display patient information at the top.

Sections:

### Patient summary

Show the pre-consultation information.

### Consultation notes

Large rich-text input.

Placeholder:

"Document your observations, discussion, and clinical assessment..."

### Diagnosis

Allow the doctor to add one or multiple diagnoses.

### Prescription

Create an "Add medication" interface.

Fields:

* Medication
* Dosage
* Frequency
* Duration
* Instructions

### Doctor recommendations

Textarea.

### Follow-up

Options:

* No follow-up required
* Follow-up in 1 week
* Follow-up in 2 weeks
* Follow-up in 1 month
* Custom date

Button:

[ Complete Consultation ]

---

# 19. SCREEN 12 — CONSULTATION SUMMARY

Create the patient-facing consultation result page.

Title:

## "Consultation Summary"

Display:

Doctor:

Dr. Sarah Johnson

Date:

September 16, 2026

### Consultation Notes

Display the doctor's notes.

### Diagnosis

Display diagnosis cards.

### Prescription

Show medication cards containing:

Medication
Dosage
Frequency
Duration
Instructions

### Doctor's Recommendations

Display recommendations.

### Follow-up

Next appointment:

October 16, 2026

Button:

[ Schedule Follow-up ]

---

# 20. SCREEN 13 — MEDICAL RECORD

Create a patient medical history interface.

Title:

## "My Medical Records"

Create timeline-based consultation history.

Example:

September 16, 2026

General Consultation
Dr. Sarah Johnson

Diagnosis
Prescription
Consultation notes

[ View Details ]

---

August 02, 2026

Follow-up Consultation
Dr. Michael Ade

Diagnosis
Prescription

[ View Details ]

Allow filtering by:

* Date
* Doctor
* Specialty
* Consultation type

---

# 21. DOCTOR DASHBOARD

Create a separate doctor-facing dashboard.

Include:

### Overview

Cards:

* Today's appointments
* Upcoming consultations
* Completed consultations
* Pending reviews

### Today's Appointments

Display appointment cards.

Each should show:

Patient name
Reason for visit
Time
Consultation type
Status

Buttons:

[ View Patient ]

[ Start Consultation ]

---

# 22. PATIENT PRE-CONSULTATION PANEL FOR DOCTORS

When a doctor opens a patient appointment, show:

### Patient

John Doe

### Reason

General Consultation

### Symptoms

Headache
Fatigue
Dizziness

### Duration

5 days

### Severity

Moderate

### Medical History

No reported conditions.

### Medications

Paracetamol 500 mg.

### Documents

Blood_Test.pdf
Prescription.jpg

Buttons:

[ View Document ]

[ Start Consultation ]

---

# 23. RESPONSIVE DESIGN

The entire interface must be responsive.

### Desktop

Use:

* Sidebar
* Main content
* Multi-column layouts
* Doctor information panels
* Calendar + time slot layouts

### Tablet

Adapt the layout while maintaining clear hierarchy.

### Mobile

Use:

* Bottom navigation where appropriate
* Stacked cards
* Horizontal date scrolling
* Full-width buttons
* Collapsible sections
* Mobile-friendly medical intake forms
* Full-screen consultation interface

Do not simply shrink the desktop layout.

Design intentional mobile layouts.

---

# 24. COMPONENT SYSTEM

Build reusable components instead of creating each screen independently.

Create components such as:

```text
DoctorCard
DoctorProfile
VerificationBadge
SpecialtyBadge
Rating
AvailabilityCalendar
TimeSlot
ReasonCard
ProgressIndicator
MedicalIntakeForm
SymptomSelector
SeveritySelector
MedicationCard
MedicationForm
DocumentUploader
DocumentCard
AppointmentCard
AppointmentSummary
ConsultationRoom
PatientSummary
ConsultationNotes
DiagnosisCard
PrescriptionCard
FollowUpCard
MedicalRecordTimeline
```

---

# 25. UI STATES

Create visual states for:

* Default
* Hover
* Active
* Selected
* Disabled
* Loading
* Success
* Error
* Empty
* Uploading
* Uploaded
* Appointment confirmed
* Appointment cancelled
* Appointment completed

Use realistic placeholder data so the screens look complete.

---

# 26. IMPORTANT UI RULES

Do not implement Calendly.

Do not embed Calendly.

Do not make the interface dependent on Calendly.

The scheduling UI should visually belong entirely to Healthitude.

Do not implement backend functionality at this stage.

Do not implement real medical diagnosis logic.

Do not implement AI diagnosis.

Do not invent clinical recommendations.

Use placeholder/sample medical information strictly for demonstrating the UI.

The objective is to create a **complete, production-quality UI system** that can later be connected to Healthitude's backend.

---

# 27. FINAL DELIVERABLE

The finished UI should allow a user to visually experience the entire Healthitude telemedicine journey:

```text
Doctor Discovery
       ↓
Doctor Profile
       ↓
Reason for Visit
       ↓
Medical Intake
       ↓
Document Upload
       ↓
Review Information
       ↓
Select Date & Time
       ↓
Appointment Confirmation
       ↓
Upcoming Appointment
       ↓
Video Consultation
       ↓
Doctor Notes
       ↓
Diagnosis
       ↓
Prescription
       ↓
Follow-up
       ↓
Medical Records
```

Build this as a cohesive Healthitude product rather than a collection of unrelated pages.

Prioritize **visual consistency, component reusability, responsive layouts, spacing, typography, hierarchy, accessibility, and polished states**.

UX optimization and backend functionality will be handled in a later phase.

This prompt is deliberately UI-focused. It gives you the **entire surface area you need to design first**, while leaving the actual appointment logic, database, authentication, payments, video infrastructure, and clinical workflows for the next phase.
