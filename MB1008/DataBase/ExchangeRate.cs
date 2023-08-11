namespace MB1008.DataBase
{
    public class ExchangeRate
    {
        public int Id { get; set; }
        public string FromCurrency { get; set; }
        public string ToCurrency { get; set; }
        public decimal BuyRate { get; set; }
        public DateTime Date { get; set; }
    }
}
