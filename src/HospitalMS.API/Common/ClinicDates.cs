namespace HospitalMS.API.Common;

/// <summary>
/// Date helpers for calendar-date fields (appointment dates, dates of birth) stored in
/// PostgreSQL "timestamp with time zone" columns. Npgsql rejects DateTime values whose
/// Kind is Unspecified, which is what model binding produces for "yyyy-MM-dd" input.
/// </summary>
public static class ClinicDates
{
    private static readonly TimeZoneInfo HospitalTimeZone = ResolveHospitalTimeZone();

    /// <summary>Normalizes a value to midnight of its calendar date, tagged as UTC.</summary>
    public static DateTime AsUtcDate(DateTime value) => DateTime.SpecifyKind(value.Date, DateTimeKind.Utc);

    /// <summary>Today's calendar date in the hospital's time zone (Asia/Dhaka), tagged as UTC.</summary>
    public static DateTime Today() => AsUtcDate(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, HospitalTimeZone));

    public static int AgeOn(DateTime dateOfBirth, DateTime today)
    {
        var age = today.Year - dateOfBirth.Year;
        if (dateOfBirth.Date > today.Date.AddYears(-age)) age--;
        return Math.Max(0, age);
    }

    public static int Age(DateTime dateOfBirth) => AgeOn(dateOfBirth, Today());

    private static TimeZoneInfo ResolveHospitalTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Dhaka");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.CreateCustomTimeZone("Asia/Dhaka", TimeSpan.FromHours(6), "Asia/Dhaka", "Asia/Dhaka");
        }
    }
}
