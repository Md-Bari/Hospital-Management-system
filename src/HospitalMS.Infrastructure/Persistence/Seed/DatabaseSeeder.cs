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

        var corePermissions = new List<Permission>
        {
            new() { Module = "Patients", Action = "View", Code = "Patients.View", Description = "View patient records" },
            new() { Module = "Patients", Action = "Create", Code = "Patients.Create", Description = "Register new patients" },
            new() { Module = "Patients", Action = "Edit", Code = "Patients.Edit", Description = "Edit patient details" },
            new() { Module = "Appointments", Action = "View", Code = "Appointments.View", Description = "View appointments" },
            new() { Module = "Appointments", Action = "Book", Code = "Appointments.Book", Description = "Book appointments" },
            new() { Module = "Appointments", Action = "Cancel", Code = "Appointments.Cancel", Description = "Cancel appointments" },
            new() { Module = "Clinical", Action = "View", Code = "Clinical.View", Description = "View clinical encounters" },
            new() { Module = "Clinical", Action = "Create", Code = "Clinical.Create", Description = "Create clinical encounter notes" },
            new() { Module = "Prescriptions", Action = "Create", Code = "Prescriptions.Create", Description = "Create prescriptions" },
            new() { Module = "Laboratory", Action = "View", Code = "Laboratory.View", Description = "View lab results" },
            new() { Module = "Pharmacy", Action = "Dispense", Code = "Pharmacy.Dispense", Description = "Dispense medicines" },
            new() { Module = "Billing", Action = "CreateInvoice", Code = "Billing.CreateInvoice", Description = "Create billing invoices" },
            new() { Module = "Billing", Action = "ProcessPayment", Code = "Billing.ProcessPayment", Description = "Collect payments" },
            new() { Module = "Admin", Action = "ManageUsers", Code = "Admin.ManageUsers", Description = "Manage hospital staff users" }
        };

        foreach (var perm in corePermissions)
        {
            if (!await _context.Permissions.AnyAsync(p => p.Code == perm.Code))
            {
                _context.Permissions.Add(perm);
            }
        }
        await _context.SaveChangesAsync();

        var adminRole = await _roleManager.FindByNameAsync("SuperAdmin");
        if (adminRole != null)
        {
            var allPerms = await _context.Permissions.ToListAsync();
            foreach (var perm in allPerms)
            {
                if (!await _context.RolePermissions.AnyAsync(rp => rp.RoleId == adminRole.Id && rp.PermissionId == perm.Id))
                {
                    _context.RolePermissions.Add(new RolePermission { RoleId = adminRole.Id, PermissionId = perm.Id });
                }
            }
            await _context.SaveChangesAsync();
        }
    }

    private async Task SeedUsersAsync()
    {
        var mainBranch = await _context.Branches.FirstOrDefaultAsync(b => b.Code == "BR-DHD-01");

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
