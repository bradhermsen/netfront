using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Extensions.Timer;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Threading.Tasks;

namespace NetFrontAPI.Functions
{
    public class DBWarmupTimer
    {
        private readonly HttpClient _http;

        public DBWarmupTimer(HttpClient http)
        {
            _http = http;
        }

        [Function("DBWarmupTimer")]
        public async Task Run([TimerTrigger("0 */15 * * * *")] TimerInfo timer, FunctionContext context)
        {
            var logger = context.GetLogger("DBWarmupTimer");

            var response = await _http.GetAsync("https://api-dev.netfrontscoring.com/api/dbwarmup");
            logger.LogInformation($"Warmup executed: {response.StatusCode}");
        }
    }
}
