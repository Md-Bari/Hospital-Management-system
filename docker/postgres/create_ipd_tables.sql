CREATE TABLE IF NOT EXISTS ipd_wards (
    "Id" uuid NOT NULL PRIMARY KEY,
    "BranchId" uuid REFERENCES core_branches("Id") ON DELETE SET NULL,
    "Name" varchar(150) NOT NULL,
    "Code" varchar(50) NOT NULL,
    "WardType" varchar(50) NOT NULL,
    "FloorNumber" integer NOT NULL,
    "GenderRestriction" varchar(20) NOT NULL,
    "DailyRate" numeric(18,2) NOT NULL,
    "TotalBeds" integer NOT NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "IsDeleted" boolean NOT NULL DEFAULT false,
    "DeletedAt" timestamptz,
    "DeletedBy" uuid,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "CreatedBy" uuid,
    "ModifiedAt" timestamptz,
    "ModifiedBy" uuid
);

CREATE TABLE IF NOT EXISTS ipd_beds (
    "Id" uuid NOT NULL PRIMARY KEY,
    "WardId" uuid NOT NULL REFERENCES ipd_wards("Id") ON DELETE CASCADE,
    "BedNumber" varchar(50) NOT NULL,
    "BedType" varchar(50) NOT NULL,
    "DailyRate" numeric(18,2) NOT NULL,
    "Status" varchar(30) NOT NULL DEFAULT 'Available',
    "CurrentAdmissionId" uuid,
    "IsDeleted" boolean NOT NULL DEFAULT false,
    "DeletedAt" timestamptz,
    "DeletedBy" uuid,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "CreatedBy" uuid,
    "ModifiedAt" timestamptz,
    "ModifiedBy" uuid
);

CREATE TABLE IF NOT EXISTS ipd_admissions (
    "Id" uuid NOT NULL PRIMARY KEY,
    "AdmissionNumber" varchar(50) NOT NULL,
    "PatientId" uuid NOT NULL REFERENCES pat_patients("Id") ON DELETE RESTRICT,
    "DoctorId" uuid NOT NULL REFERENCES cln_doctors("Id") ON DELETE RESTRICT,
    "WardId" uuid NOT NULL REFERENCES ipd_wards("Id") ON DELETE RESTRICT,
    "BedId" uuid NOT NULL REFERENCES ipd_beds("Id") ON DELETE RESTRICT,
    "AdmissionDate" timestamptz NOT NULL DEFAULT now(),
    "DischargeDate" timestamptz,
    "Status" varchar(30) NOT NULL DEFAULT 'Admitted',
    "ProvisionalDiagnosis" varchar(300) NOT NULL,
    "AdmissionPriority" varchar(30) NOT NULL DEFAULT 'Routine',
    "InitialDeposit" numeric(18,2) NOT NULL DEFAULT 0,
    "EstimatedDays" integer NOT NULL DEFAULT 3,
    "CareInstructions" text,
    "DischargeSummary" text,
    "AdmittedByRole" varchar(50),
    "AdmittedByUserId" uuid,
    "IsDeleted" boolean NOT NULL DEFAULT false,
    "DeletedAt" timestamptz,
    "DeletedBy" uuid,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "CreatedBy" uuid,
    "ModifiedAt" timestamptz,
    "ModifiedBy" uuid
);

CREATE INDEX IF NOT EXISTS "IX_ipd_admissions_PatientId" ON ipd_admissions ("PatientId");
CREATE INDEX IF NOT EXISTS "IX_ipd_admissions_DoctorId" ON ipd_admissions ("DoctorId");
CREATE INDEX IF NOT EXISTS "IX_ipd_admissions_WardId" ON ipd_admissions ("WardId");
CREATE INDEX IF NOT EXISTS "IX_ipd_admissions_BedId" ON ipd_admissions ("BedId");
CREATE INDEX IF NOT EXISTS "IX_ipd_beds_WardId" ON ipd_beds ("WardId");

-- Record in __EFMigrationsHistory
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261103000000_AddInpatientWardsAndBeds', '10.0.0')
ON CONFLICT DO NOTHING;
