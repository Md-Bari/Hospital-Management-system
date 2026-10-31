using HospitalMS.Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.API.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICacheService _cacheService;

    public HealthController(IApplicationDbContext context, ICacheService cacheService)
    {
        _context = context;
        _cacheService = cacheService;
    }

    [HttpGet]
    public async Task<IActionResult> GetHealth()
    {
        var dbHealthy = false;
        var redisHealthy = false;

        try
        {
            _ = await _context.Hospitals.AnyAsync();
            dbHealthy = true;
        }
        catch
        {
            dbHealthy = false;
        }

        try
        {
            await _cacheService.SetAsync("health_check_ping", "pong", TimeSpan.FromSeconds(5));
            var pong = await _cacheService.GetAsync<string>("health_check_ping");
            redisHealthy = pong == "pong";
        }
        catch
        {
            redisHealthy = false;
        }

        var status = (dbHealthy && redisHealthy) ? "Healthy" : (dbHealthy ? "Degraded" : "Unhealthy");

        return Ok(new
        {
            status,
            timestamp = DateTime.UtcNow,
            components = new
            {
                database = dbHealthy ? "Online" : "Offline",
                redisCache = redisHealthy ? "Online" : "Offline"
            },
            version = "1.0.0-phase1",
            locale = new
            {
                country = "Bangladesh",
                currency = "BDT",
                timeZone = "Asia/Dhaka"
            }
        });
    }
}
