async function getExchangeRateFromDatabase(selectedDate) {
    const apiUrl = `/Home/GetExchangeRateFromDatabase?selectedDate=${selectedDate.toISOString()}`;

    const response = await fetch(apiUrl);
    if (response.ok) {
        const data = await response.json();
        if (data.success) {
            console.log("VERITABANINDAN VERI CEKILDI");
            return data.exchangeRates;
        }
    }
    console.error("Error fetching data from the database");
    return null;
}

async function saveExchangeRatesToDatabase(exchangeRates, selectedDate) {
    const apiUrl = `/Home/SaveExchangeRatesToDatabase?selectedDate=${selectedDate.toISOString()}`;

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
        return false;
    }
}

async function getExchangeRateFromTCMB(fromCurrency, toCurrency, selectedDate) {
    const apiUrl = `api/ExchangeRates?selectedDate=${selectedDate.toISOString()}`;
    console.log(apiUrl);

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
    console.error("Error fetching exchange rate from TCMB");
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
    console.log("Calculating converted amount... +", rate);
    return (amount * rate).toFixed(4);
}

function displayConvertedAmount(convertedAmount, fromCurrency) {
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

    const existingExchangeRates = await getExchangeRateFromDatabase(selectedDate);

    if (existingExchangeRates) {
        const selectedRateFrom = existingExchangeRates.find(
            (rate) => rate.fromCurrency === fromCurrency
        );
        const selectedRateTo = existingExchangeRates.find(
            (rate) => rate.fromCurrency === toCurrency
        );

        if (fromCurrency === "TRY") {
            console.log("TRY SECILDI");
            if (toCurrency === "TRY") {
                const convertedAmount = calculateConvertedAmount(amount, 1);
                displayConvertedAmount(convertedAmount, fromCurrency);
            } else if (selectedRateTo) {
                console.log("selectedRateTo bulundu", selectedRateTo);
                const convertedAmount = calculateConvertedAmount(
                    amount,
                    1 / selectedRateTo.buyRate
                );
                displayConvertedAmount(convertedAmount, fromCurrency);
            } else {
                console.log("Hedef para birimi veritaban�nda bulunamad�.");
                displayErrorMessage("Hedef para birimi veritaban�nda bulunamad�.");
            }
        } else if (toCurrency === "TRY") {
            if (selectedRateFrom) {
                const convertedAmount = calculateConvertedAmount(
                    amount * selectedRateFrom.buyRate,
                    1
                );
                displayConvertedAmount(convertedAmount, fromCurrency);
            } else {
                console.log("Kaynak para birimi veritaban�nda bulunamad�.");
                displayErrorMessage("Kaynak para birimi veritaban�nda bulunamad�.");
            }
        } else if (selectedRateFrom && selectedRateTo) {
            const convertedAmount = calculateConvertedAmount(
                amount * selectedRateFrom.buyRate,
                1 / selectedRateTo.buyRate
            );
            displayConvertedAmount(convertedAmount, fromCurrency);
        } else {
            console.log("Kurlar veritaban�nda bulunamad�.");
            displayErrorMessage("Kurlar veritaban�nda bulunamad�.");
        }
    } else {
        console.log("Veritaban�ndan kurlar bulunamad�, TCMB'den al�n�yor...");
        const exchangeRates = await getExchangeRateFromTCMB(fromCurrency, toCurrency, selectedDate);

        if (exchangeRates) {
            const fromRate = exchangeRates[fromCurrency.toLowerCase()];
            const toRate = exchangeRates[toCurrency.toLowerCase()];

            if (fromRate && toRate) {
                const convertedAmount = calculateConvertedAmount(
                    amount * fromRate,
                    1 / toRate
                );

                displayConvertedAmount(convertedAmount, fromCurrency);

                const exchangeRateObjects = [];
                for (const currency in exchangeRates) {
                    if (currency !== "date") {
                        exchangeRateObjects.push({
                            fromCurrency: currency.toUpperCase(),
                            toCurrency: "TRY",
                            buyRate: exchangeRates[currency],
                            date: exchangeRates.date,
                        });
                    }
                }

                const savedToDatabase = await saveExchangeRatesToDatabase(
                    exchangeRateObjects,
                    selectedDate
                );

                if (savedToDatabase) {
                    console.log("Kurlar veritaban�na kaydedildi.");
                } else {
                    console.error("Kurlar veritaban�na kaydedilemedi.");
                }
            } else {
                console.log("Kurlar veritaban�ndan al�n�rken hata olu�tu.");
                console.log("Veri mevcut de�il.");
                displayErrorMessage("Veri mevcut de�il.");
            }
        } else {
            console.log("Kurlar TCMB'den al�n�rken hata olu�tu.");
        }
    }
}