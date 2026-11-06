using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using ConektaFinance.Api.Application.Services;

namespace ConektaFinance.Api.Infrastructure.Files;

public class LocalCopilotImageStorage(IWebHostEnvironment environment, IConfiguration configuration) : ICopilotImageStorage
{
    public async Task<string> SaveAsync(int userId, string extension, Stream content)
    {
        var uploadsPath = configuration["Storage:UploadsPath"] ?? "wwwroot/uploads";
        var root = Path.IsPathRooted(uploadsPath)
            ? uploadsPath
            : Path.Combine(environment.ContentRootPath, uploadsPath);
        var directory = Path.Combine(root, "copilot");
        Directory.CreateDirectory(directory);
        var fileName = $"receipt_{userId}_{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(directory, fileName);
        await using var stream = new FileStream(filePath, FileMode.CreateNew);
        await content.CopyToAsync(stream);
        return $"/uploads/copilot/{fileName}";
    }
}
