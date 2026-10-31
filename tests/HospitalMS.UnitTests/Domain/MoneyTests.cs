using HospitalMS.Domain.Common.ValueObjects;
using Xunit;

namespace HospitalMS.UnitTests.Domain;

public class MoneyTests
{
    [Fact]
    public void Money_CreatesValidInstance_WithDefaultBDTCurrency()
    {
        var money = new Money(500.50m);

        Assert.Equal(500.50m, money.Amount);
        Assert.Equal("BDT", money.Currency);
        Assert.Equal("500.50 BDT", money.ToString());
    }

    [Fact]
    public void Money_ThrowsArgumentException_WhenNegativeAmount()
    {
        Assert.Throws<ArgumentException>(() => new Money(-10m));
    }

    [Fact]
    public void Money_Add_ReturnsCombinedAmount()
    {
        var m1 = new Money(150.25m, "BDT");
        var m2 = new Money(49.75m, "BDT");

        var sum = m1.Add(m2);

        Assert.Equal(200.00m, sum.Amount);
        Assert.Equal("BDT", sum.Currency);
    }

    [Fact]
    public void Money_Subtract_ReturnsDifference()
    {
        var m1 = new Money(150.00m, "BDT");
        var m2 = new Money(50.00m, "BDT");

        var diff = m1.Subtract(m2);

        Assert.Equal(100.00m, diff.Amount);
    }

    [Fact]
    public void Money_ThrowsInvalidOperationException_WhenCurrenciesMismatch()
    {
        var m1 = new Money(100m, "BDT");
        var m2 = new Money(100m, "USD");

        Assert.Throws<InvalidOperationException>(() => m1.Add(m2));
    }

    [Fact]
    public void Money_Equality_WorksCorrectly()
    {
        var m1 = new Money(250.00m, "BDT");
        var m2 = new Money(250.00m, "BDT");
        var m3 = new Money(300.00m, "BDT");

        Assert.True(m1 == m2);
        Assert.False(m1 == m3);
        Assert.Equal(m1, m2);
    }
}

