using System.Net;
using System.Net.Mail;
using HospitalMS.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HospitalMS.Infrastructure.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var host = _configuration["SmtpSettings:Host"] ?? Environment.GetEnvironmentVariable("SMTP_HOST") ?? "smtp.gmail.com";
        var portStr = _configuration["SmtpSettings:Port"] ?? Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587";
        int.TryParse(portStr, out var port);
        if (port <= 0) port = 587;

        var username = _configuration["SmtpSettings:Username"] ?? Environment.GetEnvironmentVariable("SMTP_USERNAME") ?? string.Empty;
        var password = _configuration["SmtpSettings:Password"] ?? Environment.GetEnvironmentVariable("SMTP_PASSWORD") ?? string.Empty;
        var fromEmail = _configuration["SmtpSettings:FromEmail"] ?? Environment.GetEnvironmentVariable("SMTP_FROM_EMAIL") ?? "noreply@hospitallink.com";
        var fromName = _configuration["SmtpSettings:FromName"] ?? Environment.GetEnvironmentVariable("SMTP_FROM_NAME") ?? "HospitalLink Health System";
        var enableSsl = bool.TryParse(_configuration["SmtpSettings:EnableSsl"] ?? Environment.GetEnvironmentVariable("SMTP_ENABLE_SSL"), out var ssl) ? ssl : true;

        try
        {
            using var message = new MailMessage();
            message.From = new MailAddress(fromEmail, fromName);
            message.To.Add(new MailAddress(toEmail));
            message.Subject = subject;
            message.Body = htmlBody;
            message.IsBodyHtml = true;

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl,
                Timeout = 10000
            };

            if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
            {
                client.Credentials = new NetworkCredential(username, password);
            }

            _logger.LogInformation("Attempting to send email via SMTP to {ToEmail} using host {Host}:{Port}", toEmail, host, port);
            await client.SendMailAsync(message, cancellationToken);
            _logger.LogInformation("Email successfully sent via SMTP to {ToEmail}", toEmail);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email via SMTP to {ToEmail}. Error: {Message}", toEmail, ex.Message);
            return false;
        }
    }

    public async Task<bool> SendPatientRegistrationOtpAsync(string toEmail, string patientName, string otpCode, int expiryMinutes = 10, CancellationToken cancellationToken = default)
    {
        var subject = $"Your Verification Code: {otpCode} - HospitalLink";
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Patient Registration Verification</title>
</head>
<body style='font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;'>
    <div style='max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;'>
        <div style='background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 28px; text-align: center; color: #ffffff;'>
            <h1 style='margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;'>Hospital<span style='color: #93c5fd;'>Link</span></h1>
            <p style='margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;'>Enterprise Healthcare & Clinical System</p>
        </div>
        <div style='padding: 32px 28px;'>
            <h2 style='margin-top: 0; font-size: 18px; font-weight: 700; color: #0f172a;'>Email Verification Code</h2>
            <p style='font-size: 14px; line-height: 1.6; color: #475569;'>
                Dear <strong>{patientName}</strong>,
            </p>
            <p style='font-size: 14px; line-height: 1.6; color: #475569;'>
                Thank you for registering with HospitalLink. To verify your email address and complete your patient profile intake, please enter the following One-Time Password (OTP):
            </p>
            <div style='margin: 28px 0; text-align: center;'>
                <div style='display: inline-block; background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 14px; padding: 16px 36px;'>
                    <span style='font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8;'>{otpCode}</span>
                </div>
                <p style='margin: 8px 0 0 0; font-size: 12px; color: #64748b; font-weight: 500;'>
                    ⏱️ Code expires in {expiryMinutes} minutes
                </p>
            </div>
            <p style='font-size: 13px; line-height: 1.6; color: #64748b;'>
                If you did not request this verification, please disregard this email. Your email address remains secure.
            </p>
            <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;' />
            <p style='font-size: 12px; color: #94a3b8; margin: 0; text-align: center;'>
                HospitalLink Health System • Dhaka, Bangladesh<br/>
                For medical emergencies, dial ambulance hotline: +880 1234 567 8900
            </p>
        </div>
    </div>
</body>
</html>";

        // Always log OTP for development/troubleshooting transparency
        _logger.LogInformation("=================================================");
        _logger.LogInformation("PATIENT REGISTRATION OTP FOR {Email}: {OtpCode} (Expires in {Minutes}m)", toEmail, otpCode, expiryMinutes);
        _logger.LogInformation("=================================================");

        return await SendEmailAsync(toEmail, subject, htmlBody, cancellationToken);
    }
}

