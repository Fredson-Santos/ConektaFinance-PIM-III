namespace PIM_III_Backend.Application.Exceptions;

public class AppException(int statusCode, string title, string detail, IDictionary<string, string[]>? errors = null)
    : Exception(title)
{
    public int StatusCode { get; } = statusCode;
    public string Title { get; } = title;
    public string Detail { get; } = detail;
    public IDictionary<string, string[]>? Errors { get; } = errors;

    public static AppException BadRequest(string title, string detail, IDictionary<string, string[]>? errors = null) =>
        new(400, title, detail, errors);

    public static AppException Unauthorized(string title, string detail) => new(401, title, detail);
    public static AppException Forbidden(string title, string detail) => new(403, title, detail);
    public static AppException NotFound(string title, string detail) => new(404, title, detail);
    public static AppException Conflict(string title, string detail) => new(409, title, detail);
    public static AppException TooManyRequests(string title, string detail) => new(429, title, detail);
}
