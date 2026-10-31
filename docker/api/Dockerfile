FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files for optimal layer caching
COPY HospitalMS.slnx ./
COPY src/HospitalMS.Domain/HospitalMS.Domain.csproj src/HospitalMS.Domain/
COPY src/HospitalMS.Application/HospitalMS.Application.csproj src/HospitalMS.Application/
COPY src/HospitalMS.Infrastructure/HospitalMS.Infrastructure.csproj src/HospitalMS.Infrastructure/
COPY src/HospitalMS.API/HospitalMS.API.csproj src/HospitalMS.API/

# Restore dependencies
RUN dotnet restore src/HospitalMS.API/HospitalMS.API.csproj

# Copy all source files
COPY src/ src/

# Build and publish
WORKDIR /src/src/HospitalMS.API
RUN dotnet publish -c Release -o /app/publish -p:PublishSingleFile=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "HospitalMS.API.dll"]
