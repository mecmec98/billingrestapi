using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

public static class UserApiClient
{
    private static readonly HttpClient client = new HttpClient();
    static UserApiClient()
    {
        // Set the base address for the HttpClient
        client.BaseAddress = new System.Uri("http://192.168.1.128:3002/");
        // Set default headers if needed
        client.DefaultRequestHeaders.Accept.Clear();
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }
    // For Login
    public static async Task<string> LoginAsync(string username, string password)
    {
        var json = $"{{\"username\":\"{username}\",\"password\":\"{password}\"}}";
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await client.PostAsync("users/login", content);
        return await response.Content.ReadAsStringAsync();
    }
    // For getting all users
    public static async Task<string> GetUsersAsync(string token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await client.GetAsync("users");
        return await response.Content.ReadAsStringAsync();
    }
    //For getting users by id
    public static async Task<string> GetUserByIdAsync(string token, int userId)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await client.GetAsync($"users/{userId}");
        return await response.Content.ReadAsStringAsync();
    }
    //For creating a new user
    public static async Task<string> CreateUserAsync(string token, string username, string password)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var json = $"{{\"username\":\"{username}\",\"password\":\"{password}\"}}";
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await client.PostAsync("users", content);
        return await response.Content.ReadAsStringAsync();
    }
    //For updating the username of a user
    public static async Task<string> UpdateUsernameAsync(string token, int userId, string username)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var json = $"{{\"username\":\"{username}\"}}";
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await client.PutAsync($"users/username/{userId}", content);
        return await response.Content.ReadAsStringAsync();
    }

    // For updating the password of a user
    public static async Task<string> UpdatePasswordAsync(string token, int userId, string password)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var json = $"{{\"password\":\"{password}\"}}";
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await client.PutAsync($"users/password/{userId}", content);
        return await response.Content.ReadAsStringAsync();
    }

    // For deleting a user
    public static async Task<string> DeleteUserAsync(string token, int userId)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await client.DeleteAsync($"users/{userId}");
        return await response.Content.ReadAsStringAsync();
    }
}

//usage example

//string loginResult = await UserApiClient.LoginAsync("admin", "admin");
// Parse token from loginResult, then:
//string users = await UserApiClient.GetUsersAsync(token);
//string createUserResult = await UserApiClient.CreateUserAsync(token, "newuser", "newpassword");
//string updateUserResult = await UserApiClient.UpdatePasswordAsync(token, userId, "updateduser", "updatedpassword");
//string updateUsernameResult = await UserApiClient.UpdateUsernameAsync(token, userId, "updatedusername");
//string deleteUserResult = await UserApiClient.DeleteUserAsync(token, userId);