# 🔐 RaiSakshya — Institutional System Accounts & Credentials

This document contains all pre-configured institutional accounts, roles, login credentials, and brief workflow descriptions for the **RaiSakshya** platform.

---

## 📋 Quick Credentials Summary Table

| Role | Name / Title | Email Address | Password | Primary Portal Function |
| :--- | :--- | :--- | :--- | :--- |
| **Student (Active Intern)** | Alex Patil | `alex.patil@ghr.edu` | `Student@123` | 100% Profile Verified, Active Google SDE Intern, Biometric Face & Geofence Check-in |
| **Student (Pending)** | Priya Sharma | `priya.sharma@ghr.edu` | `Student@123` | 90% Profile, Pending Class Teacher credential verification |
| **Student (Verified)** | Rohit Deshmukh | `rohit.deshmukh@ghr.edu` | `Student@123` | 100% Profile Verified, AI/ML candidate ready for drive applications |
| **Class Teacher** | Dr. Suresh Verma | `classteacher.cs3@ghr.edu` | `Faculty@123` | Student profile verification, grade card checks, and governance |
| **Faculty Mentor** | Prof. Anjali Mehta | `mentor.cs3@ghr.edu` | `Faculty@123` | Weekly report reviews, scoring with feedback, completion certificates |
| **T&P Head** | Prof. Rajesh Kulkarni | `tnp.cs@ghr.edu` | `Tnp@123` | Campus drives, offer letter verification, student progress tracking |
| **Company Recruiter** | Google India | `recruiter@google.com` | `Company@123` | SDE Drive management, candidate interview rounds, bulk offer uploads |
| **Company Recruiter** | Microsoft India | `recruiter@microsoft.com` | `Company@123` | R&D Internship drive postings and candidate selection |
| **HOD / Super Admin** | System Administrator | `admin@ghr.edu` | `Admin@123` | Class Teacher role transfers, company GSTIN approvals, system governance |

---

## 🧑‍🎓 1. Student Accounts

### A. Alex Patil (Active Google Intern)
- **Email**: `alex.patil@ghr.edu`
- **Password**: `Student@123`
- **Role**: `STUDENT`
- **PRN**: `GHR-CS-2023-042` (Department of Computer Science & Engineering)
- **Status**: 100% Verified Profile, Active 6-Month SDE Internship at Google India.
- **Key Features to Test**:
  - **Biometric Geofenced Check-In / Check-Out**: 300m GPS perimeter lock + direct camera snapshot face verification.
  - **Weekly Reports Hub**: Submit Friday logbooks, code/commit attachments, and view mentor feedback.
  - **Document Vault**: Download verified Offer Letter, NOC, and Certificate.

### B. Priya Sharma (Pending Verification)
- **Email**: `priya.sharma@ghr.edu`
- **Password**: `Student@123`
- **Role**: `STUDENT`
- **PRN**: `GHR-CS-2023-088`
- **Status**: 90% Profile Completion (Awaiting Class Teacher verification).
- **Key Features to Test**:
  - Profile edit and certification proof upload.

### C. Rohit Deshmukh (Eligible Candidate)
- **Email**: `rohit.deshmukh@ghr.edu`
- **Password**: `Student@123`
- **Role**: `STUDENT`
- **PRN**: `GHR-CS-2023-115`
- **Status**: 100% Verified Profile, CGPA: 8.20 (AI/ML candidate).

---

## 👨‍🏫 2. Faculty & Mentor Accounts

### A. Dr. Suresh Verma (Class Teacher — CS 3rd Year)
- **Email**: `classteacher.cs3@ghr.edu`
- **Password**: `Faculty@123`
- **Role**: `FACULTY`
- **Designation**: `CLASS_TEACHER`
- **Key Features to Test**:
  - **Profile Verification Hub**: Review student CGPA, backlogs, skills, and inspect uploaded PDF resumes and certification proofs.
  - Approve or reject student profiles with feedback notes.

### B. Prof. Anjali Mehta (Internship Mentor)
- **Email**: `mentor.cs3@ghr.edu`
- **Password**: `Faculty@123`
- **Role**: `FACULTY`
- **Designation**: `ASSISTANT_PROFESSOR`
- **Key Features to Test**:
  - **Weekly Report Review**: Evaluate Friday submissions, assign marks (0–100), provide feedback, or request corrections.
  - **Final Certification & Evaluation**: Score completed internship performance and issue digitally signed PDF Completion Certificates.

---

## 💼 3. Training & Placement (T&P) Department

### Prof. Rajesh Kulkarni (T&P Head)
- **Email**: `tnp.cs@ghr.edu`
- **Password**: `Tnp@123`
- **Role**: `TNP`
- **Key Features to Test**:
  - **Placement Drives Management**: Create and publish internship openings, set CGPA/branch criteria.
  - **Offer Verification Hub**: Verify self-reported and company-issued offer letters.
  - **Student Directory**: Live status filter (Placed, Active Interns, Defaulters).

---

## 🏢 4. Company & Recruiter Accounts

### A. Google India Recruiter
- **Email**: `recruiter@google.com`
- **Password**: `Company@123`
- **Role**: `COMPANY`
- **GSTIN**: `27AAACG0535P1Z8` (Verified Trust Score: 99/100)
- **Key Features to Test**:
  - Manage SDE Intern Drive pipeline (Shortlist, GD, Interview, Selection).
  - Bulk PDF/ZIP offer letter upload with automatic PRN matching.

### B. Microsoft India Recruiter
- **Email**: `recruiter@microsoft.com`
- **Password**: `Company@123`
- **Role**: `COMPANY`
- **GSTIN**: `27AABCM2818A1ZW` (Verified Trust Score: 98/100)

---

## 🛡️ 5. Institutional Admin / HOD Account

### System Administrator (Head of Department)
- **Email**: `admin@ghr.edu`
- **Password**: `Admin@123`
- **Role**: `ADMIN`
- **Key Features to Test**:
  - **Faculty Role Transfer**: Seamlessly reassign Class Teacher role from one professor to another with 100% automated student profile data reallocation.
  - **Corporate Verification**: Review new company registrations and verify GSTIN trust scores.
  - **Analytics & Governance**: System audit logs and department-wide metrics.

---

## 🔐 Authentication Notes
- All accounts use standard encrypted password hashing with `bcrypt`.
- Token expiry is set to **7 days** with automatic local session persistence.
