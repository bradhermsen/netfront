using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Text.Json;
using NetFrontAPI.Repositories;
using NetFrontAPI.Services;


using NetFrontAPI.Repositories;
using NetFrontAPI.Services;
using NetFrontAPI.Infrastructure.Database;

var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults(worker =>
    {
        worker.Services.Configure<JsonSerializerOptions>(options =>
        {
            options.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
            options.PropertyNameCaseInsensitive = true;
        });
    })
    .ConfigureAppConfiguration((context, config) =>
    {
        config.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);
        config.AddJsonFile("local.settings.json", optional: true, reloadOnChange: true);
        config.AddEnvironmentVariables();
    })
    .ConfigureServices((context, services) =>
    {
        // 🔥 Load configuration (needed for JWT)
        services.AddSingleton<IConfiguration>(context.Configuration);

        // 🔥 Register SQL connection factory (required for AuthLogin)
        services.AddSingleton<ISqlConnectionFactory, SqlConnectionFactory>();

        // Existing DB connection (your repos use this)
        var connectionString = context.Configuration.GetConnectionString("DefaultConnection");
        services.AddScoped<IDbConnection>(sp => new SqlConnection(connectionString));

        // Repositories
        services.AddScoped<IOrganizationRepository, OrganizationRepository>();
        services.AddScoped<ILeagueRepository, LeagueRepository>();
        services.AddScoped<ITeamsRepository, TeamsRepository>();
        services.AddScoped<ILevelsRepository, LevelsRepository>();
        services.AddScoped<ISeasonsRepository, SeasonsRepository>();
        services.AddScoped<IPlayersRepository, PlayersRepository>();
        services.AddScoped<IRosterEntriesRepository, RosterEntriesRepository>();
        services.AddScoped<IGameRepository, GameRepository>();
        services.AddScoped<IUsersRepository, UsersRepository>();
       

        // Services
        services.AddScoped<IOrganizationService, OrganizationService>();
        services.AddScoped<ILeagueService, LeagueService>();
        services.AddScoped<ITeamsService, TeamsService>();
        services.AddScoped<ILevelsService, LevelsService>();
        services.AddScoped<ISeasonsService, SeasonsService>();
        services.AddScoped<IPlayersService, PlayersService>();
        services.AddScoped<IRosterEntriesService, RosterEntriesService>();
        services.AddScoped<IGameService, GameService>();
        services.AddScoped<IUsersService, UsersService>();
    })
    .Build();

host.Run();
