document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "cartInvoiceData";
    const SAVE_DELAY = 250;

    let saveTimer;

    // =========================
    // CACHE DOM ELEMENTS
    // =========================

    const inputs = document.querySelectorAll("input");
    const rows = document.querySelectorAll(".service-table tbody tr");
    const grandTotalEl = document.getElementById("grandTotal");
    const resetBtn = document.getElementById("resetBtn");

    // =========================
    // HELPERS
    // =========================

    function getNumber(value) {
        return Math.max(0, parseFloat(value) || 0);
    }

    function formatCurrency(amount) {
        return "$" + amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // =========================
    // CALCULATE TOTALS
    // =========================

    function calculateInvoice() {
        let grandTotal = 0;

        const providerRate = getNumber(
            document.querySelector(".provider-rate")?.value
        );

        rows.forEach(row => {
            const type = row.dataset.type;
            let total = 0;

            switch (type) {
                case "standard":
                case "provider": {
                    const qty = getNumber(
                        row.querySelector(".qty")?.value
                    );

                    const rate = getNumber(
                        row.querySelector(".rate, .provider-rate")?.value
                    );

                    total = qty * rate;
                    break;
                }

                case "travel": {
                    const travelMiles = getNumber(
                        row.querySelector(".miles")?.value
                    );

                    // KEEP THIS FORMULA EXACTLY AS-IS
                    const tripRate = providerRate / 2;
                    const tripUnits = travelMiles / 50;

                    total = tripRate * tripUnits;
                    break;
                }
            }

            const totalField = row.querySelector(".total");

            if (totalField) {
                totalField.value = total.toFixed(2);
            }

            grandTotal += total;
        });

        if (grandTotalEl) {
            grandTotalEl.textContent =
                formatCurrency(grandTotal);
        }
    }

    // =========================
    // SAVE FORM
    // =========================

    function saveForm() {
        const data = [...inputs]
            .filter(input => !input.classList.contains("total"))
            .map(input => input.value);

        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(data)
            );
        } catch (error) {
            console.error("Unable to save invoice.", error);
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

            const editableInputs = [...inputs].filter(
                input => !input.classList.contains("total")
            );

            editableInputs.forEach((input, index) => {
                input.value = data[index] || "";
            });
        } catch (error) {
            console.error("Unable to load invoice.", error);
        }

        calculateInvoice();
    }

    // =========================
    // RESET
    // =========================

    function resetInvoice() {
        if (!confirm(
            "Clear all invoice data and start over?"
        )) {
            return;
        }

        localStorage.removeItem(STORAGE_KEY);

        inputs.forEach(input => {
            input.value = "";
        });

        calculateInvoice();
    }

    // =========================
    // AUTO SAVE
    // =========================

    function queueSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveForm, SAVE_DELAY);
    }

    // =========================
    // EVENTS
    // =========================

    function handleInput() {
        calculateInvoice();
        queueSave();
    }

    document.addEventListener("input", handleInput);

    resetBtn?.addEventListener(
        "click",
        resetInvoice
    );

    // =========================
    // STARTUP
    // =========================

    loadForm();
    calculateInvoice();
});