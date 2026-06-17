using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using BCrypt.Net;

namespace NetFrontAPI.Functions
{
    public class TempFixInsertHash
    {
        private readonly IConfiguration _config;

        public TempFixInsertHash(IConfiguration config)
        {
            _config = config;
        }

        [Function("TempFixInsertHash")]
        public async Task<HttpResponseData> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequestData req)
        {
            var connString = _config.GetConnectionString("DefaultConnection");

            // Generate the hash IN CODE — no copy/paste, no corruption
            var hash = BCrypt.Net.BCrypt.HashPassword("NetFront2024!", 10);

            using var conn = new SqlConnection(connString);
            await conn.OpenAsync();

            var cmd = new SqlCommand(
                "UPDATE AuthUsers SET PasswordHash = @hash WHERE Email = @email",
                conn);

            cmd.Parameters.AddWithValue("@hash", hash);
            cmd.Parameters.AddWithValue("@email", "hermiehockey@outlook.com");

            await cmd.ExecuteNonQueryAsync();

            var res = req.CreateResponse();
            await res.WriteStringAsync($"Hash updated. Hash length: {hash.Length}");
            return res;
        }
    }
}
