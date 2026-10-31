using HospitalMS.Domain.Common;
using HospitalMS.Domain.Common.ValueObjects;
using Xunit;

namespace HospitalMS.UnitTests.Domain;

public class ResultTests
{
    [Fact]
    public void Result_Success_SetsIsSuccessTrue()
    {
        var result = Result.Success();

        Assert.True(result.IsSuccess);
        Assert.False(result.IsFailure);
        Assert.Null(result.ErrorMessage);
    }

    [Fact]
    public void Result_Failure_SetsIsFailureTrueAndCapturesError()
    {
        var result = Result.Failure("User not found", "NOT_FOUND");

        Assert.False(result.IsSuccess);
        Assert.True(result.IsFailure);
        Assert.Equal("User not found", result.ErrorMessage);
        Assert.Equal("NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public void GenericResult_Success_ReturnsValue()
    {
        var result = Result<string>.Success("Valid Token");

        Assert.True(result.IsSuccess);
        Assert.Equal("Valid Token", result.Value);
    }

    [Fact]
    public void GenericResult_Failure_ThrowsWhenAccessingValue()
    {
        var result = Result<string>.Failure("Error");

        Assert.True(result.IsFailure);
        Assert.Throws<InvalidOperationException>(() => result.Value);
    }
}

public class AddressTests
{
    [Fact]
    public void Address_Equality_IgnoresCase()
    {
        var a1 = new Address("Road 7", "Dhaka", "Dhaka Division", "1205", "Bangladesh");
        var a2 = new Address("road 7", "dhaka", "dhaka division", "1205", "bangladesh");

        Assert.Equal(a1, a2);
        Assert.True(a1 == a2);
    }
}

