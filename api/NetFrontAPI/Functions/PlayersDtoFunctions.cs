using System.Net;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using NetFrontAPI.Services;

namespace NetFrontAPI.Functions
{
    public class PlayersDtoFunctions
    {
        private readonly IPlayersService _playersService;

        public PlayersDtoFunctions(IPlayersService playersService)
        {
            _playersService = playersService;
        }

        [Function("GetPlayersDto")]
        public async Task<HttpResponseData> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "players/dto")] HttpRequestData req)
        {
            var players = await _playersService.GetAllDtoAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(players);
            return response;
        }
    }
}
