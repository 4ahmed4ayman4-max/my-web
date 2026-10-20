namespace Business.Exceptions;

public class BadRequestException : Exception
{
    public BadRequestException(string message) : base(message) { }

    public BadRequestException(string message, IEnumerable<string> errors)
        : base(message)
    {
        Errors = errors.ToList();
    }

    public List<string> Errors { get; } = new();
}