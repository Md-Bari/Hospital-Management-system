using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HospitalMS.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInpatientWardsAndBeds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ipd_wards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchId = table.Column<Guid>(type: "uuid", nullable: true),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    WardType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FloorNumber = table.Column<int>(type: "integer", nullable: false),
                    GenderRestriction = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DailyRate = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalBeds = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_ipd_wards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ipd_wards_core_branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "core_branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ipd_beds",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WardId = table.Column<Guid>(type: "uuid", nullable: false),
                    BedNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BedType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DailyRate = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CurrentAdmissionId = table.Column<Guid>(type: "uuid", nullable: true),
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
                    table.PrimaryKey("PK_ipd_beds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ipd_beds_ipd_wards_WardId",
                        column: x => x.WardId,
                        principalTable: "ipd_wards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ipd_admissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AdmissionNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    DoctorId = table.Column<Guid>(type: "uuid", nullable: false),
                    WardId = table.Column<Guid>(type: "uuid", nullable: false),
                    BedId = table.Column<Guid>(type: "uuid", nullable: false),
                    AdmissionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DischargeDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ProvisionalDiagnosis = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    AdmissionPriority = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    InitialDeposit = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    EstimatedDays = table.Column<int>(type: "integer", nullable: false),
                    CareInstructions = table.Column<string>(type: "text", nullable: true),
                    DischargeSummary = table.Column<string>(type: "text", nullable: true),
                    AdmittedByRole = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    AdmittedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
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
                    table.PrimaryKey("PK_ipd_admissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ipd_admissions_cln_doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "cln_doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ipd_admissions_ipd_beds_BedId",
                        column: x => x.BedId,
                        principalTable: "ipd_beds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ipd_admissions_ipd_wards_WardId",
                        column: x => x.WardId,
                        principalTable: "ipd_wards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ipd_admissions_pat_patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "pat_patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ipd_admissions_BedId",
                table: "ipd_admissions",
                column: "BedId");

            migrationBuilder.CreateIndex(
                name: "IX_ipd_admissions_DoctorId",
                table: "ipd_admissions",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_ipd_admissions_PatientId",
                table: "ipd_admissions",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_ipd_admissions_WardId",
                table: "ipd_admissions",
                column: "WardId");

            migrationBuilder.CreateIndex(
                name: "IX_ipd_beds_WardId",
                table: "ipd_beds",
                column: "WardId");

            migrationBuilder.CreateIndex(
                name: "IX_ipd_wards_BranchId",
                table: "ipd_wards",
                column: "BranchId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ipd_admissions");

            migrationBuilder.DropTable(
                name: "ipd_beds");

            migrationBuilder.DropTable(
                name: "ipd_wards");
        }
    }
}

