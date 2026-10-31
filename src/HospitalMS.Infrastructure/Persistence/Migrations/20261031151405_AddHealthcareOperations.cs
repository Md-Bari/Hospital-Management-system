using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HospitalMS.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddHealthcareOperations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cln_doctors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    DepartmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    FullName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    LicenseNumber = table.Column<string>(type: "text", nullable: false),
                    Specialization = table.Column<string>(type: "text", nullable: false),
                    Qualifications = table.Column<string>(type: "text", nullable: false),
                    ConsultationFee = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    FollowUpDays = table.Column<int>(type: "integer", nullable: false),
                    RoomNumber = table.Column<string>(type: "text", nullable: true),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    AvatarUrl = table.Column<string>(type: "text", nullable: true),
                    IsAvailable = table.Column<bool>(type: "boolean", nullable: false),
                    IsAvailableTelemedicine = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModifiedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cln_doctors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_cln_doctors_core_departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "core_departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cln_doctors_core_users_UserId",
                        column: x => x.UserId,
                        principalTable: "core_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "diag_lab_tests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    SampleType = table.Column<string>(type: "text", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TurnaroundHours = table.Column<int>(type: "integer", nullable: false),
                    ReferenceRange = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_diag_lab_tests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "pat_patients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientUid = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FirstName = table.Column<string>(type: "text", nullable: false),
                    LastName = table.Column<string>(type: "text", nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Gender = table.Column<string>(type: "text", nullable: false),
                    BloodGroup = table.Column<string>(type: "text", nullable: false),
                    NationalId = table.Column<string>(type: "text", nullable: true),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "text", nullable: true),
                    Address = table.Column<string>(type: "text", nullable: false),
                    EmergencyContactName = table.Column<string>(type: "text", nullable: true),
                    EmergencyContactPhone = table.Column<string>(type: "text", nullable: true),
                    MaritalStatus = table.Column<string>(type: "text", nullable: false),
                    KnownAllergies = table.Column<string>(type: "text", nullable: true),
                    ChronicConditions = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModifiedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pat_patients", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "phm_medicines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BrandName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    GenericName = table.Column<string>(type: "text", nullable: false),
                    Manufacturer = table.Column<string>(type: "text", nullable: false),
                    DosageForm = table.Column<string>(type: "text", nullable: false),
                    Strength = table.Column<string>(type: "text", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    StockQuantity = table.Column<int>(type: "integer", nullable: false),
                    ReorderLevel = table.Column<int>(type: "integer", nullable: false),
                    RequiresPrescription = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModifiedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_phm_medicines", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "cln_doctor_schedules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DoctorId = table.Column<Guid>(type: "uuid", nullable: false),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    MaxPatients = table.Column<int>(type: "integer", nullable: false),
                    SlotDurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cln_doctor_schedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_cln_doctor_schedules_cln_doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "cln_doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "bil_invoices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InvoiceNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubTotal = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TaxAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PaidAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModifiedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bil_invoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_bil_invoices_pat_patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "pat_patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "cln_appointments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AppointmentNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    DoctorId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: true),
                    AppointmentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SlotStartTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    SlotEndTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    AppointmentType = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    QueueSerialNumber = table.Column<int>(type: "integer", nullable: false),
                    FeeAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    IsPaid = table.Column<bool>(type: "boolean", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    CancellationReason = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModifiedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cln_appointments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_cln_appointments_cln_doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "cln_doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cln_appointments_core_branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "core_branches",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_cln_appointments_pat_patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "pat_patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "diag_lab_orders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    DoctorId = table.Column<Guid>(type: "uuid", nullable: true),
                    Priority = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    IsPaid = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModifiedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_diag_lab_orders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_diag_lab_orders_cln_doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "cln_doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_diag_lab_orders_pat_patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "pat_patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "bil_invoice_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InvoiceId = table.Column<Guid>(type: "uuid", nullable: false),
                    ItemName = table.Column<string>(type: "text", nullable: false),
                    ItemType = table.Column<string>(type: "text", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bil_invoice_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_bil_invoice_items_bil_invoices_InvoiceId",
                        column: x => x.InvoiceId,
                        principalTable: "bil_invoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "bil_payments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    InvoiceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PaymentMethod = table.Column<string>(type: "text", nullable: false),
                    TransactionReference = table.Column<string>(type: "text", nullable: true),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModifiedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bil_payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_bil_payments_bil_invoices_InvoiceId",
                        column: x => x.InvoiceId,
                        principalTable: "bil_invoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "cln_encounters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EncounterNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AppointmentId = table.Column<Guid>(type: "uuid", nullable: true),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    DoctorId = table.Column<Guid>(type: "uuid", nullable: false),
                    EncounterDateTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SystolicBp = table.Column<decimal>(type: "numeric", nullable: true),
                    DiastolicBp = table.Column<decimal>(type: "numeric", nullable: true),
                    PulseRate = table.Column<decimal>(type: "numeric", nullable: true),
                    TemperatureCelsius = table.Column<decimal>(type: "numeric", nullable: true),
                    Spo2Percentage = table.Column<decimal>(type: "numeric", nullable: true),
                    WeightKg = table.Column<decimal>(type: "numeric", nullable: true),
                    HeightCm = table.Column<decimal>(type: "numeric", nullable: true),
                    ChiefComplaints = table.Column<string>(type: "text", nullable: false),
                    HistoryOfPresentIllness = table.Column<string>(type: "text", nullable: true),
                    ExaminationFindings = table.Column<string>(type: "text", nullable: true),
                    Diagnosis = table.Column<string>(type: "text", nullable: false),
                    TreatmentPlan = table.Column<string>(type: "text", nullable: true),
                    FollowUpInstructions = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    FinalizedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModifiedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cln_encounters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_cln_encounters_cln_appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "cln_appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_cln_encounters_cln_doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "cln_doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cln_encounters_pat_patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "pat_patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "diag_lab_order_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LabOrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    LabTestId = table.Column<Guid>(type: "uuid", nullable: false),
                    TestName = table.Column<string>(type: "text", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ResultValue = table.Column<string>(type: "text", nullable: true),
                    ReferenceRange = table.Column<string>(type: "text", nullable: true),
                    IsAbnormal = table.Column<bool>(type: "boolean", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ResultEnteredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_diag_lab_order_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_diag_lab_order_items_diag_lab_orders_LabOrderId",
                        column: x => x.LabOrderId,
                        principalTable: "diag_lab_orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_diag_lab_order_items_diag_lab_tests_LabTestId",
                        column: x => x.LabTestId,
                        principalTable: "diag_lab_tests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "cln_prescriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PrescriptionNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EncounterId = table.Column<Guid>(type: "uuid", nullable: true),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    DoctorId = table.Column<Guid>(type: "uuid", nullable: false),
                    DoctorNotes = table.Column<string>(type: "text", nullable: true),
                    LifestyleAdvice = table.Column<string>(type: "text", nullable: true),
                    FollowUpDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ModifiedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cln_prescriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_cln_prescriptions_cln_doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "cln_doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cln_prescriptions_cln_encounters_EncounterId",
                        column: x => x.EncounterId,
                        principalTable: "cln_encounters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_cln_prescriptions_pat_patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "pat_patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "cln_prescription_medicines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PrescriptionId = table.Column<Guid>(type: "uuid", nullable: false),
                    MedicineName = table.Column<string>(type: "text", nullable: false),
                    GenericName = table.Column<string>(type: "text", nullable: true),
                    Dosage = table.Column<string>(type: "text", nullable: false),
                    Frequency = table.Column<string>(type: "text", nullable: false),
                    DurationDays = table.Column<int>(type: "integer", nullable: false),
                    TotalQuantity = table.Column<int>(type: "integer", nullable: false),
                    MealInstruction = table.Column<string>(type: "text", nullable: false),
                    SpecialInstructions = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cln_prescription_medicines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_cln_prescription_medicines_cln_prescriptions_PrescriptionId",
                        column: x => x.PrescriptionId,
                        principalTable: "cln_prescriptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_bil_invoice_items_InvoiceId",
                table: "bil_invoice_items",
                column: "InvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_bil_invoices_PatientId",
                table: "bil_invoices",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_bil_payments_InvoiceId",
                table: "bil_payments",
                column: "InvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_cln_appointments_AppointmentNumber",
                table: "cln_appointments",
                column: "AppointmentNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cln_appointments_BranchId",
                table: "cln_appointments",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_cln_appointments_DoctorId",
                table: "cln_appointments",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_cln_appointments_PatientId",
                table: "cln_appointments",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_cln_doctor_schedules_DoctorId",
                table: "cln_doctor_schedules",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_cln_doctors_DepartmentId",
                table: "cln_doctors",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_cln_doctors_UserId",
                table: "cln_doctors",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cln_encounters_AppointmentId",
                table: "cln_encounters",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_cln_encounters_DoctorId",
                table: "cln_encounters",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_cln_encounters_PatientId",
                table: "cln_encounters",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_cln_prescription_medicines_PrescriptionId",
                table: "cln_prescription_medicines",
                column: "PrescriptionId");

            migrationBuilder.CreateIndex(
                name: "IX_cln_prescriptions_DoctorId",
                table: "cln_prescriptions",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_cln_prescriptions_EncounterId",
                table: "cln_prescriptions",
                column: "EncounterId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cln_prescriptions_PatientId",
                table: "cln_prescriptions",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_diag_lab_order_items_LabOrderId",
                table: "diag_lab_order_items",
                column: "LabOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_diag_lab_order_items_LabTestId",
                table: "diag_lab_order_items",
                column: "LabTestId");

            migrationBuilder.CreateIndex(
                name: "IX_diag_lab_orders_DoctorId",
                table: "diag_lab_orders",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_diag_lab_orders_PatientId",
                table: "diag_lab_orders",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_diag_lab_tests_Code",
                table: "diag_lab_tests",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pat_patients_PatientUid",
                table: "pat_patients",
                column: "PatientUid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pat_patients_Phone",
                table: "pat_patients",
                column: "Phone");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "bil_invoice_items");

            migrationBuilder.DropTable(
                name: "bil_payments");

            migrationBuilder.DropTable(
                name: "cln_doctor_schedules");

            migrationBuilder.DropTable(
                name: "cln_prescription_medicines");

            migrationBuilder.DropTable(
                name: "diag_lab_order_items");

            migrationBuilder.DropTable(
                name: "phm_medicines");

            migrationBuilder.DropTable(
                name: "bil_invoices");

            migrationBuilder.DropTable(
                name: "cln_prescriptions");

            migrationBuilder.DropTable(
                name: "diag_lab_orders");

            migrationBuilder.DropTable(
                name: "diag_lab_tests");

            migrationBuilder.DropTable(
                name: "cln_encounters");

            migrationBuilder.DropTable(
                name: "cln_appointments");

            migrationBuilder.DropTable(
                name: "cln_doctors");

            migrationBuilder.DropTable(
                name: "pat_patients");
        }
    }
}
