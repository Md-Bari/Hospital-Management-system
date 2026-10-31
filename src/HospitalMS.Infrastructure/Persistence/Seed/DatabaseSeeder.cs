using HospitalMS.Domain.Entities;
using HospitalMS.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HospitalMS.Infrastructure.Persistence.Seed;

public class DatabaseSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        ILogger<DatabaseSeeder> logger)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        try
        {
            await SeedHospitalAndBranchesAsync();
            await SeedRolesAndPermissionsAsync();
            await SeedUsersAsync();
            await SeedHealthcareDataAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }

    private async Task SeedHospitalAndBranchesAsync()
    {
        var hospital = await _context.Hospitals.FirstOrDefaultAsync();
        if (hospital == null)
        {
            hospital = new Hospital
            {
                Name = "Dhaka Central Hospital & Medical College",
                Code = "DCH-01",
                LicenseNumber = "DGHS-LIC-2026-9812",
                ContactPhone = "+880 2 9660000",
                ContactEmail = "info@dhakacentralhospital.com",
                Address = "Plot 14, Road 7, Dhanmondi, Dhaka 1205, Bangladesh",
                Currency = "BDT",
                TimeZone = "Asia/Dhaka",
                IsActive = true
            };

            _context.Hospitals.Add(hospital);
            await _context.SaveChangesAsync();
        }

        var mainBranch = await _context.Branches.FirstOrDefaultAsync(b => b.Code == "BR-DHD-01");
        if (mainBranch == null)
        {
            mainBranch = new Branch
            {
                HospitalId = hospital.Id,
                Name = "Dhanmondi Main Branch",
                Code = "BR-DHD-01",
                Phone = "+880 1711-000001",
                Email = "dhanmondi@dhakacentralhospital.com",
                Address = "Road 7, Dhanmondi R/A, Dhaka",
                IsMainBranch = true,
                IsActive = true
            };

            _context.Branches.Add(mainBranch);
            await _context.SaveChangesAsync();
        }

        var departments = new List<Department>
        {
            new() { BranchId = mainBranch.Id, Name = "General Medicine", Code = "MED", DepartmentType = "Clinical", IsClinical = true },
            new() { BranchId = mainBranch.Id, Name = "Orthopedics", Code = "ORTHO", DepartmentType = "Clinical", IsClinical = true },
            new() { BranchId = mainBranch.Id, Name = "Cardiology", Code = "CARD", DepartmentType = "Clinical", IsClinical = true },
            new() { BranchId = mainBranch.Id, Name = "Gynecology & Obstetrics", Code = "GYNAE", DepartmentType = "Clinical", IsClinical = true },
            new() { BranchId = mainBranch.Id, Name = "Pediatrics", Code = "PED", DepartmentType = "Clinical", IsClinical = true },
            new() { BranchId = mainBranch.Id, Name = "Pathology & Clinical Lab", Code = "LAB", DepartmentType = "Diagnostic", IsClinical = false },
            new() { BranchId = mainBranch.Id, Name = "Radiology & Imaging", Code = "RAD", DepartmentType = "Diagnostic", IsClinical = false },
            new() { BranchId = mainBranch.Id, Name = "Hospital Central Pharmacy", Code = "PHARM", DepartmentType = "Pharmacy", IsClinical = false },
            new() { BranchId = mainBranch.Id, Name = "Billing & Accounts", Code = "FIN", DepartmentType = "Finance", IsClinical = false },
            new() { BranchId = mainBranch.Id, Name = "Emergency & Trauma Centre", Code = "ER", DepartmentType = "Emergency", IsClinical = true },
            new() { BranchId = mainBranch.Id, Name = "Blood Transfusion & Bank", Code = "BB", DepartmentType = "Diagnostic", IsClinical = false },
            new() { BranchId = mainBranch.Id, Name = "Human Resources & Administration", Code = "HR", DepartmentType = "Administration", IsClinical = false },
            new() { BranchId = mainBranch.Id, Name = "Operation Theatre & Anesthesia", Code = "OT", DepartmentType = "Surgical", IsClinical = true },
            new() { BranchId = mainBranch.Id, Name = "Inpatient Department (IPD & Wards)", Code = "IPD", DepartmentType = "Inpatient", IsClinical = true }
        };

        foreach (var dept in departments)
        {
            if (!await _context.Departments.AnyAsync(d => d.Code == dept.Code))
            {
                _context.Departments.Add(dept);
            }
        }
        await _context.SaveChangesAsync();
    }

    private async Task SeedRolesAndPermissionsAsync()
    {
        var roleNames = Enum.GetNames<RoleType>();
        foreach (var roleName in roleNames)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                var role = new ApplicationRole
                {
                    Name = roleName,
                    Description = $"Standard system role for {roleName}",
                    IsSystemRole = true
                };
                await _roleManager.CreateAsync(role);
            }
        }

        var allPermissions = new List<Permission>
        {
            // Patient Management
            new() { Module = "Patients", Action = "View", Code = "Patients.View", Description = "View patient records" },
            new() { Module = "Patients", Action = "Create", Code = "Patients.Create", Description = "Register new patients" },
            new() { Module = "Patients", Action = "Edit", Code = "Patients.Edit", Description = "Edit patient details" },
            new() { Module = "Patients", Action = "ViewMedicalHistory", Code = "Patients.ViewMedicalHistory", Description = "View patient medical history" },
            new() { Module = "Patients", Action = "Merge", Code = "Patients.Merge", Description = "Merge duplicate patient records" },
            new() { Module = "Patients", Action = "Export", Code = "Patients.Export", Description = "Export patient datasets" },

            // Appointment Management
            new() { Module = "Appointments", Action = "View", Code = "Appointments.View", Description = "View appointment schedules" },
            new() { Module = "Appointments", Action = "Book", Code = "Appointments.Book", Description = "Book patient appointments" },
            new() { Module = "Appointments", Action = "Cancel", Code = "Appointments.Cancel", Description = "Cancel scheduled appointments" },
            new() { Module = "Appointments", Action = "Reschedule", Code = "Appointments.Reschedule", Description = "Reschedule appointments" },
            new() { Module = "Appointments", Action = "ManageSchedules", Code = "Appointments.ManageSchedules", Description = "Manage doctor chamber schedules" },
            new() { Module = "Appointments", Action = "ManageQueue", Code = "Appointments.ManageQueue", Description = "Manage consultation queues" },
            new() { Module = "Appointments", Action = "CheckIn", Code = "Appointments.CheckIn", Description = "Check in patients at reception" },

            // Clinical Management
            new() { Module = "Clinical", Action = "ViewEncounters", Code = "Clinical.ViewEncounters", Description = "View clinical encounters" },
            new() { Module = "Clinical", Action = "CreateEncounter", Code = "Clinical.CreateEncounter", Description = "Create clinical encounter notes" },
            new() { Module = "Clinical", Action = "FinalizeEncounter", Code = "Clinical.FinalizeEncounter", Description = "Finalize clinical encounter notes" },
            new() { Module = "Clinical", Action = "AmendEncounter", Code = "Clinical.AmendEncounter", Description = "Amend existing encounter notes" },
            new() { Module = "Clinical", Action = "RecordVitals", Code = "Clinical.RecordVitals", Description = "Record patient vital signs" },
            new() { Module = "Clinical", Action = "ViewHistory", Code = "Clinical.ViewHistory", Description = "View patient clinical history" },

            // Prescription Management
            new() { Module = "Prescriptions", Action = "Create", Code = "Prescriptions.Create", Description = "Create e-prescriptions" },
            new() { Module = "Prescriptions", Action = "Finalize", Code = "Prescriptions.Finalize", Description = "Finalize e-prescriptions" },
            new() { Module = "Prescriptions", Action = "View", Code = "Prescriptions.View", Description = "View prescriptions" },
            new() { Module = "Prescriptions", Action = "DownloadPDF", Code = "Prescriptions.DownloadPDF", Description = "Download prescription PDF" },

            // Laboratory Management
            new() { Module = "Laboratory", Action = "ViewOrders", Code = "Laboratory.ViewOrders", Description = "View diagnostic lab orders" },
            new() { Module = "Laboratory", Action = "CreateOrder", Code = "Laboratory.CreateOrder", Description = "Order diagnostic lab tests" },
            new() { Module = "Laboratory", Action = "CollectSample", Code = "Laboratory.CollectSample", Description = "Collect patient laboratory samples" },
            new() { Module = "Laboratory", Action = "EnterResults", Code = "Laboratory.EnterResults", Description = "Input diagnostic test values" },
            new() { Module = "Laboratory", Action = "VerifyResults", Code = "Laboratory.VerifyResults", Description = "Verify diagnostic test values" },
            new() { Module = "Laboratory", Action = "PublishReport", Code = "Laboratory.PublishReport", Description = "Publish diagnostic test reports" },
            new() { Module = "Laboratory", Action = "ViewReports", Code = "Laboratory.ViewReports", Description = "View diagnostic reports" },
            new() { Module = "Laboratory", Action = "ManageCatalog", Code = "Laboratory.ManageCatalog", Description = "Manage lab test catalog and rates" },

            // Pharmacy Management
            new() { Module = "Pharmacy", Action = "ViewInventory", Code = "Pharmacy.ViewInventory", Description = "View medicine inventory and stock" },
            new() { Module = "Pharmacy", Action = "Dispense", Code = "Pharmacy.Dispense", Description = "Dispense medicines against prescriptions" },
            new() { Module = "Pharmacy", Action = "ManageStock", Code = "Pharmacy.ManageStock", Description = "Manage pharmacy inventory and batches" },
            new() { Module = "Pharmacy", Action = "CreatePurchaseOrder", Code = "Pharmacy.CreatePurchaseOrder", Description = "Create medicine purchase orders" },
            new() { Module = "Pharmacy", Action = "ReceiveGoods", Code = "Pharmacy.ReceiveGoods", Description = "Receive pharmaceuticals stock" },
            new() { Module = "Pharmacy", Action = "ProcessReturn", Code = "Pharmacy.ProcessReturn", Description = "Process medicine returns and damages" },
            new() { Module = "Pharmacy", Action = "ViewReports", Code = "Pharmacy.ViewReports", Description = "View pharmacy sales and consumption reports" },

            // Billing Management
            new() { Module = "Billing", Action = "CreateInvoice", Code = "Billing.CreateInvoice", Description = "Create billing invoices" },
            new() { Module = "Billing", Action = "ViewInvoices", Code = "Billing.ViewInvoices", Description = "View billing invoices" },
            new() { Module = "Billing", Action = "ProcessPayment", Code = "Billing.ProcessPayment", Description = "Collect and process payments" },
            new() { Module = "Billing", Action = "ProcessRefund", Code = "Billing.ProcessRefund", Description = "Process bill refund requests" },
            new() { Module = "Billing", Action = "ViewReports", Code = "Billing.ViewReports", Description = "View financial and collection reports" },
            new() { Module = "Billing", Action = "ManagePricing", Code = "Billing.ManagePricing", Description = "Configure hospital service charges" },
            new() { Module = "Billing", Action = "CashierClosing", Code = "Billing.CashierClosing", Description = "Perform daily cashier closing" },
            new() { Module = "Billing", Action = "ApproveRefund", Code = "Billing.ApproveRefund", Description = "Approve patient payment refunds" },

            // IPD Management
            new() { Module = "IPD", Action = "RequestAdmission", Code = "IPD.RequestAdmission", Description = "Request patient hospital admission" },
            new() { Module = "IPD", Action = "ApproveAdmission", Code = "IPD.ApproveAdmission", Description = "Approve inpatient admission" },
            new() { Module = "IPD", Action = "ViewAdmissions", Code = "IPD.ViewAdmissions", Description = "View inpatient admissions" },
            new() { Module = "IPD", Action = "CreateDischarge", Code = "IPD.CreateDischarge", Description = "Prepare patient discharge summary" },
            new() { Module = "IPD", Action = "ApproveDischarge", Code = "IPD.ApproveDischarge", Description = "Authorize inpatient discharge" },
            new() { Module = "IPD", Action = "ManageBeds", Code = "IPD.ManageBeds", Description = "Manage ward beds, cabins, and ICU units" },
            new() { Module = "IPD", Action = "ViewBedStatus", Code = "IPD.ViewBedStatus", Description = "Monitor bed occupancy status" },

            // Nursing Management
            new() { Module = "Nursing", Action = "RecordVitals", Code = "Nursing.RecordVitals", Description = "Record regular patient vitals" },
            new() { Module = "Nursing", Action = "CreateNotes", Code = "Nursing.CreateNotes", Description = "Write nursing care notes" },
            new() { Module = "Nursing", Action = "AdministerMedication", Code = "Nursing.AdministerMedication", Description = "Log medicine administration" },
            new() { Module = "Nursing", Action = "ManageShifts", Code = "Nursing.ManageShifts", Description = "Assign nursing duty shifts" },
            new() { Module = "Nursing", Action = "ViewAssignedPatients", Code = "Nursing.ViewAssignedPatients", Description = "View assigned bed patients" },
            new() { Module = "Nursing", Action = "ShiftHandover", Code = "Nursing.ShiftHandover", Description = "Perform shift handover protocols" },

            // Emergency Management
            new() { Module = "Emergency", Action = "Register", Code = "Emergency.Register", Description = "Register emergency trauma cases" },
            new() { Module = "Emergency", Action = "Triage", Code = "Emergency.Triage", Description = "Perform emergency triage categorization" },
            new() { Module = "Emergency", Action = "Treat", Code = "Emergency.Treat", Description = "Provide immediate emergency care" },
            new() { Module = "Emergency", Action = "Admit", Code = "Emergency.Admit", Description = "Transfer emergency case to IPD/ICU" },
            new() { Module = "Emergency", Action = "Discharge", Code = "Emergency.Discharge", Description = "Discharge treated emergency patient" },

            // Blood Bank Management
            new() { Module = "BloodBank", Action = "RegisterDonor", Code = "BloodBank.RegisterDonor", Description = "Register voluntary blood donors" },
            new() { Module = "BloodBank", Action = "CollectBlood", Code = "BloodBank.CollectBlood", Description = "Collect and process blood units" },
            new() { Module = "BloodBank", Action = "ScreenBlood", Code = "BloodBank.ScreenBlood", Description = "Screen and crossmatch blood bags" },
            new() { Module = "BloodBank", Action = "IssueBlood", Code = "BloodBank.IssueBlood", Description = "Issue blood units for surgery/patients" },
            new() { Module = "BloodBank", Action = "RequestBlood", Code = "BloodBank.RequestBlood", Description = "Request blood units from bank" },
            new() { Module = "BloodBank", Action = "ManageInventory", Code = "BloodBank.ManageInventory", Description = "Manage blood stock inventory" },

            // Operation Theatre Management
            new() { Module = "OT", Action = "ScheduleSurgery", Code = "OT.ScheduleSurgery", Description = "Schedule surgical operations" },
            new() { Module = "OT", Action = "ManageOT", Code = "OT.ManageOT", Description = "Manage operating suites and equipment" },
            new() { Module = "OT", Action = "RecordSurgery", Code = "OT.RecordSurgery", Description = "Document operative procedures and notes" },
            new() { Module = "OT", Action = "ViewHistory", Code = "OT.ViewHistory", Description = "Review surgical intervention history" },

            // Insurance Management
            new() { Module = "Insurance", Action = "ManagePolicies", Code = "Insurance.ManagePolicies", Description = "Manage corporate insurance contracts" },
            new() { Module = "Insurance", Action = "SubmitClaim", Code = "Insurance.SubmitClaim", Description = "Submit insurance claims" },
            new() { Module = "Insurance", Action = "ApproveClaim", Code = "Insurance.ApproveClaim", Description = "Approve or reconcile insurance payments" },
            new() { Module = "Insurance", Action = "ViewClaims", Code = "Insurance.ViewClaims", Description = "Track claims settlement status" },

            // HR Management
            new() { Module = "HR", Action = "ViewStaff", Code = "HR.ViewStaff", Description = "View hospital staff directory" },
            new() { Module = "HR", Action = "ManageStaff", Code = "HR.ManageStaff", Description = "Manage employee records and appointments" },
            new() { Module = "HR", Action = "ManageAttendance", Code = "HR.ManageAttendance", Description = "Track staff biometric attendance" },
            new() { Module = "HR", Action = "ManageLeaves", Code = "HR.ManageLeaves", Description = "Manage staff leave applications" },
            new() { Module = "HR", Action = "ManageShifts", Code = "HR.ManageShifts", Description = "Configure hospital duty rosters" },
            new() { Module = "HR", Action = "ViewPayroll", Code = "HR.ViewPayroll", Description = "Process and view employee payroll" },

            // Administration Management
            new() { Module = "Admin", Action = "ManageUsers", Code = "Admin.ManageUsers", Description = "Manage hospital user accounts" },
            new() { Module = "Admin", Action = "ManageRoles", Code = "Admin.ManageRoles", Description = "Configure RBAC roles and permissions" },
            new() { Module = "Admin", Action = "ManagePermissions", Code = "Admin.ManagePermissions", Description = "Manage master permission catalog" },
            new() { Module = "Admin", Action = "ManageDepartments", Code = "Admin.ManageDepartments", Description = "Manage clinical and administrative departments" },
            new() { Module = "Admin", Action = "ManageBranches", Code = "Admin.ManageBranches", Description = "Manage hospital branch locations" },
            new() { Module = "Admin", Action = "ViewAuditLogs", Code = "Admin.ViewAuditLogs", Description = "Audit trail of system modifications" },
            new() { Module = "Admin", Action = "ManageConfiguration", Code = "Admin.ManageConfiguration", Description = "Hospital system-wide settings" },
            new() { Module = "Admin", Action = "SystemBackup", Code = "Admin.SystemBackup", Description = "Execute system backup routines" },

            // Reporting Management
            new() { Module = "Reports", Action = "ViewAdminDashboard", Code = "Reports.ViewAdminDashboard", Description = "Access executive dashboard" },
            new() { Module = "Reports", Action = "ViewDoctorDashboard", Code = "Reports.ViewDoctorDashboard", Description = "Access doctor clinical dashboard" },
            new() { Module = "Reports", Action = "ViewLabDashboard", Code = "Reports.ViewLabDashboard", Description = "Access diagnostic laboratory analytics" },
            new() { Module = "Reports", Action = "ViewPharmacyDashboard", Code = "Reports.ViewPharmacyDashboard", Description = "Access pharmacy sales analytics" },
            new() { Module = "Reports", Action = "ViewFinanceDashboard", Code = "Reports.ViewFinanceDashboard", Description = "Access financial and revenue reports" },
            new() { Module = "Reports", Action = "ExportReports", Code = "Reports.ExportReports", Description = "Export business intelligence reports" }
        };

        foreach (var perm in allPermissions)
        {
            if (!await _context.Permissions.AnyAsync(p => p.Code == perm.Code))
            {
                _context.Permissions.Add(perm);
            }
        }
        await _context.SaveChangesAsync();

        var permissionsLookup = await _context.Permissions.ToDictionaryAsync(p => p.Code, p => p.Id);

        var rolePermissionsMap = new Dictionary<string, string[]>
        {
            ["HospitalAdmin"] = new[]
            {
                "Patients.View", "Patients.Create", "Patients.Edit", "Patients.ViewMedicalHistory", "Patients.Merge", "Patients.Export",
                "Appointments.View", "Appointments.Book", "Appointments.Cancel", "Appointments.Reschedule", "Appointments.ManageSchedules", "Appointments.ManageQueue", "Appointments.CheckIn",
                "Clinical.ViewEncounters", "Clinical.AmendEncounter", "Clinical.ViewHistory",
                "Prescriptions.View", "Prescriptions.DownloadPDF",
                "Laboratory.ViewOrders", "Laboratory.ViewReports", "Laboratory.ManageCatalog",
                "Pharmacy.ViewInventory", "Pharmacy.ManageStock", "Pharmacy.CreatePurchaseOrder", "Pharmacy.ProcessReturn", "Pharmacy.ViewReports",
                "Billing.CreateInvoice", "Billing.ViewInvoices", "Billing.ProcessPayment", "Billing.ProcessRefund", "Billing.ViewReports", "Billing.ManagePricing", "Billing.CashierClosing", "Billing.ApproveRefund",
                "IPD.ApproveAdmission", "IPD.ViewAdmissions", "IPD.ApproveDischarge", "IPD.ManageBeds", "IPD.ViewBedStatus",
                "Nursing.ManageShifts", "Nursing.ViewAssignedPatients",
                "Emergency.Register", "Emergency.Admit", "Emergency.Discharge",
                "BloodBank.ManageInventory",
                "OT.ScheduleSurgery", "OT.ManageOT", "OT.ViewHistory",
                "Insurance.ManagePolicies", "Insurance.SubmitClaim", "Insurance.ApproveClaim", "Insurance.ViewClaims",
                "HR.ViewStaff", "HR.ManageStaff", "HR.ManageAttendance", "HR.ManageLeaves", "HR.ManageShifts", "HR.ViewPayroll",
                "Admin.ManageUsers", "Admin.ManageRoles", "Admin.ManageDepartments", "Admin.ManageBranches", "Admin.ViewAuditLogs", "Admin.ManageConfiguration",
                "Reports.ViewAdminDashboard", "Reports.ViewDoctorDashboard", "Reports.ViewLabDashboard", "Reports.ViewPharmacyDashboard", "Reports.ViewFinanceDashboard", "Reports.ExportReports"
            },
            ["BranchManager"] = new[]
            {
                "Patients.View", "Patients.Create", "Patients.Edit", "Patients.ViewMedicalHistory", "Patients.Export",
                "Appointments.View", "Appointments.Book", "Appointments.Cancel", "Appointments.Reschedule", "Appointments.ManageSchedules", "Appointments.ManageQueue", "Appointments.CheckIn",
                "Clinical.ViewEncounters", "Clinical.ViewHistory",
                "Prescriptions.View", "Prescriptions.DownloadPDF",
                "Laboratory.ViewOrders", "Laboratory.ViewReports",
                "Pharmacy.ViewInventory", "Pharmacy.ManageStock", "Pharmacy.CreatePurchaseOrder", "Pharmacy.ProcessReturn", "Pharmacy.ViewReports",
                "Billing.CreateInvoice", "Billing.ViewInvoices", "Billing.ProcessPayment", "Billing.ProcessRefund", "Billing.ViewReports", "Billing.CashierClosing", "Billing.ApproveRefund",
                "IPD.ApproveAdmission", "IPD.ViewAdmissions", "IPD.ApproveDischarge", "IPD.ManageBeds", "IPD.ViewBedStatus",
                "Nursing.ManageShifts", "Nursing.ViewAssignedPatients",
                "Emergency.Register", "Emergency.Admit",
                "OT.ScheduleSurgery", "OT.ManageOT", "OT.ViewHistory",
                "Insurance.ManagePolicies", "Insurance.SubmitClaim", "Insurance.ApproveClaim", "Insurance.ViewClaims",
                "HR.ViewStaff", "HR.ManageStaff", "HR.ManageAttendance", "HR.ManageLeaves", "HR.ManageShifts",
                "Admin.ManageUsers", "Admin.ViewAuditLogs",
                "Reports.ViewAdminDashboard", "Reports.ViewDoctorDashboard", "Reports.ViewLabDashboard", "Reports.ViewPharmacyDashboard", "Reports.ViewFinanceDashboard", "Reports.ExportReports"
            },
            ["Receptionist"] = new[]
            {
                "Patients.View", "Patients.Create", "Patients.Edit",
                "Appointments.View", "Appointments.Book", "Appointments.Cancel", "Appointments.Reschedule", "Appointments.ManageQueue", "Appointments.CheckIn",
                "Laboratory.ViewOrders",
                "Billing.CreateInvoice", "Billing.ViewInvoices", "Billing.ProcessPayment",
                "IPD.ViewAdmissions", "IPD.ViewBedStatus",
                "Emergency.Register",
                "Insurance.SubmitClaim", "Insurance.ViewClaims"
            },
            ["Doctor"] = new[]
            {
                "Patients.View", "Patients.ViewMedicalHistory",
                "Appointments.View", "Appointments.Cancel", "Appointments.Reschedule", "Appointments.ManageSchedules", "Appointments.ManageQueue",
                "Clinical.ViewEncounters", "Clinical.CreateEncounter", "Clinical.FinalizeEncounter", "Clinical.AmendEncounter", "Clinical.RecordVitals", "Clinical.ViewHistory",
                "Prescriptions.Create", "Prescriptions.Finalize", "Prescriptions.View", "Prescriptions.DownloadPDF",
                "Laboratory.ViewOrders", "Laboratory.CreateOrder", "Laboratory.ViewReports",
                "Billing.ViewInvoices",
                "IPD.RequestAdmission", "IPD.ViewAdmissions", "IPD.CreateDischarge", "IPD.ApproveDischarge", "IPD.ViewBedStatus",
                "Nursing.RecordVitals", "Nursing.ViewAssignedPatients",
                "Emergency.Register", "Emergency.Triage", "Emergency.Treat", "Emergency.Admit", "Emergency.Discharge",
                "BloodBank.RequestBlood",
                "OT.ScheduleSurgery", "OT.RecordSurgery", "OT.ViewHistory",
                "HR.ManageLeaves", "HR.ViewPayroll",
                "Reports.ViewDoctorDashboard"
            },
            ["Nurse"] = new[]
            {
                "Patients.View", "Patients.ViewMedicalHistory",
                "Appointments.View", "Appointments.CheckIn",
                "Clinical.ViewEncounters", "Clinical.RecordVitals", "Clinical.ViewHistory",
                "Prescriptions.View",
                "Laboratory.ViewOrders", "Laboratory.CollectSample", "Laboratory.ViewReports",
                "IPD.ViewAdmissions", "IPD.ManageBeds", "IPD.ViewBedStatus",
                "Nursing.RecordVitals", "Nursing.CreateNotes", "Nursing.AdministerMedication", "Nursing.ViewAssignedPatients", "Nursing.ShiftHandover",
                "Emergency.Register", "Emergency.Triage",
                "BloodBank.RequestBlood",
                "OT.ManageOT", "OT.ViewHistory",
                "HR.ManageLeaves", "HR.ViewPayroll"
            },
            ["LabTechnician"] = new[]
            {
                "Patients.View",
                "Laboratory.ViewOrders", "Laboratory.CollectSample", "Laboratory.EnterResults", "Laboratory.ViewReports",
                "HR.ManageLeaves", "HR.ViewPayroll",
                "Reports.ViewLabDashboard"
            },
            ["Pathologist"] = new[]
            {
                "Patients.View",
                "Laboratory.ViewOrders", "Laboratory.EnterResults", "Laboratory.VerifyResults", "Laboratory.PublishReport", "Laboratory.ViewReports", "Laboratory.ManageCatalog",
                "BloodBank.ScreenBlood",
                "HR.ManageLeaves", "HR.ViewPayroll",
                "Reports.ViewLabDashboard"
            },
            ["Radiologist"] = new[]
            {
                "Patients.View",
                "Clinical.ViewHistory",
                "HR.ManageLeaves", "HR.ViewPayroll"
            },
            ["Pharmacist"] = new[]
            {
                "Patients.View",
                "Prescriptions.View", "Prescriptions.DownloadPDF",
                "Pharmacy.ViewInventory", "Pharmacy.Dispense", "Pharmacy.ManageStock", "Pharmacy.CreatePurchaseOrder", "Pharmacy.ReceiveGoods", "Pharmacy.ProcessReturn", "Pharmacy.ViewReports",
                "Billing.CreateInvoice", "Billing.ViewInvoices", "Billing.ProcessPayment",
                "HR.ManageLeaves", "HR.ViewPayroll",
                "Reports.ViewPharmacyDashboard"
            },
            ["Cashier"] = new[]
            {
                "Patients.View",
                "Appointments.View",
                "Billing.CreateInvoice", "Billing.ViewInvoices", "Billing.ProcessPayment", "Billing.CashierClosing",
                "IPD.ViewAdmissions",
                "Insurance.SubmitClaim", "Insurance.ViewClaims",
                "HR.ManageLeaves", "HR.ViewPayroll"
            },
            ["Accountant"] = new[]
            {
                "Billing.ViewInvoices", "Billing.ViewReports", "Billing.CashierClosing", "Billing.ApproveRefund",
                "Pharmacy.ViewReports",
                "Insurance.SubmitClaim", "Insurance.ApproveClaim", "Insurance.ViewClaims",
                "HR.ViewPayroll", "HR.ManageLeaves",
                "Reports.ViewFinanceDashboard", "Reports.ExportReports"
            },
            ["InventoryManager"] = new[]
            {
                "Pharmacy.ViewInventory", "Pharmacy.ManageStock", "Pharmacy.CreatePurchaseOrder", "Pharmacy.ReceiveGoods",
                "Reports.ViewPharmacyDashboard",
                "HR.ManageLeaves", "HR.ViewPayroll"
            },
            ["HRManager"] = new[]
            {
                "HR.ViewStaff", "HR.ManageStaff", "HR.ManageAttendance", "HR.ManageLeaves", "HR.ManageShifts", "HR.ViewPayroll",
                "Patients.View",
                "Appointments.View"
            },
            ["EmergencyStaff"] = new[]
            {
                "Patients.View", "Patients.Create", "Patients.Edit", "Patients.ViewMedicalHistory",
                "Clinical.ViewEncounters", "Clinical.CreateEncounter", "Clinical.RecordVitals", "Clinical.ViewHistory",
                "Prescriptions.Create", "Prescriptions.View",
                "Laboratory.ViewOrders", "Laboratory.CreateOrder", "Laboratory.ViewReports",
                "Billing.CreateInvoice", "Billing.ViewInvoices", "Billing.ProcessPayment",
                "IPD.RequestAdmission", "IPD.ViewAdmissions", "IPD.ViewBedStatus",
                "Nursing.RecordVitals",
                "Emergency.Register", "Emergency.Triage", "Emergency.Treat", "Emergency.Admit", "Emergency.Discharge",
                "BloodBank.RequestBlood",
                "OT.ScheduleSurgery", "OT.ViewHistory",
                "HR.ManageLeaves", "HR.ViewPayroll"
            },
            ["BloodBankTechnician"] = new[]
            {
                "Patients.View",
                "BloodBank.RegisterDonor", "BloodBank.CollectBlood", "BloodBank.ScreenBlood", "BloodBank.IssueBlood", "BloodBank.RequestBlood", "BloodBank.ManageInventory",
                "HR.ManageLeaves", "HR.ViewPayroll"
            },
            ["Patient"] = new[]
            {
                "Patients.View", "Patients.Edit", "Patients.ViewMedicalHistory", "Patients.Export",
                "Appointments.View", "Appointments.Book", "Appointments.Cancel", "Appointments.Reschedule",
                "Clinical.ViewEncounters", "Clinical.ViewHistory",
                "Prescriptions.View", "Prescriptions.DownloadPDF",
                "Laboratory.ViewOrders", "Laboratory.ViewReports",
                "Billing.ViewInvoices",
                "IPD.ViewAdmissions",
                "OT.ViewHistory",
                "Insurance.ViewClaims"
            }
        };

        // Seed SuperAdmin with ALL permissions
        var superAdminRole = await _roleManager.FindByNameAsync("SuperAdmin");
        if (superAdminRole != null)
        {
            var existingRolePermIds = await _context.RolePermissions
                .Where(rp => rp.RoleId == superAdminRole.Id)
                .Select(rp => rp.PermissionId)
                .ToHashSetAsync();

            foreach (var permId in permissionsLookup.Values)
            {
                if (!existingRolePermIds.Contains(permId))
                {
                    _context.RolePermissions.Add(new RolePermission { RoleId = superAdminRole.Id, PermissionId = permId });
                }
            }
            await _context.SaveChangesAsync();
        }

        // Seed remaining roles
        foreach (var (roleName, permCodes) in rolePermissionsMap)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role == null) continue;

            var existingRolePermIds = await _context.RolePermissions
                .Where(rp => rp.RoleId == role.Id)
                .Select(rp => rp.PermissionId)
                .ToHashSetAsync();

            foreach (var code in permCodes)
            {
                if (permissionsLookup.TryGetValue(code, out var permId) && !existingRolePermIds.Contains(permId))
                {
                    _context.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = permId });
                }
            }
        }
        await _context.SaveChangesAsync();
    }

    private async Task SeedUsersAsync()
    {
        var mainBranch = await _context.Branches.FirstOrDefaultAsync(b => b.Code == "BR-DHD-01");
        var medDept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == "MED");
        var labDept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == "LAB");
        var radDept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == "RAD");
        var pharmDept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == "PHARM");
        var finDept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == "FIN");
        var erDept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == "ER");
        var bbDept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == "BB");
        var hrDept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == "HR");

        var usersToSeed = new (string Email, string Password, string FullName, string Phone, string Role, Guid? DeptId)[]
        {
            ("admin@hospitalms.com", "Admin@123456", "System Super Administrator", "+880 1700-000000", "SuperAdmin", null),
            ("hospitaladmin@hospitalms.com", "Staff@123456", "Dr. Farhana Ahmed", "+880 1711-001001", "HospitalAdmin", hrDept?.Id),
            ("branchmanager@hospitalms.com", "Staff@123456", "Tanvir Hasan", "+880 1711-001002", "BranchManager", null),
            ("reception@hospitalms.com", "Staff@123456", "Nusrat Jahan", "+880 1712-334455", "Receptionist", null),
            ("dr.thompson@hospitalms.com", "Doctor@123456", "Dr. James Thompson", "+880 1711-223344", "Doctor", medDept?.Id),
            ("nurse@hospitalms.com", "Staff@123456", "Rokeya Begum", "+880 1713-112233", "Nurse", medDept?.Id),
            ("labtech@hospitalms.com", "Staff@123456", "Kamal Hossain", "+880 1714-223344", "LabTechnician", labDept?.Id),
            ("pathologist@hospitalms.com", "Staff@123456", "Dr. Shamsul Alam", "+880 1715-334455", "Pathologist", labDept?.Id),
            ("radiologist@hospitalms.com", "Staff@123456", "Dr. Shirin Akhtar", "+880 1716-445566", "Radiologist", radDept?.Id),
            ("pharmacist@hospitalms.com", "Staff@123456", "Mahmudul Karim", "+880 1717-556677", "Pharmacist", pharmDept?.Id),
            ("cashier@hospitalms.com", "Staff@123456", "Sabbir Hossain", "+880 1718-667788", "Cashier", finDept?.Id),
            ("accountant@hospitalms.com", "Staff@123456", "Nazrul Islam", "+880 1719-778899", "Accountant", finDept?.Id),
            ("inventory@hospitalms.com", "Staff@123456", "Shafiqul Rahman", "+880 1720-889900", "InventoryManager", pharmDept?.Id),
            ("hrmanager@hospitalms.com", "Staff@123456", "Sadia Chowdhury", "+880 1721-990011", "HRManager", hrDept?.Id),
            ("emergency@hospitalms.com", "Staff@123456", "Dr. Arif Billah", "+880 1722-001122", "EmergencyStaff", erDept?.Id),
            ("bloodbank@hospitalms.com", "Staff@123456", "Moniruzzaman", "+880 1723-112233", "BloodBankTechnician", bbDept?.Id),
            ("patient@hospitalms.com", "Patient@123456", "Rahim Uddin", "+880 1715-001122", "Patient", null)
        };

        foreach (var item in usersToSeed)
        {
            var user = await _userManager.FindByEmailAsync(item.Email);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = item.Email,
                    Email = item.Email,
                    FullName = item.FullName,
                    PhoneNumber = item.Phone,
                    BranchId = mainBranch?.Id,
                    DepartmentId = item.DeptId,
                    EmailConfirmed = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var createRes = await _userManager.CreateAsync(user, item.Password);
                if (createRes.Succeeded)
                {
                    await _userManager.AddToRoleAsync(user, item.Role);
                }
            }
            else
            {
                if (!await _userManager.IsInRoleAsync(user, item.Role))
                {
                    await _userManager.AddToRoleAsync(user, item.Role);
                }
            }
        }

        // Ensure demo Patient entity exists
        if (!await _context.Patients.AnyAsync(p => p.Email == "patient@hospitalms.com"))
        {
            _context.Patients.Add(new Patient
            {
                PatientUid = "PAT-2026-0001",
                FirstName = "Rahim",
                LastName = "Uddin",
                DateOfBirth = new DateTime(1990, 5, 14, 0, 0, 0, DateTimeKind.Utc),
                Gender = "Male",
                BloodGroup = "O+",
                Phone = "+880 1715-001122",
                Email = "patient@hospitalms.com",
                Address = "Plot 12, Mirpur-10, Dhaka 1216",
                EmergencyContactName = "Fatema Begum",
                EmergencyContactPhone = "+880 1715-001123",
                MaritalStatus = "Married",
                KnownAllergies = "Penicillin",
                ChronicConditions = "Mild Hypertension",
                IsActive = true
            });
            await _context.SaveChangesAsync();
        }
    }

    private async Task SeedHealthcareDataAsync()
    {
        var mainBranch = await _context.Branches.FirstOrDefaultAsync();
        if (mainBranch == null) return;

        // 1. Seed Doctors
        if (!await _context.Doctors.AnyAsync())
        {
            var medDept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == "MED");
            var orthoDept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == "ORTHO");
            var cardioDept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == "CARD");
            var pedDept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == "PED");
            var gynaeDept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == "GYNAE");

            var doctors = new List<Doctor>
            {
                new()
                {
                    FullName = "Dr. James Thompson",
                    Specialization = "General Medicine",
                    Qualifications = "MBBS, FCPS (Medicine)",
                    LicenseNumber = "BMDC-A-45812",
                    ConsultationFee = 1200m,
                    FollowUpDays = 7,
                    RoomNumber = "Room 302",
                    Phone = "+880 1711-223344",
                    Email = "dr.thompson@hospitalms.com",
                    DepartmentId = medDept?.Id ?? Guid.Empty,
                    IsAvailable = true,
                    IsAvailableTelemedicine = true
                },
                new()
                {
                    FullName = "Dr. Michael Anderson",
                    Specialization = "Orthopedics & Spine",
                    Qualifications = "MBBS, MS (Ortho)",
                    LicenseNumber = "BMDC-A-32910",
                    ConsultationFee = 1500m,
                    FollowUpDays = 14,
                    RoomNumber = "Room 405",
                    Phone = "+880 1712-445566",
                    Email = "dr.anderson@hospitalms.com",
                    DepartmentId = orthoDept?.Id ?? Guid.Empty,
                    IsAvailable = false, // Unavailable in mockup
                    IsAvailableTelemedicine = false
                },
                new()
                {
                    FullName = "Dr. Olivia Martinez",
                    Specialization = "Cardiology & Interventional",
                    Qualifications = "MBBS, MD (Cardiology), FACC",
                    LicenseNumber = "BMDC-A-56123",
                    ConsultationFee = 1800m,
                    FollowUpDays = 10,
                    RoomNumber = "Room 201",
                    Phone = "+880 1713-778899",
                    Email = "dr.martinez@hospitalms.com",
                    DepartmentId = cardioDept?.Id ?? Guid.Empty,
                    IsAvailable = true,
                    IsAvailableTelemedicine = true
                },
                new()
                {
                    FullName = "Dr. Emily Carter",
                    Specialization = "Pediatrics & Neonatology",
                    Qualifications = "MBBS, DCH, FCPS (Ped)",
                    LicenseNumber = "BMDC-A-67104",
                    ConsultationFee = 1000m,
                    FollowUpDays = 5,
                    RoomNumber = "Room 105",
                    Phone = "+880 1714-112233",
                    Email = "dr.carter@hospitalms.com",
                    DepartmentId = pedDept?.Id ?? Guid.Empty,
                    IsAvailable = true,
                    IsAvailableTelemedicine = false
                },
                new()
                {
                    FullName = "Dr. Sarah Ahmed",
                    Specialization = "Gynecology & Obstetrics",
                    Qualifications = "MBBS, FCPS (Gynae), MRCOG",
                    LicenseNumber = "BMDC-A-78234",
                    ConsultationFee = 1400m,
                    FollowUpDays = 7,
                    RoomNumber = "Room 214",
                    Phone = "+880 1715-998877",
                    Email = "dr.ahmed@hospitalms.com",
                    DepartmentId = gynaeDept?.Id ?? Guid.Empty,
                    IsAvailable = true,
                    IsAvailableTelemedicine = true
                }
            };

            _context.Doctors.AddRange(doctors);
            await _context.SaveChangesAsync();

            // Schedules for each doctor
            foreach (var doc in doctors)
            {
                for (var day = 0; day <= 6; day++)
                {
                    if (day == (int)DayOfWeek.Friday) continue; // Off on Friday
                    _context.DoctorSchedules.Add(new DoctorSchedule
                    {
                        DoctorId = doc.Id,
                        DayOfWeek = (DayOfWeek)day,
                        StartTime = new TimeSpan(9, 0, 0),
                        EndTime = new TimeSpan(13, 0, 0),
                        MaxPatients = 25,
                        SlotDurationMinutes = 15,
                        IsActive = true
                    });
                }
            }
            await _context.SaveChangesAsync();
        }

        // 2. Seed Patients
        if (!await _context.Patients.AnyAsync())
        {
            var patients = new List<Patient>
            {
                new()
                {
                    PatientUid = "DCH-202610-0001",
                    FirstName = "Tanvir",
                    LastName = "Hossain",
                    DateOfBirth = new DateTime(1988, 5, 14, 0, 0, 0, DateTimeKind.Utc),
                    Gender = "Male",
                    BloodGroup = "O+",
                    Phone = "+880 1712-100201",
                    Email = "tanvir.h@gmail.com",
                    Address = "House 12, Road 4, Dhanmondi, Dhaka",
                    EmergencyContactName = "Nasrin Hossain",
                    EmergencyContactPhone = "+880 1712-100202",
                    KnownAllergies = "Penicillin",
                    ChronicConditions = "Hypertension"
                },
                new()
                {
                    PatientUid = "DCH-202610-0002",
                    FirstName = "Farzana",
                    LastName = "Akter",
                    DateOfBirth = new DateTime(1994, 9, 21, 0, 0, 0, DateTimeKind.Utc),
                    Gender = "Female",
                    BloodGroup = "A+",
                    Phone = "+880 1713-200301",
                    Email = "farzana.akter@yahoo.com",
                    Address = "Flat 4B, Green Road, Dhaka",
                    EmergencyContactName = "Kalam Akter",
                    EmergencyContactPhone = "+880 1713-200302"
                },
                new()
                {
                    PatientUid = "DCH-202610-0003",
                    FirstName = "Rahat",
                    LastName = "Chowdhury",
                    DateOfBirth = new DateTime(1975, 12, 3, 0, 0, 0, DateTimeKind.Utc),
                    Gender = "Male",
                    BloodGroup = "B+",
                    Phone = "+880 1714-300401",
                    Email = "rahat.chowdhury@outlook.com",
                    Address = "Road 27, Banani, Dhaka",
                    ChronicConditions = "Type-2 Diabetes"
                },
                new()
                {
                    PatientUid = "DCH-202610-0004",
                    FirstName = "Sumaiya",
                    LastName = "Rahman",
                    DateOfBirth = new DateTime(2001, 3, 18, 0, 0, 0, DateTimeKind.Utc),
                    Gender = "Female",
                    BloodGroup = "AB+",
                    Phone = "+880 1715-400501",
                    Address = "Mirpur-10, Dhaka"
                },
                new()
                {
                    PatientUid = "DCH-202610-0005",
                    FirstName = "Aayan",
                    LastName = "Karim",
                    DateOfBirth = new DateTime(2018, 7, 10, 0, 0, 0, DateTimeKind.Utc),
                    Gender = "Male",
                    BloodGroup = "O+",
                    Phone = "+880 1716-500601",
                    Address = "Lalmatia Block C, Dhaka",
                    EmergencyContactName = "Rezaul Karim",
                    EmergencyContactPhone = "+880 1716-500602"
                }
            };

            _context.Patients.AddRange(patients);
            await _context.SaveChangesAsync();
        }

        // 3. Seed Diagnostic Lab Tests
        if (!await _context.LabTests.AnyAsync())
        {
            var tests = new List<LabTest>
            {
                new() { Code = "CBC-01", Name = "Complete Blood Count (CBC) with ESR", Category = "Hematology", SampleType = "Whole Blood", Price = 450m, TurnaroundHours = 4, ReferenceRange = "Hb: 12-16 g/dL, WBC: 4-11 x10^9/L" },
                new() { Code = "LIP-01", Name = "Lipid Profile Fasting", Category = "Biochemistry", SampleType = "Serum", Price = 1200m, TurnaroundHours = 6, ReferenceRange = "Total Chol: <200 mg/dL, HDL: >40 mg/dL" },
                new() { Code = "HBA1C-01", Name = "Glycated Hemoglobin (HbA1c)", Category = "Biochemistry", SampleType = "Whole Blood", Price = 800m, TurnaroundHours = 4, ReferenceRange = "< 5.7% Normal" },
                new() { Code = "LFT-01", Name = "Liver Function Test (LFT)", Category = "Biochemistry", SampleType = "Serum", Price = 1100m, TurnaroundHours = 6, ReferenceRange = "SGPT/ALT: <45 U/L, Bilirubin: <1.2 mg/dL" },
                new() { Code = "RFT-01", Name = "Renal Function Test (Creatinine + Urea)", Category = "Biochemistry", SampleType = "Serum", Price = 650m, TurnaroundHours = 4, ReferenceRange = "Creatinine: 0.7-1.3 mg/dL" },
                new() { Code = "ECG-01", Name = "12-Lead Electrocardiogram (ECG)", Category = "Cardiology", SampleType = "Investigation", Price = 500m, TurnaroundHours = 1, ReferenceRange = "Normal Sinus Rhythm" },
                new() { Code = "XRAY-01", Name = "Chest X-Ray Digital P/A View", Category = "Radiology", SampleType = "Imaging", Price = 750m, TurnaroundHours = 2, ReferenceRange = "Normal lung fields and cardiac shadow" },
                new() { Code = "USG-01", Name = "USG of Whole Abdomen", Category = "Radiology", SampleType = "Ultrasound", Price = 1800m, TurnaroundHours = 2, ReferenceRange = "Normal visceral architecture" }
            };

            _context.LabTests.AddRange(tests);
            await _context.SaveChangesAsync();
        }

        // 4. Seed Medicines
        if (!await _context.Medicines.AnyAsync())
        {
            var meds = new List<Medicine>
            {
                new() { BrandName = "Napa Extra", GenericName = "Paracetamol + Caffeine", Manufacturer = "Beximco Pharma", DosageForm = "Tablet", Strength = "500mg+65mg", UnitPrice = 3.00m, StockQuantity = 2400, ReorderLevel = 200 },
                new() { BrandName = "Seclo 20", GenericName = "Omeprazole", Manufacturer = "Square Pharmaceuticals", DosageForm = "Capsule", Strength = "20mg", UnitPrice = 6.00m, StockQuantity = 1850, ReorderLevel = 150 },
                new() { BrandName = "Moxaclav 625", GenericName = "Amoxicillin + Clavulanic Acid", Manufacturer = "Square Pharmaceuticals", DosageForm = "Tablet", Strength = "625mg", UnitPrice = 35.00m, StockQuantity = 640, ReorderLevel = 100 },
                new() { BrandName = "Atova 10", GenericName = "Atorvastatin", Manufacturer = "Incepta Pharmaceuticals", DosageForm = "Tablet", Strength = "10mg", UnitPrice = 12.00m, StockQuantity = 920, ReorderLevel = 80 },
                new() { BrandName = "Glucophage 500", GenericName = "Metformin HCl", Manufacturer = "Sanofi Bangladesh", DosageForm = "Tablet", Strength = "500mg", UnitPrice = 5.50m, StockQuantity = 1450, ReorderLevel = 120 },
                new() { BrandName = "Azithral 500", GenericName = "Azithromycin", Manufacturer = "Popular Pharmaceuticals", DosageForm = "Tablet", Strength = "500mg", UnitPrice = 40.00m, StockQuantity = 420, ReorderLevel = 60 },
                new() { BrandName = "Pantonix 40", GenericName = "Pantoprazole", Manufacturer = "Incepta Pharmaceuticals", DosageForm = "Tablet", Strength = "40mg", UnitPrice = 8.00m, StockQuantity = 1100, ReorderLevel = 100 }
            };

            _context.Medicines.AddRange(meds);
            await _context.SaveChangesAsync();
        }

        // 5. Seed Appointments
        if (!await _context.Appointments.AnyAsync())
        {
            var firstDoc = await _context.Doctors.FirstOrDefaultAsync();
            var secondDoc = await _context.Doctors.Skip(1).FirstOrDefaultAsync();
            var firstPatient = await _context.Patients.FirstOrDefaultAsync();
            var secondPatient = await _context.Patients.Skip(1).FirstOrDefaultAsync();

            if (firstDoc != null && firstPatient != null)
            {
                var appts = new List<Appointment>
                {
                    new()
                    {
                        AppointmentNumber = "APT-202610-01",
                        PatientId = firstPatient.Id,
                        DoctorId = firstDoc.Id,
                        BranchId = mainBranch.Id,
                        AppointmentDate = DateTime.UtcNow.Date,
                        SlotStartTime = new TimeSpan(9, 30, 0),
                        SlotEndTime = new TimeSpan(9, 45, 0),
                        AppointmentType = "InPerson",
                        Status = "CheckedIn",
                        QueueSerialNumber = 1,
                        FeeAmount = firstDoc.ConsultationFee,
                        IsPaid = true,
                        Reason = "Severe migraine and fatigue"
                    },
                    new()
                    {
                        AppointmentNumber = "APT-202610-02",
                        PatientId = secondPatient != null ? secondPatient.Id : firstPatient.Id,
                        DoctorId = secondDoc != null ? secondDoc.Id : firstDoc.Id,
                        BranchId = mainBranch.Id,
                        AppointmentDate = DateTime.UtcNow.Date,
                        SlotStartTime = new TimeSpan(10, 0, 0),
                        SlotEndTime = new TimeSpan(10, 15, 0),
                        AppointmentType = "InPerson",
                        Status = "Scheduled",
                        QueueSerialNumber = 2,
                        FeeAmount = 1500m,
                        IsPaid = false,
                        Reason = "Knee pain following sports injury"
                    }
                };

                _context.Appointments.AddRange(appts);
                await _context.SaveChangesAsync();
            }
        }
    }
}
