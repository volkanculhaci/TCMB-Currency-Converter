using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace MB1008.Controllers
{
    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IHttpClientFactory _httpClientFactory;

        public HomeController(ApplicationDbContext dbContext, IHttpClientFactory httpClientFactory)
        {
            _dbContext = dbContext;
            _httpClientFactory = httpClientFactory;
        }

        public IActionResult Index()
        {
            var exchangeRates = _dbContext.ExchangeRates.ToList();
            return View(exchangeRates);
        }



        public IActionResult TCMB_DATA()
        {
            return View();
        }

        // last added
        public async Task<IActionResult> ExchangeRates()
        {
            var httpClient = _httpClientFactory.CreateClient();
            var response = await httpClient.GetAsync("api/ExchangeRates");

            if (response.IsSuccessStatusCode)
            {
                var xmlContent = await response.Content.ReadAsStringAsync();
                return View("ExchangeRates", xmlContent);
            }
            else
            {
                // Handle error
                return View("Error");
            }
        }




        public IActionResult Privacy()
        {
            return View();
        }

        // ok
        [HttpGet]
        public IActionResult GetExchangeRate(string fromCurrency, string toCurrency, DateTime selectedDate)
        {
            var exchangeRate = _dbContext.ExchangeRates
                .FirstOrDefault(r =>
                    r.FromCurrency == fromCurrency &&
                    r.ToCurrency == toCurrency &&
                    r.Date.Date == selectedDate.Date);

            if (exchangeRate != null)
            {
                return Json(new { success = true, rate = exchangeRate.BuyRate });
            }

            return Json(new { success = false });
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}

