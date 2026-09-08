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
      if (!window.indexedDB) {
        reject(new Error("IndexedDB is not supported by this browser."));
        return;
      }

      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = event => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = event => resolve(event.target.result);
      request.onerror = () => reject(request.error);
    });

    return dbPromise;
  }

  // NUMBER
  function getNumber(value) {
    const num = parseFloat(value);
    return Number.isFinite(num) ? Math.max(0, num) : 0;
  }

  // CALCULATE
  function calculateInvoice() {
    let total = 0;

    const baseRate = getNumber(
      document.querySelector(".base-rate")?.value
    );

    rows.forEach(row => {
      let amount = 0;
      const type = row.dataset.type;

      if (type === "standard" || type === "base") {
        const qty = getNumber(row.querySelector(".qty")?.value);
        const rate = getNumber(
          row.querySelector(".rate, .base-rate")?.value
        );

        amount = qty * rate;
      } else if (type === "travel") {
        const miles = getNumber(row.querySelector(".miles")?.value);

        // Keep the original travel formula unchanged.
        amount = (baseRate / 2) * (miles / 50);
      }

      const field = row.querySelector(".total");

      if (field) {
        field.value = amount.toFixed(2);
      }

      total += amount;
    });

    if (grandTotal) {
      grandTotal.textContent = total.toLocaleString("en-US", {
        style: "currency",
        currency: "USD"
      });
    }
  }

  // COLLECT
  function collectData() {
    const data = {};

    inputs.forEach((input, index) => {
      if (input.classList.contains("total") || input.disabled) return;

      const key = input.name || input.id || `input_${index}`;
      data[key] = input.value;
    });

    return data;
  }

  // SAVE
  async function saveForm() {
    try {
      const db = await openDatabase();

      await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(
          transaction.error || new Error("Save transaction was aborted.")
        );

        store.put({
          id: RECORD_ID,
          data: collectData(),
          saved: Date.now()
        });
      });
    } catch (error) {
      console.error("Save failed:", error);
    }
  }

  // LOAD
  async function loadForm() {
    try {
      const db = await openDatabase();

      const data = await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).get(RECORD_ID);

        request.onsuccess = () => resolve(request.result?.data || null);
        request.onerror = () => reject(request.error);
      });

      if (!data) {
        calculateInvoice();
        return;
      }

      inputs.forEach((input, index) => {
        if (input.classList.contains("total") || input.disabled) return;

        const key = input.name || input.id || `input_${index}`;

        if (data[key] !== undefined) {
          input.value = data[key];
        }
      });

      calculateInvoice();
    } catch (error) {
      console.error("Load failed:", error);
      calculateInvoice();
    }
  }

  // AUTO SAVE
  function queueSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveForm, 500);
  }

  // RESET
  async function resetInvoice() {
    if (!confirm("Clear all invoice data and start over?")) return;

    clearTimeout(saveTimer);

    try {
      const db = await openDatabase();

      await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const request = transaction.objectStore(STORE_NAME).delete(RECORD_ID);

        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(
          transaction.error || new Error("Reset transaction was aborted.")
        );

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Reset failed:", error);
    }

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

  resetBtn?.addEventListener("click", resetInvoice);

  calculateInvoice();
  loadForm();
});
