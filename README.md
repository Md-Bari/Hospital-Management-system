# Enterprise-Grade Hospital Management System (HMS)

> Modern, secure, and scalable Hospital Management System built with **ASP.NET Core Web API (.NET 10 LTS)**, **Next.js (App Router, TypeScript, Tailwind CSS)**, **PostgreSQL**, and **Redis**.
> Localized for Bangladesh (**BDT** / **Asia/Dhaka** / **DD-MM-YYYY**).

---

## 🎨 Visual Design & UI System

The application strictly adopts the modern healthcare aesthetic and color scheme specified in the reference mockups:

1. **Operations Dashboard (`/dashboard`)**:
   - Layout matching the 3-column / multi-section operational architecture:
     - **Top Stat Cards**: Patients (600), Staff Members (150), Vehicles (35), Appointment (120), Operations (28).
     - **Analytics**: "Total Trends" grouped multi-bar chart (Male, Female, Children) and "Patients by Department" concentric rings donut gauge (320 Total).
     - **Doctor's Schedule**: Real-time availability pill badges (`Available` in soft emerald mint, `Unavailable` in soft red).
     - **Operational Alerts**: Urgent action cards (Oxygen Cylinder Refill, Ambulance Dispatched, Room Cleaning).
     - **Right Column**: Mini calendar with active date highlight + day timeline agenda.
2. **Public Discovery Portal (`/`)**:
   - Modern "MediWell" branding with high-trust healthcare discovery:
     - 24/7 Support Hotline (`+880 1700-000000`) & "Book Appointment" CTA button.
     - "Better Science. Better Health." hero section with floating credibility badges.
     - "How Can We Help You?" quick-action cards.
     - Services catalog (Pharmacy, Cardiology, Neurology, Pathology Lab, Pediatrics).
     - Impact stats gradient ribbon (25+ Years, 150+ Doctors, 500+ Services, 100K+ Patients).
     - Emergency Trauma & Ambulance hotline card.

---

## 🏗️ Architecture & Technology Stack

- **Backend**:
  - ASP.NET Core Web API (.NET 10 LTS)
  - Clean Architecture: `Domain`, `Application`, `Infrastructure`, `API`
  - CQRS with MediatR pipeline behaviors (Validation with FluentValidation, Logging, Transactions)
  - Entity Framework Core with PostgreSQL provider (`Npgsql`)
  - ASP.NET Core Identity with JWT bearer authentication and rotating refresh tokens
  - Distributed Redis caching and distributed locking
  - Serilog structured logging
- **Frontend**:
  - Next.js 15+ (App Router)
  - TypeScript
  - Tailwind CSS with custom healthcare tokens
  - Lucide Icons
  - TanStack Query
  - Recharts for analytical visualizations
  - Axios with automated 401 token refresh interceptors
- **Infrastructure & Deployment**:
  - Full Docker Compose orchestration: PostgreSQL 16, Redis 7, ASP.NET Core API, Next.js Web
  - Automated database migration & seed scripts
  - Multi-stage Docker builds with minimal production footprints

---

## 🚀 Quick Start (Dockerized - Recommended)

The entire system is fully dockerized. No local .NET or Node.js runtime installation is required.

```bash
# 1. Start the complete system
docker compose up -d

# 2. View running services and health status
docker compose ps

# 3. View logs
docker compose logs -f api
docker compose logs -f web

# 4. Stop the system
docker compose down
```

### Access URLs:
- **Public Patient Portal**: `http://localhost:3000`
- **Hospital Operations Dashboard**: `http://localhost:3000/dashboard`
- **Staff Login**: `http://localhost:3000/login`
- **Backend API & Swagger**: `http://localhost:5000/swagger`
- **API Health Check**: `http://localhost:5000/api/v1/health`

---

## 🚀 Quick Start Guide

### 1. Start Infrastructure (PostgreSQL & Redis)
Ensure Docker is running, then execute:
```bash
docker compose up -d
```
*Note: PostgreSQL is pre-configured with `init.sql` containing all initial Identity, Hospital, Branch, Department, and Role schema tables.*

### 2. Run the ASP.NET Core Backend API
```bash
cd "F:\Projects\DOTNET\Hospital Management system"
dotnet run --project src/HospitalMS.API
```
- API Base URL: `http://localhost:5000`
- Swagger Documentation: `http://localhost:5000/swagger`
- Health Check: `http://localhost:5000/api/v1/health`

### 3. Run the Next.js Frontend
```bash
cd "F:\Projects\DOTNET\Hospital Management system\frontend\hospitalms-web"
pnpm run dev
# or: npm run dev
```
- Public Healthcare Portal: `http://localhost:3000`
- Operations Dashboard: `http://localhost:3000/dashboard`
- Staff Login: `http://localhost:3000/login`

---

## 🔑 Demo Seed Accounts

| Role | Email | Password | Scope |
|---|---|---|---|
| **Super Administrator** | `admin@hospitalms.com` | `Admin@123456` | Full administrative control across all branches & modules |
| **Doctor** | `dr.thompson@hospitalms.com` | `Doctor@123456` | Clinical encounters, EHR timeline, prescription authoring |
| **Receptionist** | `reception@hospitalms.com` | `Staff@123456` | Patient registration, queue check-in, counter appointment booking |

---

## 🧪 Automated Testing

Run the automated backend test suite:
```bash
dotnet test tests/HospitalMS.UnitTests/HospitalMS.UnitTests.csproj
```
Tests verify:
- BDT Currency arithmetic and rounding (`Money` value object)
- Domain `Result<T>` pattern
- Address equality
- Password complexity rules and validation
- JWT token claim extraction and refresh token generation

---

## 📁 Repository Structure

```
├── HospitalMS.slnx
├── docker-compose.yml
├── .env.example
├── README.md
├── src/
│   ├── HospitalMS.Domain/           # Base entities, Value objects, Enums, Domain events
│   ├── HospitalMS.Application/      # CQRS commands/queries, MediatR behaviors, DTOs
│   ├── HospitalMS.Infrastructure/   # EF Core DbContext, Identity, JWT, Redis, Seeder
│   └── HospitalMS.API/              # Controllers, Exception handling, Swagger, Program.cs
├── frontend/
│   └── hospitalms-web/              # Next.js App Router, Tailwind CSS, Dashboard, Portal
├── tests/
│   └── HospitalMS.UnitTests/        # Unit & validation test suite
└── docker/
    └── postgres/init.sql            # Schema initialization script
```

