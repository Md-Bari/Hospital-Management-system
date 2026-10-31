namespace HospitalMS.Domain.Common.ValueObjects;

public class Money : ValueObject
{
    public decimal Amount { get; private set; }
    public string Currency { get; private set; }

    public Money(decimal amount, string currency = "BDT")
    {
        if (amount < 0)
            throw new ArgumentException("Amount cannot be negative.", nameof(amount));

        Amount = decimal.Round(amount, 2, MidpointRounding.AwayFromZero);
        Currency = string.IsNullOrWhiteSpace(currency) ? "BDT" : currency.ToUpperInvariant();
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }

    public static Money Zero(string currency = "BDT") => new(0m, currency);

    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException($"Cannot add amounts with different currencies: {Currency} and {other.Currency}.");
        return new Money(Amount + other.Amount, Currency);
    }

    public Money Subtract(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException($"Cannot subtract amounts with different currencies: {Currency} and {other.Currency}.");
        if (Amount < other.Amount)
            throw new InvalidOperationException("Resulting amount cannot be negative.");
        return new Money(Amount - other.Amount, Currency);
    }

    public override string ToString() => $"{Amount:N2} {Currency}";
}

