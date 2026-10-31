namespace HospitalMS.Domain.Common.ValueObjects;

public class Address : ValueObject
{
    public string Street { get; private set; }
    public string City { get; private set; }
    public string StateOrDivision { get; private set; }
    public string PostalCode { get; private set; }
    public string Country { get; private set; }

    public Address(string street, string city, string stateOrDivision, string postalCode, string country = "Bangladesh")
    {
        Street = street;
        City = city;
        StateOrDivision = stateOrDivision;
        PostalCode = postalCode;
        Country = country;
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Street.ToLowerInvariant();
        yield return City.ToLowerInvariant();
        yield return StateOrDivision.ToLowerInvariant();
        yield return PostalCode.ToLowerInvariant();
        yield return Country.ToLowerInvariant();
    }

    public override string ToString() => $"{Street}, {City}, {StateOrDivision} - {PostalCode}, {Country}";
}

