using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using PIM_III_Backend.Application.Services;

namespace PIM_III_Backend.Infrastructure.Files;

public class LocalAvatarStorage(IWebHostEnvironment environment, IConfiguration configuration) : IAvatarStorage
{
    public async Task<string> SaveAsync(int userId, string extension, Stream content)
    {
        var uploadsPath = configuration["Storage:UploadsPath"] ?? "wwwroot/uploads";
        var root = Path.IsPathRooted(uploadsPath)
            ? uploadsPath
            : Path.Combine(environment.ContentRootPath, uploadsPath);
        var avatarsDirectory = Path.Combine(root, "avatars");
        Directory.CreateDirectory(avatarsDirectory);
        var fileName = $"avatar_{userId}_{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(avatarsDirectory, fileName);
        await using var stream = new FileStream(filePath, FileMode.CreateNew);
        await content.CopyToAsync(stream);
        return $"/uploads/avatars/{fileName}";
    }

    public Task DeleteAsync(string? publicUrl)
    {
        if (!string.IsNullOrWhiteSpace(publicUrl))
        {
            var fileName = Path.GetFileName(publicUrl.Replace('\\', '/'));
            if (!string.IsNullOrEmpty(fileName) && fileName.StartsWith("avatar_"))
            {
                var uploadsPath = configuration["Storage:UploadsPath"] ?? "wwwroot/uploads";
                var root = Path.IsPathRooted(uploadsPath)
                    ? uploadsPath
                    : Path.Combine(environment.ContentRootPath, uploadsPath);
                var filePath = Path.Combine(root, "avatars", fileName);
                if (File.Exists(filePath))
                    File.Delete(filePath);
            }
        }
        return Task.CompletedTask;
    }
}
