using System.Net.Http;
using System.Threading.Tasks;

public interface IMeterApiService
{
    Task<string> GetMetersAsync(string token);
    Task<string> GetMeterByIdAsync(string token, int meterId);
    Task<string> CreateMeterAsync(string token, int code, string brand);
    Task<string> UpdateMeterAsync(string token, int meterId, int code, string brand);
    Task<string> DeleteMeterAsync(string token, int meterId);
}

public class MeterApiService : ApiConfig, IMeterApiService
{
    public MeterApiService(HttpClient httpClient = null) : base(httpClient) { }

    public async Task<string> GetMetersAsync(string token)
    {
        return await GetAsync("meters", token);
    }

    public async Task<string> GetMeterByIdAsync(string token, int meterId)
    {
        return await GetAsync($"meters/{meterId}", token);
    }

    public async Task<string> CreateMeterAsync(string token, int code, string brand)
    {
        var meterData = new { code, brand };
        return await PostAsync("meters", meterData, token);
    }

    public async Task<string> UpdateMeterAsync(string token, int meterId, int code, string brand)
    {
        var updateData = new { code, brand };
        return await PutAsync($"meters/{meterId}", updateData, token);
    }

    public async Task<string> DeleteMeterAsync(string token, int meterId)
    {
        return await DeleteAsync($"meters/{meterId}", token);
    }
}
