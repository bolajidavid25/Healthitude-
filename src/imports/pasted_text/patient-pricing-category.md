Yes. If your priority is simplicity and unambiguous identification, I agree with you.

We should make the rule very simple:

Every Healthitude patient has exactly ONE primary patient category.

Even if the person qualifies for several categories, Healthitude assigns one category as their identity for the platform.

Recommended precedence

I would use this order:

Elderly
Nursing/Breastfeeding Mother
Student
Civil Servant
Corporate/Company Member
NHIS User
Insurance Member
General Patient

So, for example:

Person qualifies as	Healthitude category
Student + NHIS	Student
Student + Insurance	Student
Civil Servant + NHIS	Civil Servant
Corporate employee + Insurance	Corporate Member
Elderly + NHIS	Elderly
Nursing mother + Student	Nursing Mother
Elderly + Civil Servant + Insurance	Elderly
No special category	General Patient
Why I put Elderly and Nursing Mother first

These categories represent special care populations, so I would give them precedence over employment/financial categories.

But one important distinction remains:

Nursing Mother ≠ Emergency.

Her patient category would be:

Nursing Mother

while her current medical status could still be:

Routine / Urgent / Emergency.

If she actually needs emergency care, Break-Glass activates regardless of her category.

The database becomes extremely simple
Patient
│
├── category
│      ├── GENERAL
│      ├── STUDENT
│      ├── NHIS
│      ├── CIVIL_SERVANT
│      ├── CORPORATE
│      ├── INSURANCE
│      ├── ELDERLY
│      └── NURSING_MOTHER
│
└── clinical_priority
       ├── ROUTINE
       ├── URGENT
       └── EMERGENCY

And category can contain only one value.

If someone qualifies for multiple categories, the system applies the predefined precedence rule and assigns one.

That is much cleaner for the MVP and avoids ambiguity across the UI, database, analytics, partnerships, and patient identification.

im saying this for the financial aspect 

of course doctor and other patient will be getting paid and the category will determine the pricing of each patient 

Exactly. Now the purpose of the single category is clear: it is primarily a commercial/pricing classification, not a clinical classification.

In that case, I agree even more strongly with your decision to give every patient exactly one billing category.

Healthitude Patient Pricing Category

Every patient has:

PATIENT
   ↓
ONE PRICING CATEGORY
   ↓
Determines applicable pricing

For example:

Patient category	Possible pricing model
General Patient	Standard price
Student	Discounted/student price
NHIS User	NHIS/approved pricing
Civil Servant	Civil-service partner pricing
Corporate Member	Corporate negotiated pricing
Insurance Member	Insurance/coverage pricing
Elderly	Special/discounted pricing
Nursing Mother	Maternal-care pricing

The exact percentages should be determined by Healthitude's partnerships and business agreements.

The precedence rule should therefore be extremely simple

If someone qualifies for multiple categories, Healthitude assigns one billing category according to a fixed precedence hierarchy.

For example:

NURSING MOTHER
       ↑
    ELDERLY
       ↑
    STUDENT
       ↑
 CIVIL SERVANT
       ↑
   CORPORATE
       ↑
     NHIS
       ↑
  INSURANCE
       ↑
    GENERAL

But I would actually make this configurable by the Healthitude administration rather than permanently hard-code it.

Why?

Because your business partnerships may change.

For example, today:

Student → 20% discount

But tomorrow your university partner might negotiate:

Student → 40% coverage

The pricing engine should be able to change the category rules without rebuilding the application.

More importantly: category should determine the patient's price

Let's say the standard consultation is:

₦10,000

Healthitude's pricing engine could determine:

Patient category
       ↓
STUDENT
       ↓
Student consultation rate
       ↓
₦7,000

Another patient:

Patient category
       ↓
CORPORATE
       ↓
Company agreement
       ↓
₦8,000 patient responsibility

And an insurance patient:

Patient category
       ↓
INSURANCE
       ↓
Coverage verification
       ↓
Insurance covers agreed portion
       ↓
Patient pays remaining amount
But I would separate "Category" from "Price"

This is an important architecture decision.

Don't do:

category = STUDENT
price = 7000

because prices will change.

Instead:

PATIENT
   ↓
category = STUDENT
   ↓
PRICING PLAN
   ↓
SERVICE
   ↓
CURRENT PRICE

So you could have:

STUDENT PRICING PLAN

Consultation       ₦7,000
Specialist         ₦10,000
Follow-up          ₦5,000

while:

GENERAL PRICING PLAN

Consultation       ₦10,000
Specialist         ₦15,000
Follow-up          ₦7,000

This makes the platform much easier to maintain.

And this connects directly to paying doctors

The patient's category can influence:

What the patient pays

and separately:

What the professional earns

For example:

Patient
   ↓
Student
   ↓
Consultation
   ↓
Patient pays ₦7,000
             │
             ▼
       Healthitude
             │
       Revenue split
        /          \
       ▼            ▼
   Doctor         Healthitude
   ₦5,000          ₦2,000

Those numbers are just examples—the actual split would be a business decision.

For a corporate partnership:

Corporate patient
       ↓
Company covers 70%
       ↓
Patient covers 30%
       ↓
Doctor/Healthitude settlement

So we eventually need a Billing & Settlement System, not merely a pricing field.

This also gives us a clean distinction

We now have:

Patient Category

Why does this patient receive this pricing?

Student
NHIS
Civil Servant
Corporate
Insurance
Elderly
Nursing Mother
General
Clinical Priority

How urgently does this patient need care?

Routine
Urgent
Emergency
Professional Role

What is the healthcare professional allowed to do?

Doctor
Nurse
Pharmacist
Records Officer
...

These three systems should remain separate.

So I would update our requirement to:

Every Healthitude patient shall have exactly one primary pricing category. The category is assigned during patient registration/verification and determines the applicable pricing, discounts, subsidies, insurance/partner coverage, or other financial arrangements for healthcare services. If a patient qualifies for multiple categories, Healthitude shall apply a predefined category-precedence rule to assign one category.

That is much cleaner.

And yes — this means patient categorization is now directly connected to Healthitude's revenue model, including consultation fees, specialist fees, service charges, partner subsidies, insurance coverage, and eventually professional payment/settlement.

now lets generate the requirement and the build for the phase 1 of the project healthitude, include all the transition diagram use case diagram and data flow diagram and generate the output in form of word doc 

note: make sure any thing needed for the first phase build is present in the requirement 
Analysis errored
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from pathlib import Path

out = Path("/mnt/data/Healthitude_Phase_1_Requirements_and_Build_Specification.docx")

doc = Document()
sec = doc.sections[0]
sec.top_margin = Inches(0.65)
sec.bottom_margin = Inches(0.65)
sec.left_margin = Inches(0.75)
sec.right_margin = Inches(0.75)

styles = doc.styles
styles["Normal"].font.name = "Times New Roman"
styles["Normal"].font.size = Pt(11)
for s in ["Title", "Heading 1", "Heading 2", "Heading 3"]:
    styles[s].font.name = "Times New Roman"

def set_cell_shading(cell, fill="D9EDE7"):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tcPr.append(shd)

def heading(text, level=1):
    doc.add_heading(text, level=level)

def p(text="", bold_prefix=None):
    para = doc.add_paragraph()
    if bold_prefix and text.startswith(bold_prefix):
        r = para.add_run(bold_prefix)
        r.bold = True
        para.add_run(text[len(bold_prefix):])
    else:
        para.add_run(text)
    return para

def bullets(items, level=0):
    for item in items:
        para = doc.add_paragraph(style="List Bullet" if level == 0 else "List Bullet 2")
        para.add_run(item)

def numbered(items):
    for item in items:
        para = doc.add_paragraph(style="List Number")
        para.add_run(item)

def table(headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.style = "Table Grid"
    for i,h in enumerate(headers):
        c=t.rows[0].cells[i]
        c.text=h
        set_cell_shading(c)
        c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
        for r in c.paragraphs[0].runs: r.bold=True
    for row in rows:
        cells=t.add_row().cells
        for i,val in enumerate(row):
            cells[i].text=str(val)
            cells[i].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
    return t

def diagram(title, lines):
    heading(title, 2)
    box = doc.add_table(rows=1, cols=1)
    box.style = "Table Grid"
    cell=box.cell(0,0)
    cell.text=""
    for line in lines:
        para=cell.add_paragraph()
        para.alignment=WD_ALIGN_PARAGRAPH.CENTER
        run=para.add_run(line)
        run.font.name="Consolas"
        run.font.size=Pt(9)
    doc.add_paragraph()

# Title
title=doc.add_paragraph()
title.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=title.add_run("HEALTHITUDE")
r.bold=True; r.font.size=Pt(24)
sub=doc.add_paragraph()
sub.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=sub.add_run("PHASE 1 — REQUIREMENTS & BUILD SPECIFICATION")
r.bold=True; r.font.size=Pt(16)
p("Web Healthcare Continuity and Patient Care Platform",)
p("Requirements baseline for the first build phase",)
p("Prepared for: Healthitude Project",)
p("Version: 1.0 | September 2026",)
doc.add_page_break()

heading("Document Control",1)
table(["Item","Value"],[
    ["Product","Healthitude"],
    ["Phase","Phase 1 — Requirements & First Build"],
    ["Platform","Responsive Web Application"],
    ["Document purpose","Define the complete functional, security, data, workflow, and implementation requirements needed to build the Phase 1 foundation."],
    ["Primary users","Patients, Doctors, Nurses, Pharmacists, Medical/Health Records Officers, System Administrators"],
    ["Architecture principle","Secure, auditable, role-aware healthcare platform with verified professionals and controlled clinical data access."],
    ["Status","Approved Phase 1 requirements baseline"],
])

heading("1. Executive Summary",1)
p("Healthitude is a healthcare continuity platform designed to bridge the gap between physical hospital or clinic encounters. The Phase 1 web application establishes the trusted foundation on which later clinical, financial, AI, and mobile capabilities can be built.")
p("The first build must provide a usable and secure patient-facing experience, professional onboarding and verification, controlled clinical records, patient-provider relationships, complaint routing, medication management, appointments, patient categories and pricing foundations, notifications, emergency Break-Glass access, auditability, and a bounded AI health-information assistant.")
p("Healthitude is not a replacement for hospitals or licensed clinicians. It must not autonomously diagnose, prescribe, alter prescriptions, or represent AI output as clinical judgment.")

heading("2. Product Goals",1)
bullets([
"Provide continuity of healthcare information between physical care encounters.",
"Give patients a single place to submit complaints, view verified records, manage medication adherence, and arrange appointments.",
"Ensure clinical information is created or changed only by appropriately authorized healthcare professionals.",
"Ensure only verified and active healthcare professionals receive clinical privileges.",
"Connect patients to a primary doctor and allow appropriate referral to specialists.",
"Provide an emergency Break-Glass pathway that can be initiated by the patient and rapidly accepted by a qualified verified doctor.",
"Support a single primary patient pricing category for simple and unambiguous financial rules.",
"Create an auditable security model suitable for sensitive health information.",
"Establish a technical foundation that can later support mobile applications, advanced billing, insurance/NHIS integrations, telemedicine, and richer AI capabilities."
])

heading("3. Scope of Phase 1",1)
table(["In Scope","Phase 1 Requirement"],[
["Accounts","Registration, login, logout, password reset, session management, profile management."],
["Patient onboarding","Personal information, emergency contact, patient category selection/verification, consent and account status."],
["Professional onboarding","Profession-specific credential submission, identity/qualification/licence information, verification workflow and status."],
["Professional access","Role-based permissions plus patient relationship and contextual access checks."],
["Clinical records","Read-only patient access; authorized professional creation/update of clinical records; immutable audit history."],
["Patient complaints","Patient submits symptoms/complaints; primary doctor receives them; doctor handles or refers/escalates."],
["Specialist routing","Qualified specialist discovery/acceptance for appropriate referrals or requests."],
["Medication","Professional prescription records, patient reminders, taken/skipped adherence logging, refill reminders."],
["Appointments","Appointment request/scheduling integration using Calendly in V1."],
["Emergency","Patient-initiated Break-Glass emergency request and verified professional response."],
["Pricing foundation","Exactly one primary pricing category per patient; category maps to pricing plans, not hard-coded prices."],
["AI assistant","General health information/navigation assistant with explicit safety boundaries."],
["Notifications","Email/in-app notifications for critical workflow events."],
["Audit/security","Access logs, emergency-access logs, credential changes, security events."],
["Administration","User management, professional verification review, category verification, pricing-plan configuration foundation, audit review."],
])
p("Out of scope for the first build unless explicitly added later: autonomous diagnosis, autonomous prescribing, full in-app clinician messaging, advanced drug-interaction engine, insurance claims automation, NHIS API integration, video consultation infrastructure, and full hospital EMR replacement.")

heading("4. Core Actors and Responsibilities",1)
table(["Actor","Responsibilities / permissions"],[
["Patient","Manage own account; submit complaints; view verified clinical records; view prescriptions; log adherence; request appointments; request specialist care; initiate Break-Glass; use bounded AI assistant; view applicable pricing/coverage."],
["Doctor","After verification, access authorized patient records; review complaints; record clinical data; diagnose/treat within professional scope; prescribe; accept/refuse/referral workflows; provide specialist care; respond to Break-Glass."],
["Nurse","After verification, access records within assigned scope; record authorized nursing observations and care information; participate in care workflows."],
["Pharmacist","After verification, access medication-related information within scope; support medication-related workflows without altering clinician prescriptions."],
["Records Officer","Maintain administrative medical-record functions within explicit permissions; cannot create clinical diagnoses/prescriptions unless separately qualified and authorized."],
["System Administrator","Manage platform configuration, users, verification workflow, pricing-plan configuration, security and audit operations; must not casually access clinical data."],
["Verification Reviewer","Review submitted professional credentials and determine verification status. This can be an administrative function with controlled privileges."],
["AI Assistant","Provide general health information and navigation; never act as a clinician or modify clinical records."],
])

heading("5. Trust and Data Ownership Model",1)
p("Healthitude must explicitly distinguish patient-reported information from clinically verified information.")
table(["Data class","Examples","Who can create/update?","Patient access"],[
["Patient-reported","Complaints, symptoms, pain score, mood, fatigue, questions, adherence, patient notes","Patient; limited system workflow","Read/write own submissions"],
["Clinically verified","Vitals, blood group, diagnoses, treatment, prescriptions, labs, professional notes","Authorized verified healthcare professionals","Read-only; correction request rather than direct editing"],
["Administrative","Account status, verification status, pricing category, appointments, notifications","Authorized system/admin roles","View applicable own information"],
["Audit/security","Access events, Break-Glass events, credential changes","System-generated / authorized admin processes","Restricted; not directly editable"],
])

heading("6. Patient Categories and Financial Model",1)
p("Every patient has exactly ONE primary pricing category. This rule exists to prevent ambiguity in billing and coverage. A patient may qualify for several conditions in real life, but Healthitude uses one active category for pricing.")
bullets([
"Student — verified educational institution.",
"NHIS User — verified eligible NHIS status.",
"Civil Servant — verified employment/status where applicable.",
"Corporate/Company Member — verified partner-company membership.",
"Insurance Member — verified insurance/coverage relationship.",
"Elderly — verified age/category.",
"Nursing/Breastfeeding Mother — verified category for applicable maternal services.",
"General Patient — default when no special category applies."
])
p("The exact precedence order between qualifying categories is a business rule that must be approved before production pricing is activated. The recommended architecture should store category and pricing plan separately.")
diagram("Pricing Decision Flow",[
"Patient",
"  │",
"  ▼",
"Verified eligibility evidence",
"  │",
"  ▼",
"ONE primary pricing category",
"  │",
"  ▼",
"Pricing / coverage plan",
"  │",
"  ├── Patient responsibility",
"  ├── Partner / insurer / programme contribution",
"  └── Provider + Healthitude settlement"
])
p("Clinical urgency is independent of pricing category. Routine, urgent, and emergency status must never be inferred from a patient's financial category.")

heading("7. Functional Requirements",1)
frs = [
("FR-001","Account registration and authentication","System shall allow users to register, authenticate, log out, reset credentials, and maintain secure sessions."),
("FR-002","Patient profile","Patients shall manage permitted demographic/contact fields and emergency-contact information."),
("FR-003","Professional application","Healthcare professionals shall submit profession-specific identity, education, licence/registration, specialty and affiliation evidence where applicable."),
("FR-004","Professional verification","Only verified active professionals shall receive clinical privileges. Verification shall support PENDING, UNDER_REVIEW, VERIFIED, VERIFIED_WITH_RESTRICTIONS, SUSPENDED, EXPIRED, REJECTED and REVOKED."),
("FR-005","Credential expiry","The system shall track credential expiry/revalidation dates and restrict clinical privileges when required credentials are expired or revoked."),
("FR-006","Authorization","Every protected clinical action shall evaluate role, patient relationship, permission, context and current account/credential status."),
("FR-007","Patient-provider relationship","System shall support primary doctor, specialist and other provider relationships with status, scope and start/end dates."),
("FR-008","Complaint submission","Patient shall submit complaint/symptom information and track status."),
("FR-009","Primary doctor routing","New routine complaints shall route to the patient's primary doctor when one exists."),
("FR-010","Referral/escalation","Primary doctor shall be able to handle within scope or refer/escalate to an appropriate specialist."),
("FR-011","Specialist acceptance","Specialist requests shall only be accepted by qualified active verified professionals. Emergency requests must not depend on a race between doctors."),
("FR-012","Clinical record creation","Authorized professionals shall create clinically verified records within their scope."),
("FR-013","Clinical record correction","Patients shall not directly edit clinical records; they may submit a correction/report request."),
("FR-014","Clinical history","Authorized users shall view relevant clinical history according to access scope."),
("FR-015","Prescription","Authorized prescribers shall create prescriptions; patients can view them but cannot alter them."),
("FR-016","Medication adherence","Patients shall log taken/skipped doses and receive reminders."),
("FR-017","Refill reminder","System shall support configurable refill reminders based on prescription data."),
("FR-018","Appointment","Patients shall request/schedule appointments through the V1 scheduling integration; appointment status shall be synchronized/stored as appropriate."),
("FR-019","AI assistant","AI assistant shall answer general health-information and navigation questions while enforcing safety restrictions."),
("FR-020","AI safety","AI shall not diagnose, prescribe, alter dosage, stop medication, override clinicians, or present uncertain clinical advice as certainty."),
("FR-021","Break-Glass initiation","Patient shall be able to initiate an urgent emergency request."),
("FR-022","Break-Glass professional response","Verified qualified professionals shall be alerted and one valid responder may accept the emergency case."),
("FR-023","Emergency access","On valid Break-Glass acceptance, the attending professional shall receive rapid access to the defined Emergency Snapshot without requiring a pre-access justification form."),
("FR-024","Emergency audit","Every Break-Glass event shall automatically create an immutable audit trail including requester/responder, time, access scope and outcome."),
("FR-025","Emergency fallback","If an accepted responder fails or releases the case, another qualified professional may take over according to controlled workflow."),
("FR-026","Patient category","System shall maintain exactly one active primary pricing category per patient."),
("FR-027","Category verification","Where a category requires evidence, the system shall support verification status and evidence review."),
("FR-028","Pricing plan","System shall map patient category to configurable pricing/coverage plans; prices must not be hard-coded into patient identity."),
("FR-029","Notifications","System shall notify users of important workflow events such as complaint routing, appointment changes, verification outcomes, prescriptions and emergency status."),
("FR-030","Audit logging","Sensitive access and changes shall be recorded in tamper-resistant audit logs."),
("FR-031","Administration","Authorized administrators shall manage users, professional verification, category verification, pricing plans, system configuration and audit review."),
("FR-032","Search/discovery","Qualified professionals shall be discoverable by appropriate specialty/availability/status without exposing unnecessary patient information."),
("FR-033","Data export/records access","Patients shall be able to view and, where technically appropriate, export a copy of their own accessible records."),
("FR-034","Consent and policy acknowledgement","System shall capture required terms, privacy notices and healthcare-specific acknowledgements with version and timestamp."),
("FR-035","Deactivation","Account suspension/deactivation shall preserve required clinical/audit records while preventing unauthorized access."),
]
table(["ID","Requirement","Acceptance intent"],frs)

heading("8. Key Workflow / State Transition Diagrams",1)
diagram("8.1 Professional Verification State Transition",[
"PENDING",
"  │ submit credentials",
"  ▼",
"UNDER_REVIEW",
"  ├── insufficient/invalid ──► REJECTED",
"  ├── qualified ─────────────► VERIFIED",
"  └── limited evidence ─────► VERIFIED_WITH_RESTRICTIONS",
"",
"VERIFIED ── credential expires ──► EXPIRED",
"VERIFIED ── serious issue ───────► SUSPENDED",
"VERIFIED/SUSPENDED ─ revoke ─────► REVOKED",
"REJECTED ─ resubmit ─────────────► PENDING"
])
diagram("8.2 Patient Complaint Transition",[
"NEW",
" │",
" ▼",
"ROUTED TO PRIMARY DOCTOR",
" │",
" ├── accepted ──► UNDER_REVIEW ──► RESOLVED",
" │                    │",
" │                    └──► REFERRED_TO_SPECIALIST",
" │                                  │",
" │                                  ▼",
" │                            SPECIALIST_REVIEW",
" │                                  │",
" └────────────────────────────────► RESOLVED",
"",
"At any stage: CANCELLED / CLOSED according to policy"
])
diagram("8.3 Appointment Transition",[
"REQUESTED ─► PENDING_CONFIRMATION ─► CONFIRMED ─► COMPLETED",
"     │                 │                  │",
"     └──────────────► CANCELLED ◄─────────┘",
"                           │",
"                           ▼",
"                       NO_SHOW (optional)",
])
diagram("8.4 Medication / Adherence Transition",[
"PRESCRIBED ─► ACTIVE",
"                 │",
"                 ├── dose recorded TAKEN",
"                 ├── dose recorded SKIPPED",
"                 ├── refill requested/reminder",
"                 └── prescription ended ─► COMPLETED/STOPPED",
"",
"Patient adherence events do not change the clinician's prescription."
])
diagram("8.5 Break-Glass Emergency Transition",[
"NO EMERGENCY",
"    │ patient requests urgent help",
"    ▼",
"EMERGENCY REQUEST CREATED",
"    │",
"    ▼",
"VERIFIED DOCTORS ALERTED",
"    │",
"    ├── qualified doctor accepts ─► ATTENDING",
"    │                                  │",
"    │                                  ▼",
"    │                           EMERGENCY ACCESS",
"    │                                  │",
"    │                                  ▼",
"    │                             CARE PROVIDED",
"    │                                  │",
"    │                                  ▼",
"    │                               CLOSED",
"    │",
"    └── timeout/release ─► AVAILABLE FOR NEXT QUALIFIED RESPONDER",
"",
"Every emergency access automatically creates an audit event."
])

heading("9. Use Case Diagram",1)
diagram("System Use Case View",[
"                         +--------------------------------------+",
"                         |             HEALTHITUDE              |",
"                         |                                      |",
"Patient ---------------->| Register / Login                    |",
"Patient ---------------->| Manage Profile & Category           |",
"Patient ---------------->| Submit Complaint / Symptoms         |",
"Patient ---------------->| View Clinical Records               |",
"Patient ---------------->| View Prescriptions / Log Adherence |",
"Patient ---------------->| Book Appointment                    |",
"Patient ---------------->| Request Specialist                   |",
"Patient ---------------->| Initiate BREAK-GLASS                |",
"Patient ---------------->| Use AI Health Assistant             |",
"                         |                                      |",
"Doctor ----------------->| Review Complaints / Records         |",
"Doctor ----------------->| Create Clinical Records             |",
"Doctor ----------------->| Diagnose / Treat / Prescribe       |",
"Doctor ----------------->| Refer to Specialist                 |",
"Doctor ----------------->| Accept Emergency                    |",
"                         |                                      |",
"Nurse ------------------>| Record Authorized Care Data         |",
"Pharmacist ------------->| Access Medication Workflow          |",
"Records Officer -------->| Maintain Authorized Record Data     |",
"                         |                                      |",
"Admin ------------------>| Verify Professionals                |",
"Admin ------------------>| Manage Users / Pricing / Audit      |",
"                         +--------------------------------------+",
"                                      ^",
"                                      |",
"                         AI Assistant (bounded)",
"                         Calendly (scheduling integration)"
])

heading("10. Data Flow Diagrams",1)
diagram("10.1 Context-Level DFD",[
"Patient ───────────────┐",
"                       │",
"Doctor / Nurse /       │",
"Pharmacist / Records ──┼──► [ HEALTHITUDE PLATFORM ] ──► Notifications",
"Officer                │             │",
"                       │             ├──► Clinical Data Store",
"Administrator ─────────┘             ├──► User/Auth Store",
"                                     ├──► Verification Store",
"Calendly ◄───────────────────────────┤",
"                                     ├──► Pricing/Category Store",
"                                     ├──► Audit/Security Store",
"                                     └──► AI Safety Gateway / AI Service"
])
diagram("10.2 Level-1 DFD",[
"Patient",
"  │ registration / complaints / adherence / appointment / emergency",
"  ▼",
"(1) Identity & Patient Management ─────► User/Patient DB",
"  │",
"  ├────────► (2) Verification & Authorization ◄──── Professional",
"  │                         │                         credentials",
"  │                         ▼",
"  │                    Verification DB",
"  │",
"  ├────────► (3) Clinical Care ─────────────► Clinical Record DB",
"  │                  │",
"  │                  ├── complaints",
"  │                  ├── encounters",
"  │                  ├── vitals",
"  │                  ├── diagnoses",
"  │                  └── prescriptions",
"  │",
"  ├────────► (4) Medication & Adherence ───► Medication DB",
"  │",
"  ├────────► (5) Appointments ─────────────► Calendly / Appointment DB",
"  │",
"  ├────────► (6) Emergency Break-Glass ────► Emergency + Audit DB",
"  │",
"  ├────────► (7) Category & Pricing ───────► Pricing DB",
"  │",
"  └────────► (8) AI Assistant ─────────────► AI Safety Gateway",
"",
"All sensitive modules ─────────────► (9) Audit & Security ─► Audit DB"
])
diagram("10.3 Emergency Break-Glass DFD",[
"Patient",
"  │ emergency request",
"  ▼",
"[Emergency Controller]",
"  │ validate identity + create case",
"  ▼",
"[Emergency Queue] ───► [Verified Professional Notification]",
"  │                              │",
"  │ qualified acceptance         ▼",
"  └──────────────────────► [Emergency Access Controller]",
"                                 │",
"                                 ▼",
"                         [Emergency Snapshot]",
"                                 │",
"                                 ▼",
"                          Attending Doctor",
"                                 │",
"                                 ▼",
"                         [Automatic Audit Log]"
])

heading("11. Data Requirements / Core Entities",1)
table(["Entity","Minimum Phase 1 fields / purpose"],[
["User","id, email/phone, password credential reference, role(s), account status, timestamps."],
["PatientProfile","user_id, demographics, emergency contact, primary category, category verification status."],
["ProfessionalProfile","user_id, profession, specialty, registration/licence number, institution/qualification, affiliation, verification status, expiry dates."],
["CredentialEvidence","professional_id, evidence type, secure file/reference, review status, reviewer, timestamps."],
["ProviderRelationship","patient_id, professional_id, relationship type, status, scope, start/end dates, created_by."],
["Complaint","patient_id, title, description, symptoms, severity, urgency, status, assigned provider, timestamps."],
["ClinicalEncounter","patient, provider, encounter type, date/time, notes, status."],
["ClinicalRecord","patient, encounter, record type, value/content, author, verification metadata, timestamps."],
["VitalSign","patient/encounter, type, value, unit, measured_at, recorded_by."],
["Diagnosis","patient/encounter, code/description, status, author, date."],
["Prescription","patient, prescriber, medication, dose, route, frequency, duration, instructions, status."],
["MedicationAdherence","prescription, scheduled dose, taken/skipped/other status, timestamp, patient note."],
["Appointment","patient, provider, external scheduling ID, start/end, status, appointment type."],
["EmergencyCase","patient, requester, responder, status, opened/accepted/closed timestamps, access scope."],
["PatientCategoryEvidence","patient, category, evidence reference, status, reviewer, expiry."],
["PricingPlan","plan, category, service, price/coverage rule, effective dates, status."],
["Notification","recipient, event type, title/body, read status, delivery channel, timestamps."],
["AuditEvent","actor, target, action, reason/context where applicable, timestamp, IP/device/session metadata where lawful and appropriate."],
["AIInteraction","user, timestamp, user prompt metadata, safety classification, response metadata; avoid storing unnecessary sensitive content."],
["ConsentRecord","user, policy/version, consent/acknowledgement type, timestamp, evidence."],
])

heading("12. Authorization Model",1)
p("Phase 1 shall not use simple role-only authorization for clinical data. The authorization service should evaluate multiple dimensions.")
diagram("Authorization Decision",[
"Role",
"  +",
"Patient-provider relationship",
"  +",
"Requested permission/action",
"  +",
"Clinical/contextual conditions",
"  +",
"Professional verification + active status",
"  +",
"Emergency state (if applicable)",
"  │",
"  ▼",
"ALLOW / DENY",
"  │",
"  ▼",
"Audit sensitive decisions"
])
bullets([
"Patients may read their own accessible records but cannot directly modify clinically verified records.",
"Professionals may access only patients and actions permitted by relationship, role, scope, and context.",
"Emergency access is a special controlled pathway, not a blanket permission.",
"Administrators should have minimum necessary access to clinical content.",
"Every sensitive access must be auditable."
])

heading("13. Professional Verification Requirements",1)
bullets([
"Capture legal identity and contact information.",
"Capture government-issued identity evidence according to approved policy.",
"Capture school/institution and qualification evidence.",
"Capture professional registration/licence and registration number.",
"Capture specialty and specialist qualification where applicable.",
"Capture current facility/affiliation where relevant.",
"Record verifier, verification decision, evidence, timestamp and expiry.",
"Support suspension, expiry and revocation.",
"Do not grant clinical privileges before verification is approved.",
"Where evidence cannot be confidently verified, keep the account unverified or under review."
])

heading("14. Emergency Break-Glass Requirements",1)
bullets([
"Patient can initiate emergency assistance from the web application.",
"Emergency request must identify the patient and capture the immediate complaint/need.",
"System alerts appropriate verified professionals.",
"A verified qualified doctor can accept even without a prior patient-provider relationship.",
"No pre-access justification form should delay the doctor in V1.",
"System presents a minimum necessary Emergency Snapshot.",
"Only one attending responder should own the active case at a time; fallback takeover is supported.",
"Every access is automatically logged.",
"Emergency status must be independent from patient pricing category.",
"Break-Glass does not remove professional accountability; it only accelerates authorized emergency access."
])

heading("15. Non-Functional Requirements",1)
nfr = [
("NFR-001","Security","Encrypt data in transit and at rest; secure secrets; protect sessions; implement least privilege."),
("NFR-002","Privacy","Collect only necessary personal/health data; implement privacy notices, consent records and controlled access."),
("NFR-003","Auditability","Sensitive clinical access, record changes, verification decisions, pricing changes and emergency access must be traceable."),
("NFR-004","Availability","Core patient and clinical workflows should be designed for high availability with graceful failure for non-critical integrations."),
("NFR-005","Performance","Normal dashboard/API interactions should target responsive operation; emergency request creation and alerting must be prioritized."),
("NFR-006","Reliability","Clinical writes should be transactional and avoid partial records."),
("NFR-007","Scalability","Separate application modules/services logically so later mobile apps and integrations can reuse APIs."),
("NFR-008","Accessibility","Responsive design and accessible forms/navigation should target WCAG-aligned practices."),
("NFR-009","Observability","Centralized application logs, error tracking, metrics and security alerts."),
("NFR-010","Backup/Recovery","Regular encrypted backups and documented restore procedures."),
("NFR-011","Data integrity","Clinically verified records should use controlled updates/versioning rather than destructive overwrites."),
("NFR-012","Interoperability","Use stable IDs, structured clinical fields, API-first boundaries and external integration identifiers."),
("NFR-013","Maintainability","Type-safe code, modular components, validation, tests and clear separation of UI/domain/data concerns."),
("NFR-014","Localization readiness","Currency, dates, phone numbers and healthcare/payment rules should be configurable for Nigeria and later markets."),
]

table(["ID","Area","Requirement"],nfr)

heading("16. Security and Privacy Baseline",1)
bullets([
"Use secure password hashing and never store plaintext passwords.",
"Use short-lived access tokens/session controls and secure refresh/session rotation as appropriate.",
"Use server-side authorization; never rely on frontend route hiding for security.",
"Validate all inputs on the server.",
"Use rate limiting for authentication, emergency endpoints and sensitive operations.",
"Protect uploaded identity/credential documents using private storage and signed/authorized access.",
"Do not expose clinical data in URLs, client logs or analytics events unnecessarily.",
"Use encryption for sensitive data in transit and at rest.",
"Maintain audit logs that ordinary users cannot edit or delete.",
"Separate development/test data from real patient data.",
"Apply data minimization and retention rules.",
"Require explicit confirmation for high-impact administrative actions.",
"Security events such as failed login spikes, privilege changes and repeated emergency misuse should be observable."
])

heading("17. AI Assistant Requirements",1)
table(["Allowed","Prohibited"],[
["Explain medical terms","Diagnose a patient"],
["General health education","Prescribe medication"],
["Explain information already shown to the user","Change or recommend changing prescription dosage"],
["General wellness guidance","Tell a patient to stop prescribed medication"],
["Help formulate questions for clinicians","Override a clinician"],
["Help navigate Healthitude","Claim certainty where uncertainty exists"],
["Encourage appropriate professional care","Act as emergency medical decision-maker"]
])
p("The AI layer should have a safety gateway/policy layer before and after model inference. Emergency language should route users toward the Break-Glass/emergency-care workflow rather than relying on conversational AI.")

heading("18. Notifications",1)
table(["Event","Recipient","Priority"],[
["Professional verification submitted/decided","Professional / reviewer","Normal/High"],
["Complaint submitted/routed","Assigned professional","High"],
["Complaint referred","Patient + receiving professional","High"],
["Prescription created/updated","Patient","High"],
["Medication reminder","Patient","Normal"],
["Appointment confirmed/cancelled","Patient + professional","High"],
["Break-Glass created","Qualified responders","Critical"],
["Break-Glass accepted","Patient + relevant responders","Critical"],
["Pricing/category verification decision","Patient/admin","Normal"],
["Security/credential event","Affected user/admin","High"],
])

heading("19. Administration Requirements",1)
bullets([
"Admin dashboard must expose verification queues and status.",
"Admin must be able to suspend/revoke professional privileges according to policy.",
"Admin must be able to manage patient category verification.",
"Admin must configure pricing plans and effective dates without changing patient identity data.",
"Admin must review audit/security events according to authorization.",
"Admin actions affecting clinical access or pricing must themselves be audited.",
"Deletion of clinical/audit records should not be a normal admin action; retention policy should govern lifecycle."
])

heading("20. Phase 1 Build Architecture",1)
diagram("Recommended Logical Architecture",[
"[Responsive Web Client]",
"        │ HTTPS",
"        ▼",
"[API / Backend Application]",
"   ├── Auth & Session Module",
"   ├── User / Patient Module",
"   ├── Professional Verification Module",
"   ├── Authorization Module",
"   ├── Provider Relationship Module",
"   ├── Clinical Records Module",
"   ├── Complaint / Referral Module",
"   ├── Medication Module",
"   ├── Appointment Integration",
"   ├── Emergency Break-Glass Module",
"   ├── Category / Pricing Module",
"   ├── Notification Module",
"   ├── AI Safety Gateway",
"   └── Audit / Security Module",
"        │",
"        ├── Relational Database",
"        ├── Private Document/Object Storage",
"        ├── Notification Provider",
"        ├── Calendly",
"        └── AI Provider"
])

heading("21. First Build — Implementation Requirements",1)
p("The first build is complete only when the following vertical slices work end-to-end. The requirement is not merely to create screens; each slice must include UI, API/backend logic, database persistence, authorization, validation, error handling, and audit behavior where applicable.")
table(["Build slice","Definition of done"],[
["A. Foundation","Project structure, environment configuration, database connection, migrations, API conventions, error handling, logging, secure secrets and deployment environments."],
["B. Authentication","Register/login/logout/password reset/session lifecycle, protected routes and server-side authorization middleware."],
["C. Patient onboarding","Profile, emergency contact, single primary pricing category, category evidence/status where required."],
["D. Professional onboarding","Professional profile, credential uploads/references, verification queue, verification status lifecycle and privilege gating."],
["E. RBAC/ReBAC","Central authorization service/middleware; relationship checks; permission matrix; denial behavior; audit of sensitive access."],
["F. Patient-provider","Primary doctor assignment and specialist relationship creation/closure."],
["G. Complaints","Patient complaint form, routing to primary doctor, review, resolve/referral workflow and status tracking."],
["H. Clinical records","Professional-only write paths, patient read-only views, versioning/correction request, audit trail."],
["I. Medication","Prescription creation by authorized prescriber, patient read view, reminders, adherence logging."],
["J. Appointments","Calendly integration or controlled scheduling link/embedded flow, appointment record/status handling."],
["K. Emergency","Break-Glass request, responder queue, acceptance lock, Emergency Snapshot, close/release, automatic audit."],
["L. Pricing foundation","Category-to-pricing-plan mapping, effective dates, service pricing/coverage data model, patient-visible applicable price."],
["M. AI","Safe assistant UI, safety policy gateway, refusal/escalation behavior, no clinical record mutation."],
["N. Notifications","Core in-app/email notification events and delivery status."],
["O. Admin","Verification, category review, pricing configuration, user status and audit review."],
["P. Testing","Unit, integration, authorization, security, workflow/state-transition and end-to-end tests."],
])

heading("22. Required Screens for the First Build",1)
table(["Area","Screens"],[
["Public","Landing/Home, About/How it works, Login, Register, Forgot/Reset Password, Terms, Privacy."],
["Patient","Dashboard, Profile, Health Summary, Clinical Records, Complaints, Complaint Detail, Medications, Adherence, Appointments, Providers/Specialists, Pricing/Coverage, Notifications, AI Assistant, Emergency Break-Glass."],
["Professional","Professional Dashboard, Verification Status, Patients/Relationships, Complaint Queue, Patient Record, Clinical Encounter, Vitals/Clinical Data, Diagnosis/Treatment, Prescriptions, Appointments, Emergency Queue, Notifications."],
["Admin","Admin Dashboard, Professional Verification Queue, Patient Category Verification, Users, Pricing Plans, Audit Logs, System/Security Events."],
["Shared","403/Unauthorized, 404, error states, loading states, empty states, session expiry, maintenance/unavailable integration state."]
])

heading("23. Validation Rules",1)
bullets([
"Email/phone must be unique according to account policy.",
"Required identity fields must be validated server-side.",
"Professional registration numbers must follow profession-specific validation rules where known.",
"Expired/revoked professional credentials cannot grant clinical privileges.",
"Clinical record authorship must always identify the authenticated professional.",
"Prescription changes must preserve history/version information.",
"Patients cannot send arbitrary client-side values as verified clinical measurements.",
"Patient category must have at most one ACTIVE primary value.",
"Pricing plans must have effective dates and cannot silently overwrite historical prices.",
"Break-Glass acceptance must atomically claim the active case to prevent two responders from becoming the sole attending responder simultaneously.",
"All timestamps should be stored consistently (preferably UTC) and rendered in the user's configured timezone.",
"Sensitive files must never be publicly accessible."
])

heading("24. Error and Edge Cases",1)
bullets([
"Unverified professional attempts clinical access → deny and explain verification status.",
"Provider relationship ended → deny relationship-based access unless another valid permission exists.",
"Patient has no primary doctor → allow supported specialist/general-care discovery flow.",
"Complaint is outside primary doctor's scope → referral/escalation.",
"Professional credential expires during active account → restrict affected privileges and notify user/admin.",
"Break-Glass request has no responder → keep alerting/escalation state and provide appropriate emergency instructions; do not pretend care is available.",
"Two doctors attempt emergency acceptance simultaneously → atomic first valid qualified acceptance wins; others see case handled.",
"Calendly unavailable → preserve patient intent where possible and clearly show integration failure; never claim booking succeeded.",
"AI detects emergency/high-risk language → direct user to emergency pathway and appropriate professional care; do not diagnose.",
"Payment/pricing service unavailable → show price availability status rather than inventing a price.",
"Patient disputes clinical record → create correction/report request; do not modify the clinician-authored record directly.",
"Deleted/deactivated user with clinical history → retain required records and de-identify/archive only according to approved retention policy."
])

heading("25. Acceptance Criteria for Phase 1",1)
numbered([
"Patient can create and securely access an account.",
"Patient can maintain profile and exactly one primary pricing category.",
"Healthcare professional can apply for verification with required evidence.",
"Unverified professionals cannot perform protected clinical actions.",
"Verified professionals can access only authorized patient records.",
"Patient can submit a complaint and see its status.",
"Primary doctor can accept/review or refer a complaint.",
"Authorized clinician can create clinical records and prescriptions.",
"Patient can view clinical records and prescriptions but cannot edit them.",
"Patient can record medication adherence.",
"Patient can schedule/request appointments through the V1 scheduling flow.",
"Patient can initiate Break-Glass and a qualified verified doctor can accept it without a prior relationship.",
"Emergency access automatically creates an audit event.",
"Pricing category maps to a configurable pricing/coverage plan.",
"AI assistant stays within defined non-diagnostic/non-prescribing boundaries.",
"Important events generate notifications.",
"Administrative actions and sensitive access are auditable.",
"Application passes security, authorization, workflow, and core end-to-end tests.",
])

heading("26. Recommended Phase 1 Delivery Order",1)
numbered([
"Project foundation, environments and database.",
"Authentication and account lifecycle.",
"Patient onboarding and profile.",
"Professional onboarding and verification.",
"Central authorization model (RBAC + ReBAC + contextual checks).",
"Provider relationships.",
"Clinical record foundation.",
"Complaint and referral workflow.",
"Medication and adherence.",
"Appointments/Calendly.",
"Emergency Break-Glass.",
"Patient category and pricing foundation.",
"Notifications.",
"AI assistant with safety gateway.",
"Admin console and audit.",
"Security hardening, tests, deployment and Phase 1 acceptance."
])

heading("27. Phase 1 Build Deliverables",1)
bullets([
"Responsive Healthitude web application.",
"Backend/API with authenticated and authorized endpoints.",
"Relational database schema and migrations.",
"Private credential/document storage.",
"Professional verification workflow.",
"Patient/provider relationship model.",
"Clinical record and prescription model.",
"Complaint/referral workflow.",
"Medication/adherence workflow.",
"Appointment integration.",
"Break-Glass emergency workflow.",
"Patient category/pricing foundation.",
"Notification system.",
"AI safety-controlled assistant.",
"Administrative dashboard.",
"Audit and security logging.",
"Automated test suite and deployment configuration.",
"Technical documentation sufficient for Phase 2 architecture expansion."
])

heading("28. Phase 1 Build Principle",1)
p("The first build should prioritize trust, correctness, authorization and end-to-end workflow over visual complexity. A beautiful healthcare interface with weak verification, authorization or auditability is not an acceptable Phase 1 implementation. Every feature that handles health data must have a defined owner, permission boundary, validation rule, persistence model, failure state and audit behavior.")
p("Phase 1 therefore establishes the operational foundation of Healthitude: who the user is, what category they belong to financially, which professionals are trusted, whose records can be accessed, what data is clinically verified, how care flows from complaint to provider, how medication and appointments are managed, how emergencies bypass normal relationship barriers safely, and how every sensitive action remains accountable.")

heading("Appendix A — Minimum Permission Matrix",1)
table(["Action","Patient","Doctor","Nurse","Pharmacist","Records","Admin"],[
["Edit own profile","Yes","Yes","Yes","Yes","Yes","Scoped"],
["Submit complaint","Yes","No","No","No","No","No"],
["View own clinical record","Yes","Yes*","Yes*","Scoped","Scoped","Scoped"],
["Create diagnosis","No","Yes*","No","No","No","No"],
["Create prescription","No","Yes*","No","No","No","No"],
["Log medication adherence","Yes","No","No","Scoped","No","No"],
["Create clinical vitals","No","Yes*","Yes*","No","No","No"],
["Verify professional","No","No","No","No","No","Yes/Reviewer"],
["Configure pricing","No","No","No","No","No","Yes"],
["Initiate Break-Glass","Yes","Authorized professional","Authorized professional","No*","No*","Controlled"],
["Accept Break-Glass doctor case","No","Verified qualified doctor","No unless policy later allows","No","No","Controlled emergency support"],
["View audit logs","No","Scoped","Scoped","Scoped","Scoped","Yes/authorized"],
])
p("* Subject to relationship, scope, active verification and contextual authorization. The matrix is a baseline; the authorization service remains authoritative.")

heading("Appendix B — Phase 1 Definition of Done",1)
p("Phase 1 is ready for formal review when all in-scope workflows are implemented end-to-end, protected endpoints enforce the authorization model server-side, clinical data is persisted with appropriate history and auditability, professional verification gates clinical privileges, Break-Glass works as a controlled emergency pathway, pricing category is unambiguous, AI safety boundaries are enforced, integrations fail safely, and the acceptance criteria in Section 25 pass.")

doc.save(out)
print(out)


Data analysis isn't available right now. Do you want to continue without it? 

now do the data Data analysis and continue 
Analyzed
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from pathlib import Path

out = Path("/mnt/data/Healthitude_Phase_1_Requirements_and_Build_Specification.docx")

doc = Document()
sec = doc.sections[0]
sec.top_margin = Inches(0.65); sec.bottom_margin = Inches(0.65)
sec.left_margin = Inches(0.75); sec.right_margin = Inches(0.75)

for style_name in ["Normal","Title","Heading 1","Heading 2","Heading 3"]:
    doc.styles[style_name].font.name = "Times New Roman"
doc.styles["Normal"].font.size = Pt(11)

def shade(cell, fill="D9EDE7"):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd"); shd.set(qn("w:fill"), fill); tcPr.append(shd)

def H(text, level=1): doc.add_heading(text, level=level)
def P(text=""):
    doc.add_paragraph(text)
def bullets(items):
    for x in items: doc.add_paragraph(x, style="List Bullet")
def nums(items):
    for x in items: doc.add_paragraph(x, style="List Number")
def make_table(headers, rows):
    t=doc.add_table(rows=1, cols=len(headers)); t.style="Table Grid"; t.alignment=WD_TABLE_ALIGNMENT.CENTER
    for i,h in enumerate(headers):
        c=t.rows[0].cells[i]; c.text=h; shade(c); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
        for r in c.paragraphs[0].runs: r.bold=True
    for row in rows:
        cells=t.add_row().cells
        for i,v in enumerate(row): cells[i].text=str(v)
    return t
def diagram(title, lines):
    H(title,2)
    t=doc.add_table(rows=1, cols=1); t.style="Table Grid"; c=t.cell(0,0); c.text=""
    for line in lines:
        q=c.add_paragraph(); q.alignment=WD_ALIGN_PARAGRAPH.CENTER
        r=q.add_run(line); r.font.name="Consolas"; r.font.size=Pt(8.5)
    doc.add_paragraph()

# Cover
q=doc.add_paragraph(); q.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=q.add_run("HEALTHITUDE"); r.bold=True; r.font.size=Pt(25)
q=doc.add_paragraph(); q.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=q.add_run("PHASE 1 — REQUIREMENTS & BUILD SPECIFICATION"); r.bold=True; r.font.size=Pt(16)
for x in ["Web Healthcare Continuity and Patient Care Platform",
          "Complete requirements baseline and first-build specification",
          "Version 1.0 | September 2026"]:
    q=doc.add_paragraph(x); q.alignment=WD_ALIGN_PARAGRAPH.CENTER
doc.add_page_break()

H("Document Control")
make_table(["Item","Value"],[
["Product","Healthitude"],
["Phase","Phase 1 — Requirements Gathering + First Build"],
["Platform","Responsive Web Application"],
["Primary objective","Establish the secure operational foundation for continuity of patient care."],
["Primary actors","Patients, Doctors, Nurses, Pharmacists, Records Officers, Administrators"],
["Status","Phase 1 baseline"],
])

H("1. Executive Summary")
P("Healthitude is a healthcare continuity platform intended to bridge the gap between physical hospital or clinic visits. Phase 1 establishes the trusted foundation for patient accounts, professional verification, controlled clinical records, patient-provider relationships, complaints, medication, appointments, emergency Break-Glass access, patient pricing categories, notifications, AI health information, administration, security and auditability.")
P("Healthitude supports healthcare delivery; it does not replace hospitals or licensed healthcare professionals. AI must not independently diagnose, prescribe, change treatment or override professional judgment.")

H("2. Phase 1 Goals")
bullets([
"Create a secure patient and healthcare-professional identity system.",
"Verify healthcare professionals before granting clinical privileges.",
"Separate patient-reported information from clinically verified information.",
"Give patients continuity and controlled read access to their clinical records.",
"Route complaints to a primary doctor and support specialist referral.",
"Manage prescriptions and medication adherence.",
"Support appointment scheduling through Calendly in V1.",
"Provide patient-initiated emergency Break-Glass access to a qualified verified doctor.",
"Assign exactly one primary pricing category to every patient.",
"Provide bounded AI health information and navigation.",
"Make sensitive access, verification, emergency access and administrative actions auditable.",
"Create an API/database foundation suitable for future mobile, telemedicine, insurance and hospital integrations."
])

H("3. Phase 1 Scope")
make_table(["Module","Phase 1 scope"],[
["Identity","Registration, login, logout, password reset, secure sessions, profiles."],
["Patient","Profile, emergency contact, one primary pricing category, category verification."],
["Professional","Application, identity/qualification/licence evidence, verification lifecycle."],
["Authorization","RBAC + relationship + permission + contextual checks."],
["Clinical records","Verified professional writes; patient read-only access; correction requests; version/history."],
["Care workflow","Complaints, primary-doctor routing, referral and specialist acceptance."],
["Medication","Prescriptions, medication display, reminders, taken/skipped adherence."],
["Appointments","Calendly scheduling integration and appointment status."],
["Emergency","Patient-initiated Break-Glass, responder queue, emergency snapshot, takeover, audit."],
["Financial foundation","Single category, configurable pricing/coverage plans, effective dates."],
["AI","General health education/navigation with safety guardrails."],
["Notifications","In-app/email workflow notifications."],
["Administration","Verification, users, category review, pricing plans, audit/security review."],
["Security","Encryption, server-side authorization, rate limits, private files, audit logging, backups."]
])
P("Not required for Phase 1: autonomous diagnosis/prescribing, full in-app messaging, advanced drug-interaction engine, automated insurance claims, direct NHIS API integration, native video consultation infrastructure, or replacement of a hospital EMR.")

H("4. Actors and Responsibilities")
make_table(["Actor","Core responsibilities"],[
["Patient","Own account; complaints/symptoms; view records; prescriptions; adherence; appointments; specialist requests; Break-Glass; AI; applicable pricing."],
["Doctor","Verified clinical access; review complaints; clinical records; diagnosis/treatment/prescription within scope; referrals; emergency response."],
["Nurse","Verified, scope-limited access and authorized nursing/care records."],
["Pharmacist","Verified, medication-related access/workflows within scope."],
["Records Officer","Authorized administrative/records functions; no clinical diagnosis/prescribing unless separately qualified and authorized."],
["Administrator","User management, verification, pricing configuration, security/audit administration."],
["Verification Reviewer","Reviews professional evidence and records verification decisions."],
["AI Assistant","General health information and navigation only; no clinical authority."]
])

H("5. Data Trust Model")
make_table(["Data class","Examples","Create/update","Patient rights"],[
["Patient-reported","Complaint, symptoms, pain, mood, fatigue, questions, adherence, notes","Patient/system workflow","Read/write own submissions"],
["Clinically verified","Vitals, blood group, diagnoses, treatment, prescriptions, labs, professional notes","Authorized verified professionals","Read-only; request correction"],
["Administrative","Category, verification, appointment and account status","Authorized admin/system","View applicable own data"],
["Audit/security","Access, emergency access, verification and sensitive changes","System-generated / controlled admin","Restricted"]
])
P("A patient must never be able to turn a self-entered value into a clinically verified value by manipulating the client application.")

H("6. Patient Categories and Pricing")
P("Every patient has exactly ONE active primary pricing category. This is a financial classification, not a clinical urgency classification.")
bullets([
"Student — verified institution.",
"NHIS User — verified eligible status.",
"Civil Servant — verified status.",
"Corporate/Company Member — verified partner membership.",
"Insurance Member — verified coverage relationship.",
"Elderly — verified age/category.",
"Nursing/Breastfeeding Mother — verified category for applicable services.",
"General Patient — default category."
])
P("The final precedence hierarchy for overlapping eligibility must be approved as a business rule before production pricing. The architecture must not hard-code prices into the patient category.")
diagram("6.1 Pricing Flow",[
"Patient → Eligibility evidence → ONE primary category",
"                         ↓",
"                 Pricing / Coverage Plan",
"                         ↓",
"              Service price / coverage rule",
"                         ↓",
"       Patient responsibility + partner/insurer share",
"                         ↓",
"               Provider + Healthitude settlement"
])
P("Clinical priority remains separate: ROUTINE / URGENT / EMERGENCY. A nursing mother is not automatically an emergency.")

H("7. Functional Requirements")
requirements=[
("FR-001","Authentication","Register, login, logout, password reset and secure session lifecycle."),
("FR-002","Patient profile","Manage permitted personal/contact data and emergency contact."),
("FR-003","Professional application","Submit identity, profession, qualifications, licence/registration, specialty and affiliation evidence."),
("FR-004","Verification lifecycle","Support PENDING, UNDER_REVIEW, VERIFIED, VERIFIED_WITH_RESTRICTIONS, SUSPENDED, EXPIRED, REJECTED and REVOKED."),
("FR-005","Credential expiry","Track expiry/revalidation and remove affected clinical privileges when required."),
("FR-006","Authorization","Evaluate role, relationship, permission, context and active verification for protected clinical actions."),
("FR-007","Provider relationship","Support PRIMARY_DOCTOR, SPECIALIST and other scoped relationships with lifecycle."),
("FR-008","Complaint","Patient submits complaint/symptoms and tracks status."),
("FR-009","Primary routing","Route routine complaints to primary doctor when assigned."),
("FR-010","Referral","Doctor can handle within scope or refer/escalate to specialist."),
("FR-011","Specialist acceptance","Only qualified active verified professionals may accept specialist work."),
("FR-012","Clinical record write","Authorized professionals create verified clinical records within scope."),
("FR-013","Clinical correction","Patients cannot edit verified records; they can submit correction requests."),
("FR-014","Clinical history","Show relevant history according to authorization scope."),
("FR-015","Prescription","Authorized prescribers create prescriptions; patient cannot modify them."),
("FR-016","Medication adherence","Patient records taken/skipped doses and receives reminders."),
("FR-017","Refill reminder","Support configurable refill reminders."),
("FR-018","Appointments","Support V1 Calendly scheduling and local appointment state."),
("FR-019","AI assistant","Provide general health information and navigation."),
("FR-020","AI safety","No diagnosis, prescription, dosage alteration, medication discontinuation or clinician override."),
("FR-021","Break-Glass initiation","Patient can create an emergency assistance request."),
("FR-022","Emergency response","Alert verified qualified doctors; valid responder can accept."),
("FR-023","Emergency access","Accepted responder receives minimum-necessary Emergency Snapshot rapidly without a pre-access justification form."),
("FR-024","Emergency audit","Automatically log requester, responder, time, scope and outcome."),
("FR-025","Emergency takeover","If responder releases/fails, another qualified responder may take over."),
("FR-026","Single category","Maintain exactly one active primary pricing category."),
("FR-027","Category verification","Support evidence, review, expiry and verification status."),
("FR-028","Pricing plan","Map category to configurable service pricing/coverage with effective dates."),
("FR-029","Notifications","Notify users of critical workflow events."),
("FR-030","Audit","Record sensitive access and material changes in tamper-resistant logs."),
("FR-031","Administration","Manage users, verification, categories, pricing, configuration and audit review."),
("FR-032","Professional discovery","Discover qualified professionals by specialty/status without exposing unnecessary patient information."),
("FR-033","Record access/export","Patient can view and, where implemented, export accessible records."),
("FR-034","Policy acknowledgement","Capture required terms/privacy/healthcare acknowledgements with version and timestamp."),
("FR-035","Deactivation","Suspend/deactivate accounts without destroying required clinical/audit history."),
]
make_table(["ID","Area","Requirement"],requirements)

H("8. State Transition Diagrams")
diagram("8.1 Professional Verification",[
"PENDING → UNDER_REVIEW",
"UNDER_REVIEW → VERIFIED | VERIFIED_WITH_RESTRICTIONS | REJECTED",
"VERIFIED → EXPIRED | SUSPENDED | REVOKED",
"VERIFIED_WITH_RESTRICTIONS → VERIFIED | SUSPENDED | EXPIRED",
"REJECTED → PENDING (resubmission)",
"Privileges exist only for an active verified state."
])
diagram("8.2 Complaint / Care",[
"NEW → ROUTED_TO_PRIMARY → UNDER_REVIEW",
"UNDER_REVIEW → RESOLVED",
"UNDER_REVIEW → REFERRED_TO_SPECIALIST → SPECIALIST_REVIEW → RESOLVED",
"Supported closure path: CANCELLED / CLOSED",
])
diagram("8.3 Appointment",[
"REQUESTED → PENDING_CONFIRMATION → CONFIRMED → COMPLETED",
"REQUESTED / PENDING_CONFIRMATION / CONFIRMED → CANCELLED",
"CONFIRMED → NO_SHOW (where enabled)"
])
diagram("8.4 Medication",[
"PRESCRIBED → ACTIVE → COMPLETED / STOPPED",
"ACTIVE → TAKEN dose event",
"ACTIVE → SKIPPED dose event",
"ACTIVE → REFILL REMINDER / REFILL REQUEST",
"Adherence events NEVER modify the clinician prescription."
])
diagram("8.5 Break-Glass",[
"NO ACTIVE CASE",
"     ↓ Patient requests urgent help",
"EMERGENCY_REQUEST_CREATED",
"     ↓",
"VERIFIED QUALIFIED DOCTORS ALERTED",
"     ↓",
"VALID DOCTOR ACCEPTS",
"     ↓",
"ATTENDING_RESPONDER + EMERGENCY_ACCESS",
"     ↓",
"CARE PROVIDED",
"     ↓",
"CLOSED",
"Fallback: RELEASED / TIMEOUT → AVAILABLE_FOR_NEXT_QUALIFIED_RESPONDER",
"Every access automatically creates an audit event."
])

H("9. Use Case Diagram")
diagram("9.1 Healthitude Use Case Model",[
"                         +-----------------------------------------+",
"                         |              HEALTHITUDE                |",
"                         |                                         |",
"Patient ---------------->| Register / Authenticate                |",
"Patient ---------------->| Manage Profile + Pricing Category     |",
"Patient ---------------->| Submit Complaint / Symptoms           |",
"Patient ---------------->| View Clinical Records                 |",
"Patient ---------------->| View Prescription + Log Adherence    |",
"Patient ---------------->| Schedule Appointment                  |",
"Patient ---------------->| Request Specialist Care               |",
"Patient ---------------->| Initiate BREAK-GLASS                  |",
"Patient ---------------->| Use AI Health Assistant               |",
"                         |                                         |",
"Doctor ----------------->| Review / Manage Complaints             |",
"Doctor ----------------->| Create Verified Clinical Records      |",
"Doctor ----------------->| Diagnose / Treat / Prescribe          |",
"Doctor ----------------->| Refer Patient                          |",
"Doctor ----------------->| Accept Break-Glass                    |",
"Nurse ------------------>| Record Authorized Care Data            |",
"Pharmacist ------------->| Medication Workflow                    |",
"Records Officer -------->| Authorized Record Administration      |",
"Admin ------------------>| Verify Professionals / Categories     |",
"Admin ------------------>| Manage Pricing / Users / Audit        |",
"                         +-----------------------------------------+",
"External: Calendly, Notification provider, AI provider"
])

H("10. Data Flow Diagrams")
diagram("10.1 Context-Level DFD",[
"Patient / Doctor / Nurse / Pharmacist / Records / Admin",
"                         │",
"                         ▼",
"                [ HEALTHITUDE PLATFORM ]",
"                         │",
"       ┌─────────────────┼──────────────────┐",
"       ▼                 ▼                  ▼",
" User/Auth DB     Clinical Data DB    Verification DB",
"       │                 │                  │",
"       ├────────────► Audit/Security DB ◄──┤",
"       │                 │",
"       ▼                 ▼",
" Pricing DB       Emergency DB",
"                         │",
"              ┌──────────┴─────────┐",
"              ▼                    ▼",
"          Calendly             AI Provider",
"              │                    │",
"              └──────► Notifications / User"
])
diagram("10.2 Level-1 DFD",[
"(1) Identity & Patient Management → User/Patient Store",
"             │",
"(2) Verification & Authorization ← Professional Evidence",
"             │",
"             ├→ Verification Store",
"             │",
"(3) Clinical Care → Clinical Store",
"             ├→ Complaints / Encounters / Vitals / Diagnoses / Prescriptions",
"             │",
"(4) Medication → Medication Store",
"(5) Appointments ↔ Calendly / Appointment Store",
"(6) Emergency → Emergency Store + Emergency Snapshot",
"(7) Category & Pricing → Pricing Store",
"(8) AI Assistant ↔ Safety Gateway ↔ AI Provider",
"(9) Notification Service → In-app / Email",
"All sensitive modules → Audit & Security → Audit Store"
])
diagram("10.3 Emergency DFD",[
"Patient → Emergency Controller → Emergency Queue",
"                              ↓",
"                  Verified Doctor Alerts",
"                              ↓",
"                       Valid Acceptance",
"                              ↓",
"                 Emergency Access Controller",
"                              ↓",
"                     Emergency Snapshot",
"                              ↓",
"                     Attending Doctor",
"                              ↓",
"                       Automatic Audit"
])

H("11. Core Data Model")
make_table(["Entity","Minimum Phase 1 data"],[
["User","id, identity/contact, authentication reference, account status, roles, timestamps."],
["PatientProfile","user_id, demographics, emergency contact, primary_category_id, category status."],
["ProfessionalProfile","user_id, profession, specialty, licence/registration, qualification, affiliation, verification state, expiry."],
["CredentialEvidence","professional_id, evidence type, secure file reference, status, reviewer, timestamps."],
["ProviderRelationship","patient_id, professional_id, relationship type, status, scope, start/end, creator."],
["Complaint","patient, description, symptoms, severity/urgency, status, assigned provider, timestamps."],
["ClinicalEncounter","patient, provider, type, date/time, notes/status."],
["ClinicalRecord","patient, encounter, type, structured value/content, author, version, timestamps."],
["VitalSign","encounter/patient, type, value, unit, measurement time, recorder."],
["Diagnosis","encounter/patient, code/description, status, author, date."],
["Prescription","patient, prescriber, medicine, dose, route, frequency, duration, instructions, status."],
["MedicationAdherence","prescription, scheduled dose, status, timestamp, patient note."],
["Appointment","patient, provider, external ID, time, type, status."],
["EmergencyCase","patient, requester, responder, state, opened/accepted/closed times, scope."],
["PatientCategoryEvidence","patient, category, evidence, status, reviewer, expiry."],
["PricingPlan","category, service, price/coverage rules, effective dates, status."],
["Notification","recipient, event, channel, content, read/delivery state, timestamps."],
["AuditEvent","actor, target, action, timestamp, access scope/context, security metadata."],
["AIInteraction","user, timestamp, safety classification, model/response metadata; minimize sensitive storage."],
["ConsentRecord","user, policy/version, acknowledgement type, timestamp."]
])

H("12. Authorization Architecture")
diagram("12.1 Access Decision",[
"Role",
" + Patient-provider relationship",
" + Exact permission/action",
" + Clinical/business context",
" + Professional verification + active status",
" + Emergency state (if applicable)",
"                 ↓",
"          AUTHORIZATION ENGINE",
"             ↓       ↓",
"           ALLOW    DENY",
"             ↓",
"      Sensitive action audit"
])
bullets([
"Frontend hiding is never a security control.",
"Every clinical endpoint must enforce authorization on the server.",
"Patients may read their own verified clinical data but cannot edit it.",
"Professionals require active verification plus appropriate relationship/scope unless using controlled Break-Glass.",
"Break-Glass grants only minimum necessary emergency access.",
"Administrators receive minimum necessary access and administrative actions are audited."
])

H("13. Professional Verification")
bullets([
"Capture legal name, date of birth and contact information.",
"Capture identity evidence according to approved policy.",
"Capture institution and qualification evidence.",
"Capture professional licence/registration and registration number.",
"Capture specialty and specialist qualification where applicable.",
"Capture facility/affiliation where relevant.",
"Record reviewer, decision, evidence reference, timestamp and expiry.",
"Support suspension, expiration and revocation.",
"Do not grant clinical privileges before verification.",
"If evidence cannot be confidently verified, retain the account in review/rejected status."
])

H("14. Emergency Break-Glass")
bullets([
"Patient can initiate an emergency request.",
"Patient provides the immediate complaint/need necessary to route assistance.",
"Appropriate verified doctors are alerted.",
"A qualified verified doctor can accept without a pre-existing relationship.",
"No pre-access justification form delays the responder in V1.",
"Emergency Snapshot exposes minimum necessary high-value information.",
"One active attending responder owns the case; another can take over after release/failure.",
"Access is automatically audited.",
"Emergency workflow is independent of financial category.",
"Appropriate emergency-care instructions must appear when no responder is available; the system must not falsely imply that a doctor is attending."
])

H("15. Medication and Clinical Safety")
bullets([
"Prescription is a professional-authored clinical record.",
"Patient can view prescription details and adherence schedule.",
"Patient can log taken/skipped doses.",
"Patient cannot edit dose, frequency, medication or duration.",
"Any prescription change creates a new controlled version or change event.",
"Medication reminders are administrative notifications and are not clinical decision-making.",
"Advanced drug interaction checking is not a Phase 1 AI responsibility."
])

H("16. Appointment Requirements")
bullets([
"Use Calendly for V1 scheduling.",
"Store the Healthitude appointment representation and external scheduling identifier where applicable.",
"Never mark an appointment as confirmed unless confirmation is received from the scheduling workflow.",
"Handle cancellation/rescheduling.",
"Provide a clear fallback state when Calendly is unavailable.",
"Appointment access must respect provider and patient relationships."
])

H("17. AI Assistant Requirements")
make_table(["Allowed","Prohibited"],[
["Medical terminology explanation","Diagnosis"],
["General health education","Prescribing"],
["Explanation of information already shown","Changing dosage"],
["General wellness guidance","Telling patient to stop prescribed medication"],
["Question preparation for clinician","Overriding clinician"],
["Healthitude navigation","False certainty"],
["Care-seeking guidance","Emergency medical decision-making"]
])
P("The AI must use a safety gateway that classifies requests and applies policy before/after model inference. Emergency or high-risk language should direct the user to appropriate urgent/emergency care and the Break-Glass pathway.")

H("18. Notifications")
make_table(["Event","Recipient","Priority"],[
["Professional verification outcome","Professional","High"],
["Complaint routed","Assigned provider","High"],
["Referral","Patient + receiving provider","High"],
["Prescription created/updated","Patient","High"],
["Medication reminder","Patient","Normal"],
["Appointment confirmation/change","Patient + provider","High"],
["Break-Glass created","Qualified responders","Critical"],
["Break-Glass accepted","Patient + relevant responders","Critical"],
["Category verification","Patient/admin","Normal"],
["Security/credential event","Affected user/admin","High"]
])

H("19. Security, Privacy and Compliance Baseline")
bullets([
"TLS/HTTPS for all application traffic.",
"Strong password hashing; never store plaintext passwords.",
"Secure session/token management with expiry and rotation.",
"Server-side authorization on every protected resource.",
"Input validation and output encoding.",
"Rate limiting on authentication, emergency and sensitive endpoints.",
"Private storage for identity and professional credential evidence.",
"Encryption at rest for sensitive databases and files where supported.",
"No clinical information in URLs, analytics payloads or client logs unless strictly necessary.",
"Tamper-resistant audit logging.",
"Separation of development, staging and production data.",
"Encrypted backups and documented restoration.",
"Data minimization, retention and deletion policies.",
"Security monitoring for suspicious access, privilege changes and emergency misuse.",
"Production deployment must follow applicable Nigerian privacy/health-data obligations and any contractual requirements of partner institutions/insurers."
])

H("20. Administration")
bullets([
"Professional verification queue and review.",
"Patient category evidence review.",
"Pricing plan configuration with effective dates.",
"User activation/suspension.",
"Professional privilege suspension/revocation.",
"Audit/security event review.",
"Configuration of notification and integration settings.",
"All material administrative actions are audited."
])

H("21. Required Phase 1 Screens")
make_table(["Area","Required screens"],[
["Public","Home/Landing, About/How it works, Login, Register, Forgot/Reset Password, Terms, Privacy."],
["Patient","Dashboard, Profile, Health Summary, Clinical Records, Complaints, Complaint Detail, Medications, Adherence, Appointments, Providers/Specialists, Pricing/Coverage, Notifications, AI Assistant, Emergency Break-Glass."],
["Professional","Dashboard, Verification Status, Patient Relationships, Complaint Queue, Patient Record, Clinical Encounter, Vitals/Clinical Data, Diagnosis/Treatment, Prescriptions, Appointments, Emergency Queue, Notifications."],
["Admin","Dashboard, Professional Verification, Category Verification, Users, Pricing Plans, Audit Logs, Security Events."],
["Shared","Loading, empty, validation, error, 403, 404, session expiry, integration unavailable and emergency unavailable states."]
])

H("22. First Build Architecture")
diagram("22.1 Logical Architecture",[
"[ Responsive Web Client ]",
"          │ HTTPS",
"          ▼",
"[ API / Backend Application ]",
"  ├─ Authentication & Sessions",
"  ├─ Patient / User Management",
"  ├─ Professional Verification",
"  ├─ Authorization (RBAC + ReBAC)",
"  ├─ Provider Relationships",
"  ├─ Clinical Records",
"  ├─ Complaints / Referral",
"  ├─ Medication / Adherence",
"  ├─ Appointments",
"  ├─ Emergency Break-Glass",
"  ├─ Category / Pricing",
"  ├─ Notifications",
"  ├─ AI Safety Gateway",
"  └─ Audit / Security",
"          │",
"   ┌──────┼─────────┐",
"   ▼      ▼         ▼",
"Database  Private   External",
"          Storage   Integrations",
"                    ├─ Calendly",
"                    ├─ AI Provider",
"                    └─ Email/Notifications"
])

H("23. First Build Vertical Slices")
P("Each slice must include interface, API/backend logic, persistence, validation, authorization, error states and audit behavior where applicable. Screens alone do not constitute a completed feature.")
make_table(["Slice","Definition of done"],[
["1 Foundation","Repository, environments, database, migrations, API conventions, logging, error handling, secrets, CI/CD/deployment."],
["2 Authentication","Registration, login/logout, password reset, secure sessions, protected routes and server authorization."],
["3 Patient onboarding","Profile, emergency contact, exactly one category and evidence/status."],
["4 Professional verification","Application, evidence, reviewer queue, status lifecycle, privilege gating."],
["5 Authorization","Central permission service, relationship checks, denial handling, audit."],
["6 Provider relationships","Primary doctor and specialist relationship lifecycle."],
["7 Clinical records","Professional-only writes, patient read-only, correction request, history/versioning."],
["8 Complaints","Submission, primary routing, review, referral, specialist acceptance, resolution."],
["9 Medication","Prescription, display, reminders, adherence."],
["10 Appointments","Calendly integration, appointment state and failure handling."],
["11 Emergency","Break-Glass request, responder queue, atomic acceptance, Emergency Snapshot, closure/takeover, audit."],
["12 Pricing","Category-to-plan mapping, service prices/coverage, effective dates."],
["13 Notifications","Core in-app/email event delivery and status."],
["14 AI","Assistant, safety gateway, high-risk escalation and refusal behavior."],
["15 Admin","Verification, categories, pricing, users, audit."],
["16 Testing","Unit, integration, authorization, security, workflow and end-to-end tests."]
])

H("24. API/Backend Boundary Requirements")
bullets([
"Use versioned API contracts so the future mobile application can consume the same backend.",
"Separate authentication, authorization, clinical, emergency, financial and integration concerns.",
"Do not trust role/category/verification values sent by the client.",
"Use idempotency for sensitive retry-prone operations such as emergency acceptance and payment-related actions when introduced.",
"Use transactions for clinical writes and emergency case ownership.",
"Return consistent error codes without leaking sensitive information.",
"Use background jobs/queues for notifications and non-blocking external integrations.",
"Maintain external integration IDs for Calendly and future partners."
])

H("25. Validation and Business Rules")
bullets([
"One patient may have only one ACTIVE primary pricing category.",
"Professional clinical privileges require active verification.",
"Professional scope must match the requested action.",
"Patients cannot edit clinician-authored verified records.",
"Clinical records identify author and creation time.",
"Prescription history must be preserved.",
"Expired/revoked credentials cannot authorize new clinical access.",
"Break-Glass acceptance must atomically claim the case.",
"Only one active attending responder should own an emergency case at a time.",
"Historical pricing must remain reproducible using effective dates.",
"Sensitive files must be private.",
"External integration failure must never be presented as success.",
"All server-side inputs are validated."
])

H("26. Edge Cases and Failure Handling")
bullets([
"Unverified professional attempts clinical access → deny.",
"Expired credential → restrict affected privilege and notify.",
"Provider relationship ended → relationship-based access denied unless another valid authorization exists.",
"No primary doctor → supported discovery/escalation flow.",
"Complaint outside scope → referral.",
"Two doctors accept Break-Glass simultaneously → atomic claim determines one valid attending responder.",
"No emergency responder → maintain escalation state and direct patient to appropriate emergency services.",
"Calendly unavailable → clear failure state; never fabricate confirmation.",
"AI high-risk/emergency request → emergency/care escalation, not diagnosis.",
"Pricing service unavailable → show unavailable/needs-review state, never invent price.",
"Patient disputes record → correction request, original clinical record preserved.",
"Account deactivated → prevent login/access while retaining required clinical/audit history."
])

H("27. Non-Functional Requirements")
make_table(["ID","Requirement"],[
["NFR-001","Security: encryption, least privilege, secure authentication and server-side authorization."],
["NFR-002","Privacy: data minimization, privacy notice, consent/policy records and restricted access."],
["NFR-003","Auditability: trace sensitive clinical, emergency, verification and administrative actions."],
["NFR-004","Availability: resilient core workflows and graceful external-integration failures."],
["NFR-005","Performance: responsive normal workflows; prioritized emergency request/alert path."],
["NFR-006","Reliability: transactional clinical writes and no partial critical records."],
["NFR-007","Scalability: modular API and data architecture suitable for future mobile and integrations."],
["NFR-008","Accessibility: responsive, keyboard-friendly, readable and WCAG-aligned UI practices."],
["NFR-009","Observability: logs, metrics, errors and security alerts."],
["NFR-010","Backup/recovery: encrypted backups and tested restoration process."],
["NFR-011","Data integrity: versioned/controlled clinical records and immutable audit history."],
["NFR-012","Interoperability: stable identifiers and integration IDs."],
["NFR-013","Maintainability: modular, typed, tested code with separation of concerns."],
["NFR-014","Localization: Nigerian currency, dates, phone formats and configurable business rules."]
])

H("28. Acceptance Criteria")
nums([
"Patient can securely register, authenticate and access an account.",
"Patient can manage profile and exactly one primary pricing category.",
"Professional can submit required verification evidence.",
"Unverified professional cannot perform protected clinical actions.",
"Verified professional can access only authorized records.",
"Patient can submit a complaint and track it.",
"Primary doctor can review or refer the complaint.",
"Authorized clinician can create verified clinical records and prescriptions.",
"Patient can view but not modify verified clinical records.",
"Patient can log medication adherence.",
"Patient can schedule/request an appointment through the V1 scheduling workflow.",
"Patient can initiate Break-Glass.",
"Qualified verified doctor can accept Break-Glass without prior relationship.",
"Emergency access automatically produces an audit event.",
"Category maps to a configurable pricing/coverage plan.",
"AI remains non-diagnostic and non-prescriptive.",
"Core events generate notifications.",
"Sensitive and administrative actions are auditable.",
"Core unit, integration, authorization, security and end-to-end tests pass."
])

H("29. Recommended Implementation Order")
nums([
"Foundation, repository, environments and database.",
"Authentication and account lifecycle.",
"Patient profile/onboarding.",
"Professional onboarding and verification.",
"Authorization engine.",
"Provider relationships.",
"Clinical record foundation.",
"Complaint/referral workflow.",
"Medication/adherence.",
"Calendly appointments.",
"Emergency Break-Glass.",
"Patient category/pricing foundation.",
"Notifications.",
"AI safety gateway and assistant.",
"Admin console.",
"Security hardening, testing and deployment."
])

H("30. Phase 1 Deliverables")
bullets([
"Responsive Healthitude web application.",
"Secure backend/API.",
"Relational database and migrations.",
"Private credential/document storage.",
"Professional verification system.",
"RBAC + ReBAC authorization.",
"Patient-provider relationships.",
"Clinical records and prescriptions.",
"Complaint/referral workflow.",
"Medication/adherence workflow.",
"Calendly appointment integration.",
"Break-Glass emergency workflow.",
"Single-category pricing foundation.",
"Notification system.",
"Bounded AI assistant.",
"Admin dashboard.",
"Audit/security logging.",
"Automated test suite.",
"Deployment configuration and technical documentation."
])

H("31. Phase 1 Definition of Done")
P("Phase 1 is complete only when the complete in-scope vertical slices work end-to-end, server-side authorization is enforced, professional verification gates clinical privileges, clinical records preserve authorship/history, patients cannot alter verified clinical information, Break-Glass is fast but auditable, exactly one pricing category is active per patient, external failures are handled safely, AI boundaries are enforced, and the acceptance criteria are demonstrated in a controlled test environment.")
P("The priority of Phase 1 is trust and correctness before visual complexity. Healthitude must establish who the user is, which professionals are trusted, what data is verified, whose records may be accessed, how care moves from complaint to provider, how emergency access works, how financial classification works, and how every sensitive action remains accountable.")

H("Appendix A — Baseline Permission Matrix")
make_table(["Action","Patient","Doctor","Nurse","Pharmacist","Records","Admin"],[
["Edit own profile","Yes","Yes","Yes","Yes","Yes","Scoped"],
["Submit complaint","Yes","No","No","No","No","No"],
["View own clinical record","Yes","Scoped","Scoped","Medication-scoped","Scoped","Scoped"],
["Create diagnosis","No","Yes*","No","No","No","No"],
["Create prescription","No","Yes*","No","No","No","No"],
["Log adherence","Yes","No","No","Scoped","No","No"],
["Record authorized vitals","No","Yes*","Yes*","No","No","No"],
["Verify professional","No","No","No","No","No","Yes/Reviewer"],
["Configure pricing","No","No","No","No","No","Yes"],
["Initiate Break-Glass","Yes","Authorized professional","Authorized professional","No*","No*","Controlled"],
["Accept emergency doctor case","No","Yes*","No*","No","No","Controlled support"],
["View audit logs","No","Scoped","Scoped","Scoped","Scoped","Authorized"],
])
P("* Subject to active verification, professional scope, relationship/context and the authorization engine.")

H("Appendix B — Build Readiness Checklist")
bullets([
"Requirements approved and versioned.",
"Database schema reviewed.",
"Authorization matrix reviewed.",
"Professional verification policy defined.",
"Single-category pricing rule confirmed.",
"Emergency Break-Glass policy approved.",
"AI safety policy approved.",
"Privacy/retention policy identified.",
"Calendly integration credentials/configuration available.",
"Notification provider selected/configured.",
"Development/staging/production environments separated.",
"Automated test strategy prepared.",
"Security review scheduled before production.",
"Pilot/test data isolated from real patient data."
])

doc.save(out)
print(f"Created: {out}")

STDOUT/STDERR
Created: /mnt/data/Healthitude_Phase_1_Requirements_and_Build_Specification.docx


Completed the Healthitude Phase 1 Requirements & Build Specification as a Word document.

It includes:

Complete Phase 1 requirements
Functional and non-functional requirements
All user roles and responsibilities
Patient vs clinically verified data model
Professional verification requirements
RBAC + ReBAC authorization model
Patient-provider relationships
Complaint/referral workflow
Medication and adherence requirements
Calendly appointment requirements
AI assistant boundaries
Patient categories and single-category pricing model
Financial/pricing architecture
Break-Glass emergency workflow
State transition diagrams
Use Case Diagram
Context-level and Level-1 Data Flow Diagrams
Emergency Data Flow Diagram
Core database entities
Required Phase 1 screens
First-build architecture
Vertical implementation slices
API/backend requirements
Security/privacy requirements
Notifications
Edge cases and failure handling
Validation/business rules
Acceptance criteria
Phase 1 delivery order
Definition of Done
Build-readiness checklist
Word document

Download Healthitude Phase 1 Requirements & Build Specification

This document is intended to be the baseline specification we build against. The next logical step is Phase 2: System Architecture, where we can take these requirements and design the actual database schema, backend architecture, API structure, authentication, authorization, and module relationships before writing implementation code. 

Healthitude_Phase_1_Requirements_and_Build_Specification.docx
Document