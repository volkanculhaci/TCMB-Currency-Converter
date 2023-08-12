using Microsoft.AspNetCore.Mvc;
using System.Xml.Linq;

namespace MB1008.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExchangeRatesController : ControllerBase
    {
        // API'den döviz kuru verilerini çekmek için HttpClient kullanıyoruz
        private readonly HttpClient _httpClient;

        public ExchangeRatesController(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }
        //Döviz kurlarını tcmb sitesinden çektiğim  method
        [HttpGet]
        public async Task<IActionResult> GetExchangeRates()
        {
            var endDate = DateTime.Now.Date.ToString("dd-MM-yyyy");
            var startDate = DateTime.Now.Date.AddDays(-30).ToString("dd-MM-yyyy");
            string url = $"https://evds2.tcmb.gov.tr/service/evds/series=TP.DK.USD.S.YTL-TP.DK.EUR.S.YTL-TP.DK.CHF.S.YTL-TP.DK.GBP.S.YTL-TP.DK.JPY.S.YTL&startDate={startDate}&endDate={endDate}&type=xml&key=jettt0PrGN";
            HttpResponseMessage response = await _httpClient.GetAsync(url);
            if (response.IsSuccessStatusCode)
            {
                //aldığımız veriyi stringe çevirir
                string xmlString = await response.Content.ReadAsStringAsync();
                //stringe dönüştürdüğümüz veriyi xml formatına çeviriyoruz
                XDocument doc = XDocument.Parse(xmlString);
                //çektiğimiz api dökümünanının sarmaladığı items etiketi altındaki verilere erişip onlarda boş değerler varsa sıfır atıyoruz
                var exchangeRates = doc.Descendants("items").Select(item => new
                {
                    date = item.Element("Tarih").Value,
                    usd = string.IsNullOrEmpty(item.Element("TP_DK_USD_S_YTL").Value) ? "0" : item.Element("TP_DK_USD_S_YTL").Value,
                    eur = string.IsNullOrEmpty(item.Element("TP_DK_EUR_S_YTL").Value) ? "0" : item.Element("TP_DK_EUR_S_YTL").Value,
                    chf = string.IsNullOrEmpty(item.Element("TP_DK_CHF_S_YTL").Value) ? "0" : item.Element("TP_DK_CHF_S_YTL").Value,
                    gbp = string.IsNullOrEmpty(item.Element("TP_DK_CHF_S_YTL").Value) ? "0" : item.Element("TP_DK_GBP_S_YTL").Value,
                    jpy = string.IsNullOrEmpty(item.Element("TP_DK_CHF_S_YTL").Value) ? "0" : item.Element("TP_DK_JPY_S_YTL").Value,
                });
                //verilerin etiket isimlerini değiştiriyoruz yani örneğin TP_DK_USD_A değilde usd olarak 
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
                //xml formatında gönderiyoruz
                return Content(root.ToString(), "application/xml");
            }
            else
            {
                return StatusCode((int)response.StatusCode, response.ReasonPhrase);
            }
        }
    }
}
