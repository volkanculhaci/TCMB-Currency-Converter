async function getExchangeRateFromDatabase(selectedDate) {
    const apiUrl = `/Home/GetExchangeRateFromDatabase?selectedDate=${selectedDate.toISOString()}`;

    try {
        const response = await fetch(apiUrl);
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                console.log("VERITABANINDAN VERI CEKILDI");
                return data.exchangeRates;
            }
        }
    } catch (error) {
        console.error("Error fetching data from the database:", error);
    }

    return null;
}

async function saveExchangeRatesToDatabase(exchangeRates, selectedDate) {
    const apiUrl = `/Home/SaveExchangeRatesToDatabase?selectedDate=${selectedDate.toISOString()}`;

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(exchangeRates),
        });

        if (response.ok) {
            const data = await response.json();
            return data.success;
        } else {
            console.error("Error saving exchange rates:", response.statusText);
        }
    } catch (error) {
        console.error("Error saving exchange rates:", error);
    }

    return false;
}

async function getExchangeRateFromTCMB(fromCurrency, toCurrency, selectedDate) {
    const apiUrl = `api/ExchangeRates?selectedDate=${selectedDate.toISOString()}`;
    //const apiUrl = `/ExchangeRates/GetExchangeRate?fromCurrency=${fromCurrency}&toCurrency=${toCurrency}&selectedDate=${selectedDate.toISOString()}`;
    console.log(apiUrl);

    try {
        const response = await fetch(apiUrl);
        if (response.ok) {
            console.log("response okey");

            const xmlString = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");

            console.log("xml Dokumanina bakiyoruz", xmlDoc);
            const exchangeRates = {};

            const rateElements = xmlDoc.querySelectorAll("items > *");
            rateElements.forEach((rateElement) => {
                const currency = rateElement.tagName;
                const rate = parseFloat(rateElement.textContent);
                exchangeRates[currency] = rate;
                exchangeRates["date"] = selectedDate.toISOString();
            });
            console.log("exchangeRates", exchangeRates);
            return exchangeRates;
        }
    } catch (error) {
        console.error("Error fetching exchange rate from TCMB:", error);
    }

    return null;
}

// Modify your existing getExchangeRate function
async function getExchangeRate(fromCurrency, toCurrency, selectedDate) {
    const existingExchangeRate = await getExchangeRateFromDatabase(
        selectedDate
    );

    if (existingExchangeRate !== null) {
        return existingExchangeRate;
    }

    const exchangeRateFromTCMB = await getExchangeRateFromTCMB(
        fromCurrency,
        toCurrency,
        selectedDate
    );
    return exchangeRateFromTCMB;
}

function calculateConvertedAmount(amount, rate) {
    console.log("Calculating converted amount...");
    return (amount * rate).toFixed(4);
}

function displayConvertedAmount(convertedAmount) {
    console.log("Displaying converted amount:", convertedAmount);
    document.getElementById("converted-amount").value = convertedAmount;
}

function displayErrorMessage(message) {
    console.log("Displaying error message:", message);
    document.getElementById("converted-amount").value = message;
}

async function updateConvertedAmount() {
    console.log("Updating converted amount...");
    var fromCurrency = document.getElementById("selectedCurrency").value;
    var amount = parseFloat(document.getElementById("amount").value);
    var toCurrency = document.getElementById("toCurrency").value;
    var selectedDate = new Date(document.getElementById("selectedDate").value);

    console.log("Selected currency:", fromCurrency);
    console.log("Amount:", amount);
    console.log("Target currency:", toCurrency);
    console.log("Selected date:", selectedDate);

    try {
        const existingExchangeRates = await getExchangeRateFromDatabase(
            selectedDate
        );
        console.log("VERITABANINDAKI VAR OLAN KURLARA BAKILIYOR");
        console.log(existingExchangeRates);

        if (existingExchangeRates) {
            console.log("DATABASE'DE MEVCUT");
            const selectedRate = existingExchangeRates.find(
                (rate) => rate.fromCurrency === fromCurrency
            );
            if (selectedRate) {
                console.log("bu database'de bu para birimi mevcut");

                const convertedAmount = calculateConvertedAmount(
                    amount,
                    selectedRate.buyRate
                );
                displayConvertedAmount(convertedAmount);
                return;
            }
        }
            
        console.log("getExchangeRateFromDatabase calismadi. Veriler TCMB'den alinacak");
        console.log(selectedDate);
        const exchangeRates = await getExchangeRateFromTCMB(fromCurrency, toCurrency, selectedDate);

        if (exchangeRates) {
            console.log("TCMB KURLARI ALINDI:", exchangeRates);
            const convertedAmount = calculateConvertedAmount(
                amount,
                exchangeRates[fromCurrency.toLowerCase()] // Assuming currency codes are in lowercase
            );
            displayConvertedAmount(convertedAmount);

            // Create an array of exchange rate objects
            const exchangeRateObjects = [];
            for (const currency in exchangeRates) {
                if (currency !== "date") {
                    exchangeRateObjects.push({
                        fromCurrency: currency.toUpperCase(), // Assuming you want to save currencies in uppercase
                        toCurrency: toCurrency,
                        buyRate: exchangeRates[currency],
                        date: exchangeRates.date,
                    });
                }
            }

            // Save the fetched exchange rates to the database
            const savedToDatabase = await saveExchangeRatesToDatabase(
                exchangeRateObjects,
                selectedDate
            );

            if (savedToDatabase) {
                console.log("Exchange rates saved to the database.");
            } else {
                console.error("Failed to save exchange rates to the database.");
            }
        } else {
            console.log("KURLAR ALINIRKEN HATA OLUSTU");
            console.log("No exchange rate data available.");
            displayErrorMessage("No data available for the selected criteria.");
        }
    } catch (error) {
        console.error("Error:", error);
        displayErrorMessage("An error occurred.");
    }
}
