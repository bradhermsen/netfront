using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using System.Data;
using Microsoft.Data.SqlClient;
using NetFrontAPI.Repositories;
using NetFrontAPI.Services;

var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()   // ← CLEAN. NO JSON CONFIG HERE.
    .ConfigureAppConfiguration(config =>
    {
        config.AddJsonFile("local.settings.json", optional: true, reloadOnChange: true);
        config.AddEnvironmentVariables();
    })
    .ConfigureServices((context, services) =>
    {
        // Register IDbConnection for Dapper
        services.AddScoped<IDbConnection>(sp =>
        {
            var config = sp.GetRequiredService<IConfiguration>();
            var connString = config.GetValue<string>("SqlConnection");
            return new SqlConnection(connString);
        });

        // Repositories
        services.AddScoped<IOrganizationRepository, OrganizationRepository>();

        // Services
        services.AddScoped<IOrganizationService, OrganizationService>();
    })
    .Build();

host.Run();
