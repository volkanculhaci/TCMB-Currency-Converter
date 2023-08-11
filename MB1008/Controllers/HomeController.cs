using MB1008.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Xml;

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

        [HttpPost]
        public async Task<IActionResult> ConvertCurrency(string selectedCurrency, DateTime selectedDate)
        {
            var exchangeRate = _dbContext.ExchangeRates
                .FirstOrDefault(r => r.FromCurrency == selectedCurrency && r.ToCurrency == "TRY" && r.Date.Date == selectedDate.Date);

            if (exchangeRate == null)
            {
                // Handle currency not found for the selected date
                return RedirectToAction("Index"); // You can redirect to the same page or an error page
            }

            // Perform currency conversion logic if needed

            return View("Index", _dbContext.ExchangeRates.ToList()); // Return the updated view with exchange rates
        }

        [HttpGet]
        public async Task<IActionResult> UpdateExchangeRates()
        {
            var httpClient = _httpClientFactory.CreateClient();
            var html = await httpClient.GetStringAsync("https://www.tcmb.gov.tr/kurlar/today.xml");

            var doc = new XmlDocument();
            doc.LoadXml(html);

            var currencyNodes = doc.SelectNodes("//tr");
            foreach (XmlNode currencyNode in currencyNodes)
            {
                var fromCurrency = currencyNode.SelectSingleNode("td[@class='para kurkodu']").InnerText.Trim();
                var toCurrency = currencyNode.SelectSingleNode("td[@class='para birim']").InnerText.Trim();
                var buyRate = decimal.Parse(currencyNode.SelectSingleNode("td[@class='deger']").InnerText.Trim());

                var exchangeRate = new ExchangeRate
                {
                    FromCurrency = fromCurrency,
                    ToCurrency = toCurrency,
                    BuyRate = buyRate,
                    Date = DateTime.UtcNow
                };

                _dbContext.ExchangeRates.Add(exchangeRate);
            }

            await _dbContext.SaveChangesAsync();

            return RedirectToAction("Index"); // Redirect to your desired page
        }

        public IActionResult TCMB_DATA()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        // last added
        [HttpPost]
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

