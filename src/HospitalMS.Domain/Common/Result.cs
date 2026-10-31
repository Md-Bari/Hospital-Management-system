namespace HospitalMS.Domain.Common;

public class Result
{
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public string? ErrorMessage { get; }
    public string? ErrorCode { get; }

    protected Result(bool isSuccess, string? errorMessage = null, string? errorCode = null)
    {
        IsSuccess = isSuccess;
        ErrorMessage = errorMessage;
        ErrorCode = errorCode;
    }

    public static Result Success() => new(true);
    public static Result Failure(string errorMessage, string? errorCode = null) => new(false, errorMessage, errorCode);
}

public class Result<T> : Result
{
    private readonly T? _value;

    public T Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException("Cannot access the value of a failure result.");

    protected internal Result(T? value, bool isSuccess, string? errorMessage = null, string? errorCode = null)
        : base(isSuccess, errorMessage, errorCode)
    {
        _value = value;
    }

    public static Result<T> Success(T value) => new(value, true);
    public new static Result<T> Failure(string errorMessage, string? errorCode = null) => new(default, false, errorMessage, errorCode);

    public static implicit operator Result<T>(T value) => Success(value);
}

