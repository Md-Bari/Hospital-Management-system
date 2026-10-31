namespace HospitalMS.Application.Common.Interfaces;

public interface IEmailService
{
    Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default);
    Task<bool> SendPatientRegistrationOtpAsync(string toEmail, string patientName, string otpCode, int expiryMinutes = 10, CancellationToken cancellationToken = default);
}

