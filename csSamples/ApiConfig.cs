using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public abstract class ApiConfig : IDisposable
{
    protected readonly HttpClient _httpClient;
    private bool _disposed = false;

    protected ApiConfig(HttpClient httpClient = null)
    {
        _httpClient = httpClient ?? new HttpClient();
        ConfigureHttpClient();
    }

    private void ConfigureHttpClient()
    {
        if (_httpClient.BaseAddress == null)
        {
            _httpClient.BaseAddress = new Uri("http://192.168.1.128:3002/");
        }
        
        _httpClient.DefaultRequestHeaders.Accept.Clear();
        _httpClient.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json"));
    }

    protected void SetAuthorizationHeader(string token)
    {
        if (!string.IsNullOrEmpty(token))
        {
            _httpClient.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", token);
        }
    }

    protected void ClearAuthorizationHeader()
    {
        _httpClient.DefaultRequestHeaders.Authorization = null;
    }

    protected StringContent CreateJsonContent(object data)
    {
        var json = JsonSerializer.Serialize(data);
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    protected StringContent CreateJsonContent(string json)
    {
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    protected async Task<T> SendAsync<T>(HttpRequestMessage request)
    {
        try
        {
            var response = await _httpClient.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();
            
            if (response.IsSuccessStatusCode)
            {
                if (typeof(T) == typeof(string))
                {
                    return (T)(object)content;
                }
                return JsonSerializer.Deserialize<T>(content);
            }
            else
            {
                throw new HttpRequestException($"API call failed with status {response.StatusCode}: {content}");
            }
        }
        catch (Exception ex)
        {
            throw new ApiException($"API request failed: {ex.Message}", ex);
        }
    }

    protected async Task<string> SendAsync(HttpRequestMessage request)
    {
        return await SendAsync<string>(request);
    }

    // GET request helper
    protected async Task<T> GetAsync<T>(string endpoint, string token = null)
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthorizationHeader(token);

        var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
        return await SendAsync<T>(request);
    }

    protected async Task<string> GetAsync(string endpoint, string token = null)
    {
        return await GetAsync<string>(endpoint, token);
    }

    // POST request helper
    protected async Task<T> PostAsync<T>(string endpoint, object data, string token = null)
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthorizationHeader(token);

        var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = CreateJsonContent(data)
        };
        return await SendAsync<T>(request);
    }

    protected async Task<string> PostAsync(string endpoint, object data, string token = null)
    {
        return await PostAsync<string>(endpoint, data, token);
    }

    protected async Task<string> PostAsync(string endpoint, string json, string token = null)
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthorizationHeader(token);

        var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = CreateJsonContent(json)
        };
        return await SendAsync<string>(request);
    }

    // PUT request helper
    protected async Task<T> PutAsync<T>(string endpoint, object data, string token = null)
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthorizationHeader(token);

        var request = new HttpRequestMessage(HttpMethod.Put, endpoint)
        {
            Content = CreateJsonContent(data)
        };
        return await SendAsync<T>(request);
    }

    protected async Task<string> PutAsync(string endpoint, object data, string token = null)
    {
        return await PutAsync<string>(endpoint, data, token);
    }

    protected async Task<string> PutAsync(string endpoint, string json, string token = null)
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthorizationHeader(token);

        var request = new HttpRequestMessage(HttpMethod.Put, endpoint)
        {
            Content = CreateJsonContent(json)
        };
        return await SendAsync<string>(request);
    }

    // DELETE request helper
    protected async Task<T> DeleteAsync<T>(string endpoint, string token = null)
    {
        if (!string.IsNullOrEmpty(token))
            SetAuthorizationHeader(token);

        var request = new HttpRequestMessage(HttpMethod.Delete, endpoint);
        return await SendAsync<T>(request);
    }

    protected async Task<string> DeleteAsync(string endpoint, string token = null)
    {
        return await DeleteAsync<string>(endpoint, token);
    }

    // Dispose pattern
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed && disposing)
        {
            _httpClient?.Dispose();
            _disposed = true;
        }
    }
}

// Custom exception for API errors
public class ApiException : Exception
{
    public ApiException(string message) : base(message) { }
    public ApiException(string message, Exception innerException) : base(message, innerException) { }
}