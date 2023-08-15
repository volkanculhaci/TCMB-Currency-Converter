async function getExchangeRateFromDatabase(selectedDate) {
    const apiUrl = `/Home/GetExchangeRateFromDatabase?selectedDate=${selectedDate.toISOString()}`;

    const response = await fetch(apiUrl);
    if (response.ok) {
        const data = await response.json();
        if (data.success) {
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

    const response = await fetch(apiUrl);
    if (response.ok) {
        const xmlString = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");

        const exchangeRates = {};
        const rateElements = xmlDoc.querySelectorAll("items > *");
        rateElements.forEach((rateElement) => {
            const currency = rateElement.tagName;
            const rate = parseFloat(rateElement.textContent);
            exchangeRates[currency] = rate;
            exchangeRates["date"] = selectedDate.toISOString();
        });
        return exchangeRates;
    }
    console.error("Error fetching exchange rate from TCMB");
    return null;
}

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
    return (amount * rate).toFixed(4);
}

function displayConvertedAmount(convertedAmount) {
    const convertedAmountInput = document.getElementById("converted-amount");

    if (isNaN(convertedAmount) || convertedAmount === 0) {
        convertedAmountInput.value = "Haftasonu veya Resmi Tatil!";
    } else {
        convertedAmountInput.value = convertedAmount;
    }
}

function displayErrorMessage(message) {
    document.getElementById("converted-amount").value =
        "Haftasonu veya Resmi Tatil!";
}

async function createAndSaveExchangeRateObjects(exchangeRates, selectedDate) {
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
        console.log("Kurlar veritabanına kaydedildi.");
    } else {
        console.error("Kurlar veritabanına kaydedilemedi.");
    }
}

async function updateConvertedAmount() {
    var fromCurrency = document.getElementById("selectedCurrency").value;
    var amount = parseFloat(document.getElementById("amount").value);
    var toCurrency = document.getElementById("toCurrency").value;
    var selectedDate = new Date(document.getElementById("selectedDate").value);

    const existingExchangeRates = await getExchangeRateFromDatabase(
        selectedDate
    );
    if (existingExchangeRates) {
        const selectedRateFrom = existingExchangeRates.find(
            (rate) => rate.fromCurrency === fromCurrency
        );
        const selectedRateTo = existingExchangeRates.find(
            (rate) => rate.fromCurrency === toCurrency
        );

        if (fromCurrency === "TRY") {
            if (existingExchangeRates && toCurrency === "TRY") {
                const convertedAmount = calculateConvertedAmount(amount, 1);
                displayConvertedAmount(convertedAmount);
            } else if (selectedRateTo) {
                const convertedAmount = calculateConvertedAmount(
                    amount,
                    1 / selectedRateTo.buyRate
                );
                displayConvertedAmount(convertedAmount);
            } else {
                displayErrorMessage(
                    "Hedef para birimi veritabanında bulunamadı."
                );
            }
        } else if (toCurrency === "TRY") {
            if (selectedRateFrom) {
                const convertedAmount = calculateConvertedAmount(
                    amount * selectedRateFrom.buyRate,
                    1
                );
                displayConvertedAmount(convertedAmount);
            } else {
                displayErrorMessage(
                    "Kaynak para birimi veritabanında bulunamadı."
                );
            }
        } else if (selectedRateFrom && selectedRateTo) {
            const convertedAmount = calculateConvertedAmount(
                amount * selectedRateFrom.buyRate,
                1 / selectedRateTo.buyRate
            );
            displayConvertedAmount(convertedAmount);
        } else {
            displayErrorMessage("Kurlar veritabanında bulunamadı.");
        }
    } else {
        const exchangeRates = await getExchangeRateFromTCMB(
            fromCurrency,
            toCurrency,
            selectedDate
        );

        if (exchangeRates) {
            const fromRate = exchangeRates[fromCurrency.toLowerCase()];
            const toRate = exchangeRates[toCurrency.toLowerCase()];

            if (fromCurrency === "TRY") {
                const convertedAmount =
                    parseFloat(amount) * (1 / parseFloat(toRate));
                displayConvertedAmount(convertedAmount);
                await createAndSaveExchangeRateObjects(
                    exchangeRates,
                    selectedDate
                );
            } else if (toCurrency === "TRY") {
                const convertedAmount = amount * fromRate;
                displayConvertedAmount(convertedAmount);
                await createAndSaveExchangeRateObjects(
                    exchangeRates,
                    selectedDate
                );
            } else if (fromRate && toRate) {
                const convertedAmount = calculateConvertedAmount(
                    amount * fromRate,
                    1 / toRate
                );
                displayConvertedAmount(convertedAmount);
                await createAndSaveExchangeRateObjects(
                    exchangeRates,
                    selectedDate
                );
            } else {
                displayErrorMessage("Haftasonu veya Resmi Tatil!");
            }
        } else {
            console.log("Kurlar TCMB'den alınırken hata oluştu.");
        }
    }
}
