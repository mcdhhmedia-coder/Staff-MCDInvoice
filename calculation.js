document.addEventListener("DOMContentLoaded", () => {

    const DB_NAME = "CommunicationProviderInvoiceDB";
    const STORE_NAME = "invoiceData";
    const RECORD_ID = "currentInvoice";

    let saveTimer;
    let dbPromise;


    const inputs = [...document.querySelectorAll("input")];
    const rows = [...document.querySelectorAll(".service-table tbody tr")];
    const grandTotal = document.getElementById("grandTotal");
    const resetBtn = document.getElementById("resetBtn");


    // DATABASE
    function openDatabase() {

        if (dbPromise) return dbPromise;

        dbPromise = new Promise((resolve, reject) => {

            const request = indexedDB.open(DB_NAME, 1);

            request.onupgradeneeded = e => {

                const db = e.target.result;

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, {
                        keyPath: "id"
                    });
                }
            };

            request.onsuccess = e => resolve(e.target.result);
            request.onerror = () => reject(request.error);

        });

        return dbPromise;
    }


    // NUMBER
    function getNumber(value) {

        const num = parseFloat(value);

        return Number.isFinite(num)
            ? Math.max(0, num)
            : 0;
    }


    // CALCULATE
    function calculateInvoice() {

        let total = 0;

        const providerRate =
            getNumber(
                document.querySelector(".provider-rate")?.value
            );


        rows.forEach(row => {

            let amount = 0;
            const type = row.dataset.type;


            if (type === "standard" || type === "provider") {

                const qty =
                    getNumber(row.querySelector(".qty")?.value);

                const rate =
                    getNumber(
                        row.querySelector(".rate, .provider-rate")?.value
                    );

                amount = qty * rate;

            } else if (type === "travel") {

                const miles =
                    getNumber(row.querySelector(".miles")?.value);

                amount =
                    (providerRate / 2) * (miles / 50);
            }


            const field = row.querySelector(".total");

            if (field)
                field.value = amount.toFixed(2);


            total += amount;

        });


        if (grandTotal) {

            grandTotal.textContent =
                total.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD"
                });

        }
    }


    // COLLECT
    function collectData() {

        const data = {};

        inputs.forEach((input, i) => {

            if (
                input.classList.contains("total") ||
                input.disabled
            )
                return;

            data[input.id || `input_${i}`] =
                input.value;

        });

        return data;
    }


    // SAVE
    async function saveForm() {

        try {

            const db = await openDatabase();

            db.transaction(STORE_NAME, "readwrite")
              .objectStore(STORE_NAME)
              .put({
                  id: RECORD_ID,
                  data: collectData(),
                  saved: Date.now()
              });

        } catch (error) {

            console.error("Save failed:", error);

        }
    }


    // LOAD
    async function loadForm() {

        try {

            const db = await openDatabase();

            const request =
                db.transaction(STORE_NAME, "readonly")
                  .objectStore(STORE_NAME)
                  .get(RECORD_ID);


            request.onsuccess = () => {

                if (!request.result) return;

                const data = request.result.data;

                inputs.forEach((input, i) => {

                    if (
                        input.classList.contains("total") ||
                        input.disabled
                    )
                        return;

                    const key =
                        input.id || `input_${i}`;

                    if (data[key] !== undefined)
                        input.value = data[key];

                });

                calculateInvoice();

            };

        } catch(error) {

            console.error("Load failed:", error);

        }
    }


    // AUTO SAVE
    function queueSave() {

        clearTimeout(saveTimer);

        saveTimer =
            setTimeout(saveForm, 500);
    }


    // RESET
    async function resetInvoice() {

        if (!confirm("Clear all invoice data and start over?"))
            return;

        const db = await openDatabase();

        db.transaction(STORE_NAME, "readwrite")
          .objectStore(STORE_NAME)
          .delete(RECORD_ID);


        inputs.forEach(input => {
            input.value = input.defaultValue;
        });

        calculateInvoice();
    }


    // EVENTS
    document.addEventListener("input", () => {

        calculateInvoice();
        queueSave();

    });


    resetBtn?.addEventListener(
        "click",
        resetInvoice
    );


    loadForm();

});