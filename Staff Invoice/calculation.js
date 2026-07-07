document.addEventListener("DOMContentLoaded", () => {

    const STORAGE_KEY = "cartInvoiceData";
    let saveTimer;

    // =========================
    // CALCULATE TOTALS
    // =========================
    function calculateInvoice() {

        let grandTotal = 0;

        // Travel always uses Provider row rate.
        const providerRate =
            Math.max(
                0,
                parseFloat(
                    document.querySelector(".provider-rate")?.value
                ) || 0
            );

        document.querySelectorAll(".service-table tbody tr").forEach(row => {

            const type = row.dataset.type;
            let total = 0;

            // Regular rows
            if (type === "standard" || type === "provider") {

                const qty =
                    Math.max(
                        0,
                        parseFloat(row.querySelector(".qty")?.value) || 0
                    );

                const rate =
                    Math.max(
                        0,
                        parseFloat(
                            row.querySelector(".rate, .provider-rate")?.value
                        ) || 0
                    );

                total = qty * rate;
            }

            // Travel row
            else if (type === "travel") {

                const travelQty =
                    Math.max(
                        0,
                        parseFloat(row.querySelector(".miles")?.value) || 0
                    );

                // Business rule:
                // Travel = (Provider Rate / 2) × (Travel Qty / 50)

                total =
                    (providerRate / 2) *
                    (travelQty / 50);
            }

            const totalField = row.querySelector(".total");

            if (totalField) {
                totalField.value = total.toFixed(2);
            }

            grandTotal += total;

        });

        const grandTotalEl =
            document.getElementById("grandTotal");

        if (grandTotalEl) {

            grandTotalEl.textContent =
                "$" +
                grandTotal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });

        }

    }

    // =========================
    // SAVE FORM
    // =========================

    function saveForm() {

        const data = [];

        document.querySelectorAll("input").forEach(input => {

            if (input.classList.contains("total")) return;

            data.push(input.value);

        });

        try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        catch (e) {
            console.error("Unable to save invoice.", e);
        }
    }

    // =========================
    // LOAD FORM
    // =========================

    function loadForm() {

        try {

            const saved = localStorage.getItem(STORAGE_KEY);

            if (!saved) return;

            const data = JSON.parse(saved);

            let index = 0;

            document.querySelectorAll("input").forEach(input => {

                if (input.classList.contains("total")) return;

                if (index < data.length) {
                    input.value = data[index];
                }

                index++;

            });

        }
        catch (e) {
            console.error("Unable to load invoice.", e);
        }

        calculateInvoice();
    }

    // =========================
    // RESET
    // =========================

    function resetInvoice() {

        if (
            !confirm("Clear all invoice data and start over?")
        ) {
            return;
        }

        localStorage.removeItem(STORAGE_KEY);

        document.querySelectorAll("input").forEach(input => {

            input.value = "";

        });

        calculateInvoice();

    }

    // =========================
    // AUTO SAVE
    // =========================

    function queueSave() {

        clearTimeout(saveTimer);

        saveTimer = setTimeout(() => {

            saveForm();

        }, 250);

    }

    // =========================
    // EVENTS
    // =========================

    document.addEventListener("input", () => {

        calculateInvoice();
        queueSave();

    });

    document
        .getElementById("resetBtn")
        ?.addEventListener("click", resetInvoice);

    // =========================
    // STARTUP
    // =========================

    loadForm();
    calculateInvoice();

});