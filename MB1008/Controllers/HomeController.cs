using MB1008.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging; // Add this namespace
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Xml.Linq;

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

        [HttpPost]
        public IActionResult FetchAndSaveExchangeRates(DateTime selectedDate)
        {
            try
            {
                _logger.LogInformation("FetchAndSaveExchangeRates started...");

                string formattedDate = selectedDate.ToString("dd-MM-yyyy");
                _logger.LogInformation($"Formatted Date: {formattedDate}");

                var httpClient = _httpClientFactory.CreateClient();
                string url = $"https://evds2.tcmb.gov.tr/service/evds/series=TP.DK.USD.S.YTL-TP.DK.EUR.S.YTL-TP.DK.CHF.S.YTL-TP.DK.GBP.S.YTL-TP.DK.JPY.S.YTL&startDate=10-08-2023&endDate=10-08-2023&type=xml&key=jettt0PrGN";
                _logger.LogInformation($"URL: {url}");

                HttpResponseMessage response = httpClient.GetAsync(url).GetAwaiter().GetResult();
                _logger.LogInformation($"Response Status Code: {(int)response.StatusCode}");

                // Rest of the code...

                if (response.IsSuccessStatusCode)
                {
                    // ...

                    _logger.LogInformation("Exchange rates fetched and saved successfully.");
                    return Json(new { success = true, message = "Exchange rates fetched and saved successfully." });
                }
                else
                {
                    _logger.LogError($"Error fetching exchange rates: {response.ReasonPhrase}");
                    return Json(new { success = false, message = response.ReasonPhrase });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error: {ex.Message}");
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
