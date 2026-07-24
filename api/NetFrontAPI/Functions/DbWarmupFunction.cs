using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Data;
using System.Net;
using System.Threading.Tasks;

namespace NetFrontAPI.Functions
{
    public class DbWarmupFunction
    {
        private readonly IDbConnection _connection;

        public DbWarmupFunction(IDbConnection connection)
        {
            _connection = connection;
        }

        [Function("DbWarmup")]
        public async Task<HttpResponseData> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "dbwarmup")] HttpRequestData req)
        {
            // Open connection if closed (sync)
            if (_connection.State == ConnectionState.Closed)
                _connection.Open();

            // Execute trivial warm-up query (sync)
            using var cmd = _connection.CreateCommand();
            cmd.CommandText = "SELECT 1";
            cmd.ExecuteScalar();

            var response = req.CreateResponse(HttpStatusCode.OK);
            response.WriteString("db warm");
            return response;
        }
    }
}
