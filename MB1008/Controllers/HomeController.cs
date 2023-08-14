using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace MB1008.Controllers
{
    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<HomeController> _logger; // Add this line

        public HomeController(ApplicationDbContext dbContext, IHttpClientFactory httpClientFactory, ILogger<HomeController> logger) // Add ILogger<HomeController> logger parameter
        {
            _dbContext = dbContext;
            _httpClientFactory = httpClientFactory;
            _logger = logger; // Assign logger
        }

        public IActionResult Index()
        {
            var exchangeRates = _dbContext.ExchangeRates.ToList();
            return View(exchangeRates);
        }

        [HttpGet]
        public IActionResult GetExchangeRateFromDatabase(DateTime selectedDate)
        {
            var exchangeRates = _dbContext.ExchangeRates
                .Where(r => r.Date.Date == selectedDate.Date)
                .ToList();

            if (exchangeRates.Any())
            {
                return Json(new { success = true, exchangeRates });
            }

            return Json(new { success = false });
        }

        [HttpPost]
        public IActionResult SaveExchangeRatesToDatabase([FromBody] List<ExchangeRate> exchangeRates, DateTime selectedDate)
        {
            try
            {
                foreach (var rate in exchangeRates)
                {
                    rate.Date = selectedDate.Date;
                    _dbContext.ExchangeRates.Add(rate);
                }

                _dbContext.SaveChanges();
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}