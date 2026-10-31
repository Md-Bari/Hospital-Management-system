using System.Text.Json;
using HospitalMS.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace HospitalMS.Infrastructure.Services;

public class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly IDatabase? _db;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(IConfiguration configuration, ILogger<RedisCacheService> logger)
    {
        _logger = logger;
        var connectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";

        try
        {
            var options = ConfigurationOptions.Parse(connectionString);
            options.AbortOnConnectFail = false;
            options.ConnectTimeout = 2000;
            _redis = ConnectionMultiplexer.Connect(options);
            _db = _redis.GetDatabase();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to connect to Redis. Caching will degrade gracefully.");
            _redis = null;
            _db = null;
        }
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        if (_db == null) return default;

        try
        {
            var value = await _db.StringGetAsync(key);
            if (!value.HasValue) return default;

            string? stringValue = value;
            if (string.IsNullOrEmpty(stringValue)) return default;

            return JsonSerializer.Deserialize<T>(stringValue);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis error reading key {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        if (_db == null) return;

        try
        {
            var serialized = JsonSerializer.Serialize(value);
            if (expiration.HasValue)
            {
                await _db.StringSetAsync(key, serialized, expiry: (Expiration)expiration.Value);
            }
            else
            {
                await _db.StringSetAsync(key, serialized);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis error writing key {Key}", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        if (_db == null) return;

        try
        {
            await _db.KeyDeleteAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis error removing key {Key}", key);
        }
    }

    public async Task<bool> AcquireLockAsync(string key, string value, TimeSpan lockDuration, CancellationToken cancellationToken = default)
    {
        if (_db == null) return true; // Graceful degradation if Redis offline

        try
        {
            return await _db.StringSetAsync(key, value, expiry: (Expiration)lockDuration, When.NotExists);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis error acquiring lock for {Key}", key);
            return true;
        }
    }

    public async Task<bool> ReleaseLockAsync(string key, string value, CancellationToken cancellationToken = default)
    {
        if (_db == null) return true;

        try
        {
            // Atomically delete only if the lock value matches
            const string script = @"
                if redis.call('get', KEYS[1]) == ARGV[1] then
                    return redis.call('del', KEYS[1])
                else
                    return 0
                end";

            var result = await _db.ScriptEvaluateAsync(script, new RedisKey[] { key }, new RedisValue[] { value });
            return (int)result == 1;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis error releasing lock for {Key}", key);
            return false;
        }
    }
}
