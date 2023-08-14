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
    console.log("Calculating converted amount...", rate);
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
        console.log("selectedrate to: ", selectedRateTo); // is json object
        console.log("to currency ", toCurrency); // is just currency name
        if (fromCurrency === "TRY") {
            console.log("TRY SECILDI");
            if (existingExchangeRates && toCurrency === "TRY") {
                const convertedAmount = calculateConvertedAmount(amount, 1);
                displayConvertedAmount(convertedAmount, fromCurrency);
                console.log("AAAAA");
            } else if (selectedRateTo) {
                console.log("selectedRateTo bulundu", selectedRateTo);
                console.log("BBBBB");
                const convertedAmount = calculateConvertedAmount(
                    amount,
                    1 / selectedRateTo.buyRate
                );
                displayConvertedAmount(convertedAmount, fromCurrency);
            } else {
                console.log("CCCCC");
                console.log("Hedef para birimi veritabanında bulunamadı.");
                displayErrorMessage(
                    "Hedef para birimi veritabanında bulunamadı."
                );
            }
        } else if (toCurrency === "TRY") {
            if (selectedRateFrom) {
                console.log("DDDDD");
                const convertedAmount = (amount * selectedRateFrom.buyRate, 1);
                displayConvertedAmount(convertedAmount, fromCurrency);
            } else {
                console.log("Kaynak para birimi veritabanında bulunamadı.");
                displayErrorMessage(
                    "Kaynak para birimi veritabanında bulunamadı."
                );
            }
        } else if (selectedRateFrom && selectedRateTo) {
            console.log("EEEEEE");
            const convertedAmount = calculateConvertedAmount(
                amount * selectedRateFrom.buyRate,
                1 / selectedRateTo.buyRate
            );
            displayConvertedAmount(convertedAmount, fromCurrency);
        } else {
            console.log("XXXXX", selectedRateFrom);
            console.log("Kurlar veritabanında bulunamadı.");
            displayErrorMessage("Kurlar veritabanında bulunamadı.");
        }
    } else {
        console.log("Veritabanından kurlar bulunamadı, TCMB'den alınıyor...");
        const exchangeRates = await getExchangeRateFromTCMB(
            fromCurrency,
            toCurrency,
            selectedDate
        ); // NEDEN SADECE SELECTED DATE GONDERMIYORUM

        if (exchangeRates) {
            const fromRate = exchangeRates[fromCurrency.toLowerCase()];
            const toRate = exchangeRates[toCurrency.toLowerCase()];
            console.log("fromrate ve torate:", fromRate, toRate);
            console.log("fromCurrency: ", fromCurrency);

            if (fromCurrency === "TRY") {
                // BU IF OKAY. ILK TRY GIRIYORUZ. IKINCI
                console.log("yyyyy");
                console.log("amount", amount);
                console.log("toRate", toRate);

                const convertedAmount =
                    parseFloat(amount) * (1 / parseFloat(toRate));
                console.log("converted miktar:", convertedAmount);
                displayConvertedAmount(convertedAmount);

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
            } else if (toCurrency === "TRY") {
                const convertedAmount = amount * fromRate;
                console.log("converted miktar:", convertedAmount);
                displayConvertedAmount(convertedAmount);

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
            } else if (fromRate && toRate) {
                // nonTRY conversions
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
                    console.log("Kurlar veritabanına kaydedildi.");
                } else {
                    console.error("Kurlar veritabanına kaydedilemedi.");
                }
            } else {
                console.log("Kurlar veritabanından alınırken hata oluştu.");
                console.log("Veri mevcut değil.");
                displayErrorMessage("Veri mevcut değil.");
            }
        } else {
            console.log("Kurlar TCMB'den alınırken hata oluştu.");
        }
    }
}
