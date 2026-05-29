using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Dapper;
using System.Data;

namespace NetFrontAPI.Functions
{
    public class GameRoundsFunctions
    {
        private readonly IDbConnection _db;

        public GameRoundsFunctions(IDbConnection db)
        {
            _db = db;
        }

        [Function("GetGameRounds")]
        public async Task<HttpResponseData> GetGameRounds(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "gamerounds")] HttpRequestData req)
        {
            var sql = @"
                SELECT 
                    GameRoundId,
                    GameTypeId,
                    RoundName,
                    SortOrder
                FROM GameRounds
                ORDER BY GameTypeId, SortOrder;
            ";

            var result = await _db.QueryAsync(sql);

            var response = req.CreateResponse();
            await response.WriteAsJsonAsync(result);
            return response;
        }
    }
}
