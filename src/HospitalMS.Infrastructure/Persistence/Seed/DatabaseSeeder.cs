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
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }

    private async Task SeedHospitalAndBranchesAsync()
    {
        if (await _context.Hospitals.AnyAsync()) return;

        var hospital = new Hospital
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

        var mainBranch = new Branch
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
            new() { BranchId = mainBranch.Id, Name = "Billing & Accounts", Code = "FIN", DepartmentType = "Finance", IsClinical = false }
        };

        _context.Departments.AddRange(departments);
        await _context.SaveChangesAsync();
    }

    private async Task SeedRolesAndPermissionsAsync()
    {
        // 1. Seed 17 Roles
        var roleNames = Enum.GetNames<RoleType>();
        foreach (var roleName in roleNames)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                await _roleManager.CreateAsync(new ApplicationRole
                {
                    Name = roleName,
                    NormalizedName = roleName.ToUpperInvariant(),
                    Description = $"{roleName} operational role with assigned module permissions",
                    IsSystemRole = true
                });
            }
        }

        // 2. Seed Initial Core Permissions
        var permissions = new List<Permission>
        {
            // Patient Management
            new() { Module = "Patients", Action = "View", Code = "Patients.View", Description = "View patient records and history" },
            new() { Module = "Patients", Action = "Create", Code = "Patients.Create", Description = "Register new patients" },
            new() { Module = "Patients", Action = "Edit", Code = "Patients.Edit", Description = "Update patient demographics" },
            new() { Module = "Patients", Action = "Merge", Code = "Patients.Merge", Description = "Merge duplicate patient accounts" },

            // Appointments
            new() { Module = "Appointments", Action = "View", Code = "Appointments.View", Description = "View appointments and queue schedules" },
            new() { Module = "Appointments", Action = "Book", Code = "Appointments.Book", Description = "Book outpatient appointments" },
            new() { Module = "Appointments", Action = "Cancel", Code = "Appointments.Cancel", Description = "Cancel booked appointments" },
            new() { Module = "Appointments", Action = "CheckIn", Code = "Appointments.CheckIn", Description = "Check in patients at counter" },

            // Clinical & Encounters
            new() { Module = "Clinical", Action = "View", Code = "Clinical.View", Description = "View clinical encounters and consultations" },
            new() { Module = "Clinical", Action = "Create", Code = "Clinical.Create", Description = "Create clinical encounter drafts" },
            new() { Module = "Clinical", Action = "Finalize", Code = "Clinical.Finalize", Description = "Finalize consultation and lock EHR record" },

            // Prescriptions
            new() { Module = "Prescriptions", Action = "Create", Code = "Prescriptions.Create", Description = "Create electronic prescriptions" },
            new() { Module = "Prescriptions", Action = "Finalize", Code = "Prescriptions.Finalize", Description = "Finalize prescriptions and order items" },
            new() { Module = "Prescriptions", Action = "View", Code = "Prescriptions.View", Description = "View prescriptions and download PDFs" },

            // Laboratory
            new() { Module = "Laboratory", Action = "View", Code = "Laboratory.View", Description = "View diagnostic orders and results" },
            new() { Module = "Laboratory", Action = "Collect", Code = "Laboratory.Collect", Description = "Collect specimen and scan barcode" },
            new() { Module = "Laboratory", Action = "EnterResults", Code = "Laboratory.EnterResults", Description = "Enter test parameter findings" },
            new() { Module = "Laboratory", Action = "Verify", Code = "Laboratory.Verify", Description = "Pathologist verification of lab report" },
            new() { Module = "Laboratory", Action = "Publish", Code = "Laboratory.Publish", Description = "Publish finalized laboratory reports" },

            // Pharmacy
            new() { Module = "Pharmacy", Action = "View", Code = "Pharmacy.View", Description = "View medicine catalog and stock" },
            new() { Module = "Pharmacy", Action = "Dispense", Code = "Pharmacy.Dispense", Description = "Dispense prescribed medications" },
            new() { Module = "Pharmacy", Action = "ManageStock", Code = "Pharmacy.ManageStock", Description = "Manage batches and inventory transactions" },

            // Billing
            new() { Module = "Billing", Action = "CreateInvoice", Code = "Billing.CreateInvoice", Description = "Generate patient bills" },
            new() { Module = "Billing", Action = "ProcessPayment", Code = "Billing.ProcessPayment", Description = "Accept cash/card/MFS payments" },
            new() { Module = "Billing", Action = "Refund", Code = "Billing.Refund", Description = "Issue authorized billing refunds" },
            new() { Module = "Billing", Action = "ViewReports", Code = "Billing.ViewReports", Description = "View financial revenue reports" },

            // Administration & Security
            new() { Module = "Admin", Action = "ManageUsers", Code = "Admin.ManageUsers", Description = "Manage user accounts and roles" },
            new() { Module = "Admin", Action = "ManageConfig", Code = "Admin.ManageConfig", Description = "Configure hospital global settings" },
            new() { Module = "Admin", Action = "ViewAuditLogs", Code = "Admin.ViewAuditLogs", Description = "Inspect system security audit trail" }
        };

        foreach (var p in permissions)
        {
            if (!await _context.Permissions.AnyAsync(x => x.Code == p.Code))
            {
                _context.Permissions.Add(p);
            }
        }
        await _context.SaveChangesAsync();

        // 3. Map all permissions to SuperAdmin & HospitalAdmin
        var allDbPermissions = await _context.Permissions.ToListAsync();
        var adminRoles = new[] { "SuperAdmin", "HospitalAdmin" };

        foreach (var roleName in adminRoles)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role != null)
            {
                foreach (var permission in allDbPermissions)
                {
                    var exists = await _context.RolePermissions.AnyAsync(rp => rp.RoleId == role.Id && rp.PermissionId == permission.Id);
                    if (!exists)
                    {
                        _context.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = permission.Id });
                    }
                }
            }
        }
        await _context.SaveChangesAsync();
    }

    private async Task SeedUsersAsync()
    {
        var mainBranch = await _context.Branches.FirstOrDefaultAsync();

        // 1. Super Administrator
        var adminEmail = "admin@hospitalms.com";
        var adminUser = await _userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "System Super Administrator",
                PhoneNumber = "+880 1700-000000",
                BranchId = mainBranch?.Id,
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(adminUser, "Admin@123456");
            if (result.Succeeded)
            {
                await _userManager.AddToRolesAsync(adminUser, new[] { "SuperAdmin", "HospitalAdmin" });
            }
        }

        // 2. Demo Doctor: Dr. James Thompson (from the dashboard mockup)
        var doctorEmail = "dr.thompson@hospitalms.com";
        if (await _userManager.FindByEmailAsync(doctorEmail) == null)
        {
            var medDept = await _context.Departments.FirstOrDefaultAsync(d => d.Code == "MED");
            var doctor = new ApplicationUser
            {
                UserName = doctorEmail,
                Email = doctorEmail,
                FullName = "Dr. James Thompson",
                PhoneNumber = "+880 1711-223344",
                BranchId = mainBranch?.Id,
                DepartmentId = medDept?.Id,
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(doctor, "Doctor@123456");
            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(doctor, "Doctor");
            }
        }

        // 3. Demo Receptionist
        var receptionEmail = "reception@hospitalms.com";
        if (await _userManager.FindByEmailAsync(receptionEmail) == null)
        {
            var receptionist = new ApplicationUser
            {
                UserName = receptionEmail,
                Email = receptionEmail,
                FullName = "Nusrat Jahan",
                PhoneNumber = "+880 1712-334455",
                BranchId = mainBranch?.Id,
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(receptionist, "Staff@123456");
            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(receptionist, "Receptionist");
            }
        }
    }
}

