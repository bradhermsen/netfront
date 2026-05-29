using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Dapper;
using System.Data;

namespace NetFrontAPI.Functions
{
    public class GameTypesFunctions
    {
        private readonly IDbConnection _db;

        public GameTypesFunctions(IDbConnection db)
        {
            _db = db;
        }

        [Function("GetGameTypes")]
        public async Task<HttpResponseData> GetGameTypes(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "gametypes")] HttpRequestData req)
        {
            var sql = @"SELECT GameTypeId, Name FROM GameTypes ORDER BY GameTypeId;";
            var result = await _db.QueryAsync(sql);

            var response = req.CreateResponse();
            await response.WriteAsJsonAsync(result);
            return response;
        }
    }
}
