let db;

const request = indexedDB.open("budget_tracker", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("new_transaction", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.online) {
    uploadTransaction();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transactionObjectStore = db
    .transaction(["new_transaction"], "readwrite")
    .objectStore("new_transaction");
  transactionObjectStore.add(record);
}

function uploadTransaction() {
  const transactionObjectStore = db
    .transaction(["new_transaction"], "readwrite")
    .objectStore("new_transaction");
  const getAll = transactionObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transactionObjectStore = db
            .transaction(["new_transaction"], "readwrite")
            .objectStore("new_transaction");
          transactionObjectStore.clear();

          alert("all transactions have been submitted!");
        })
        .catch((err) => console.log(err));
    }
  };
}

window.addEventListener("online", uploadTransaction);
