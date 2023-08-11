using MB1008.Models;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Diagnostics;
using System.Xml;

namespace MB1008.Controllers
{
    public class HomeController : Controller
    {
        //a
        private readonly ApplicationDbContext _dbContext;
        private readonly IHttpClientFactory _httpClientFactory;

        public HomeController(ILogger<HomeController> logger, ApplicationDbContext dbContext, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _dbContext = dbContext;
            _httpClientFactory = httpClientFactory;
        }
        //a


        private readonly ILogger<HomeController> _logger;


        public IActionResult Index()
        {


            return View();
        }

        public IActionResult Privacy()
        {
            return View();
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


        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]


        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }


    }
}