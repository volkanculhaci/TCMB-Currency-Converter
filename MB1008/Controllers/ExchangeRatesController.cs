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

            string url = $"https://evds2.tcmb.gov.tr/service/evds/series=TP_DK_RUB_A-TP.DK.USD.A.YTL-TP.DK.EUR.A.YTL-TP.DK.CHF.A.YTL-TP.DK.GBP.A.YTL-TP.DK.JPY.A.YTL-TP.DK.AUD.A-TP.DK.DKK.A-TP.DK.KWD.A-TP.DK.NOK.A&startDate={formattedDate}&endDate={formattedDate}&type=xml&key=jettt0PrGN";
            //string url = $"https://evds2.tcmb.gov.tr/service/evds/series=TP.DK.USD.S.YTL-TP.DK.EUR.S.YTL-TP.DK.CHF.S.YTL-TP.DK.GBP.S.YTL-TP.DK.JPY.S.YTL&startDate=10-08-2023&endDate=10-08-2023&type=xml&key=XXXXXXX";

            HttpResponseMessage response = await _httpClient.GetAsync(url);

            if (response.IsSuccessStatusCode)
            {
                string xmlString = await response.Content.ReadAsStringAsync();
                XDocument doc = XDocument.Parse(xmlString);

                var exchangeRates = doc.Descendants("items").Select(item => new
                {
                    date = item.Element("Tarih").Value,
                    eur = string.IsNullOrEmpty(item.Element("TP_DK_EUR_A_YTL").Value) ? "0" : item.Element("TP_DK_EUR_A_YTL").Value,
                    usd = string.IsNullOrEmpty(item.Element("TP_DK_USD_A_YTL").Value) ? "0" : item.Element("TP_DK_USD_A_YTL").Value,
                    chf = string.IsNullOrEmpty(item.Element("TP_DK_CHF_A_YTL").Value) ? "0" : item.Element("TP_DK_CHF_A_YTL").Value,
                    gbp = string.IsNullOrEmpty(item.Element("TP_DK_GBP_A_YTL").Value) ? "0" : item.Element("TP_DK_GBP_A_YTL").Value,
                    jpy = string.IsNullOrEmpty(item.Element
("TP_DK_JPY_A_YTL").Value) ? "0" : item.Element("TP_DK_JPY_A_YTL").Value,
                    rub = string.IsNullOrEmpty(item.Element("TP_DK_RUB_A").Value) ? "0" : item.Element("TP_DK_RUB_A").Value,
                    aud = string.IsNullOrEmpty(item.Element("TP_DK_AUD_A").Value) ? "0" : item.Element("TP_DK_AUD_A").Value,
                    dkk = string.IsNullOrEmpty(item.Element("TP_DK_DKK_A").Value) ? "0" : item.Element("TP_DK_DKK_A").Value,
                    kwd = string.IsNullOrEmpty(item.Element("TP_DK_KWD_A").Value) ? "0" : item.Element("TP_DK_KWD_A").Value,
                    nok = string.IsNullOrEmpty(item.Element("TP_DK_NOK_A").Value) ? "0" : item.Element("TP_DK_NOK_A").Value,
                });

                XElement root = new XElement("ExchangeRates",
                    from ex in exchangeRates
                    select new XElement("items",
                        new XElement("date", ex.date),
                        new XElement("usd", ex.usd),
                        new XElement("eur", ex.eur),
                        new XElement("che", ex.chf),
                        new XElement("gbp", ex.gbp),
                        new XElement("jpy", ex.jpy),
                        new XElement("rub", ex.rub),
                        new XElement("aud", ex.aud),
                        new XElement("dkk", ex.dkk),
                        new XElement("kwd", ex.kwd),
                        new XElement("nok", ex.nok))
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
