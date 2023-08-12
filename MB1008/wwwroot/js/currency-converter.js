function getExchangeRate(fromCurrency, toCurrency, selectedDate) {
    return fetch(
        `/Home/GetExchangeRate?fromCurrency=${fromCurrency}&toCurrency=${toCurrency}&selectedDate=${selectedDate.toISOString()}`
    ).then((response) => {
        console.log("Response status:", response.status);
        return response.json();
    });
}

function calculateConvertedAmount(amount, rate) {
    console.log("Calculating converted amount...");
    return (amount * rate).toFixed(6);
}

function displayConvertedAmount(convertedAmount) {
    console.log("Displaying converted amount:", convertedAmount);
    document.getElementById("converted-amount").value = convertedAmount;
}

function displayErrorMessage(message) {
    console.log("Displaying error message:", message);
    document.getElementById("converted-amount").value = message;
}

function updateConvertedAmount() {
    console.log("Updating converted amount...");
    var fromCurrency = document.getElementById("selectedCurrency").value;
    var amount = parseFloat(document.getElementById("amount").value);
    var toCurrency = document.getElementById("toCurrency").value;
    var selectedDate = new Date(document.getElementById("selectedDate").value);

    console.log("Selected currency:", fromCurrency);
    console.log("Amount:", amount);
    console.log("Target currency:", toCurrency);
    console.log("Selected date:", selectedDate);

    getExchangeRate(fromCurrency, toCurrency, selectedDate)
        .then((data) => {
            if (data.success) {
                console.log("Exchange rate data:", data);
                var rate = data.rate;
                var convertedAmount = calculateConvertedAmount(amount, rate);
                displayConvertedAmount(convertedAmount);
            } else {
                console.log("No exchange rate data available.");
                displayErrorMessage(
                    "No data available for the selected criteria."
                );
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            displayErrorMessage("An error occurred.");
        });
}
