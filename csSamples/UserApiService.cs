using System.Net.Http;
using System.Threading.Tasks;

public interface IUserApiService
{
    Task<string> LoginAsync(string username, string password);
    Task<string> GetUsersAsync(string token);
    Task<string> GetUserByIdAsync(string token, int userId);
    Task<string> CreateUserAsync(string token, string username, string password);
    Task<string> UpdateUsernameAsync(string token, int userId, string username);
    Task<string> UpdatePasswordAsync(string token, int userId, string password);
    Task<string> DeleteUserAsync(string token, int userId);
}

public class UserApiService : ApiConfig, IUserApiService
{
    public UserApiService(HttpClient httpClient = null) : base(httpClient) { }

    public async Task<string> LoginAsync(string username, string password)
    {
        var loginData = new { username, password };
        return await PostAsync("users/login", loginData);
    }

    public async Task<string> GetUsersAsync(string token)
    {
        return await GetAsync("users", token);
    }

    public async Task<string> GetUserByIdAsync(string token, int userId)
    {
        return await GetAsync($"users/{userId}", token);
    }

    public async Task<string> CreateUserAsync(string token, string username, string password)
    {
        var userData = new { username, password };
        return await PostAsync("users", userData, token);
    }

    public async Task<string> UpdateUsernameAsync(string token, int userId, string username)
    {
        var updateData = new { username };
        return await PutAsync($"users/username/{userId}", updateData, token);
    }

    public async Task<string> UpdatePasswordAsync(string token, int userId, string password)
    {
        var updateData = new { password };
        return await PutAsync($"users/password/{userId}", updateData, token);
    }

    public async Task<string> DeleteUserAsync(string token, int userId)
    {
        return await DeleteAsync($"users/{userId}", token);
    }
}

/**
// Create the service instance
using var userService = new UserApiService();

string loginResult = await userService.LoginAsync("admin", "admin");
// Parse token from loginResult, then:
string users = await userService.GetUsersAsync(token);
string createUserResult = await userService.CreateUserAsync(token, "newuser", "newpassword");
string updatePasswordResult = await userService.UpdatePasswordAsync(token, userId, "newpassword");
string updateUsernameResult = await userService.UpdateUsernameAsync(token, userId, "newusername");
string deleteUserResult = await userService.DeleteUserAsync(token, userId);
**/