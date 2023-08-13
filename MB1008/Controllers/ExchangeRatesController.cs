using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Net.Http;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace MB1008.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExchangeRatesController : ControllerBase
    {
        private readonly HttpClient _httpClient;

        public ExchangeRatesController(IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClientFactory.CreateClient();
        }

        [HttpGet]
        public async Task<IActionResult> GetExchangeRates(DateTime selectedDate)
        {
            Debug.WriteLine($"selected date: {selectedDate}");
            string formattedDate = selectedDate.ToString("dd-MM-yyyy");
            Debug.WriteLine($"Formatted Date: {formattedDate}");

            //string url = $"https://evds2.tcmb.gov.tr/service/evds/series=TP.DK.USD.S.YTL-TP.DK.EUR.S.YTL-TP.DK.CHF.S.YTL-TP.DK.GBP.S.YTL-TP.DK.JPY.S.YTL&startDate={formattedDate}&endDate={formattedDate}&type=xml&key=jettt0PrGN";
            string url = $"https://evds2.tcmb.gov.tr/service/evds/series=TP.DK.USD.S.YTL-TP.DK.EUR.S.YTL-TP.DK.CHF.S.YTL-TP.DK.GBP.S.YTL-TP.DK.JPY.S.YTL&startDate=10-08-2023&endDate=10-08-2023&type=xml&key=jettt0PrGN";

            HttpResponseMessage response = await _httpClient.GetAsync(url);

            if (response.IsSuccessStatusCode)
            {
                string xmlString = await response.Content.ReadAsStringAsync();
                XDocument doc = XDocument.Parse(xmlString);

                var exchangeRates = doc.Descendants("items").Select(item => new
                {
                    date = item.Element("Tarih").Value,
                    usd = string.IsNullOrEmpty(item.Element("TP_DK_USD_S_YTL").Value) ? "0" : item.Element("TP_DK_USD_S_YTL").Value,
                    eur = string.IsNullOrEmpty(item.Element("TP_DK_EUR_S_YTL").Value) ? "0" : item.Element("TP_DK_EUR_S_YTL").Value,
                    chf = string.IsNullOrEmpty(item.Element("TP_DK_CHF_S_YTL").Value) ? "0" : item.Element("TP_DK_CHF_S_YTL").Value,
                    gbp = string.IsNullOrEmpty(item.Element("TP_DK_CHF_S_YTL").Value) ? "0" : item.Element("TP_DK_GBP_S_YTL").Value,
                    jpy = string.IsNullOrEmpty(item.Element("TP_DK_CHF_S_YTL").Value) ? "0" : item.Element("TP_DK_JPY_S_YTL").Value,
                });

                XElement root = new XElement("ExchangeRates",
                    from ex in exchangeRates
                    select new XElement("items",
                        new XElement("date", ex.date),
                        new XElement("usd", ex.usd),
                        new XElement("eur", ex.eur),
                        new XElement("che", ex.chf),
                        new XElement("gbp", ex.gbp),
                        new XElement("jpy", ex.jpy)
                    )
                );

                return Content(root.ToString(), "application/xml");
            }
            else
            {
                return StatusCode((int)response.StatusCode, response.ReasonPhrase);
            }
        }
    }
}
