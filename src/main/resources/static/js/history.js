
document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("pageContent");

    if (!root) {
        console.error("History page container not found.");
        return;
    }

    root.innerHTML = `
        <section class="history-overview">
            <div class="history-stat">
                <span>TOTAL RECORDS</span>
                <strong id="historyTotal">--</strong>
            </div>

            <div class="history-stat">
                <span>ACTIVE SESSIONS</span>
                <strong id="historyActive">--</strong>
            </div>

            <div class="history-stat">
                <span>COMPLETED SESSIONS</span>
                <strong id="historyCompleted">--</strong>
            </div>

            <div class="history-stat">
                <span>TOTAL PARKING FEES</span>
                <strong id="historyRevenue">₹--</strong>
            </div>
        </section>

        <section class="panel history-panel">
            <div class="panel-header">
                <div>
                    <span class="section-label">ACTIVITY MANAGEMENT</span>
                    <h2>Parking Records</h2>
                    <p>Search, filter and review all parking sessions.</p>
                </div>

                <div class="history-actions">
                    <button class="btn btn-secondary" id="historyRefreshBtn">
                        ↻ Refresh
                    </button>

                    <button class="btn btn-primary" id="exportHistoryBtn">
                        ↓ Export CSV
                    </button>
                </div>
            </div>

            <div class="history-filters">
                <label>
                    Search Vehicle / Owner
                    <input type="search" id="historySearch"
                        placeholder="Enter vehicle number or owner name">
                </label>

                <label>
                    Vehicle Type
                    <select id="historyType">
                        <option value="ALL">All Types</option>
                        <option value="BIKE">Bike</option>
                        <option value="CAR">Car</option>
                        <option value="BUS">Bus</option>
                    </select>
                </label>

                <label>
                    Parking Status
                    <select id="historyStatus">
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="COMPLETED">Completed</option>
                    </select>
                </label>

                <label>
                    From Date
                    <input type="date" id="historyFromDate">
                </label>

                <label>
                    To Date
                    <input type="date" id="historyToDate">
                </label>

                <button class="btn btn-secondary" id="clearHistoryFilters">
                    Clear Filters
                </button>
            </div>

            <div class="history-result-line">
                <span id="historyResultCount">Loading records...</span>
            </div>

            <div class="table-wrapper">
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Record ID</th>
                            <th>Vehicle Number</th>
                            <th>Owner</th>
                            <th>Type</th>
                            <th>Slot</th>
                            <th>Entry Time</th>
                            <th>Exit Time</th>
                            <th>Parking Fee</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody id="historyTableBody">
                        <tr>
                            <td colspan="9">Loading parking records...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    `;

    const filterIds = [
        "historySearch",
        "historyType",
        "historyStatus",
        "historyFromDate",
        "historyToDate"
    ];

    filterIds.forEach(id => {
        const element = document.getElementById(id);
        element.addEventListener("input", applyHistoryFilters);
        element.addEventListener("change", applyHistoryFilters);
    });

    document.getElementById("historyRefreshBtn")
        .addEventListener("click", loadHistoryPage);

    document.getElementById("clearHistoryFilters")
        .addEventListener("click", clearHistoryFilters);

    document.getElementById("exportHistoryBtn")
        .addEventListener("click", exportHistoryCSV);

    loadHistoryPage();
});

let allHistoryRecords = [];
let filteredHistoryRecords = [];


// LOAD PARKING HISTORY

async function loadHistoryPage() {
    const tbody = document.getElementById("historyTableBody");

    if (!tbody) return;

    tbody.innerHTML =
        `<tr><td colspan="9">Loading parking records...</td></tr>`;

    try {
        const records = await SmartParkAPI.getParkingHistory();

        allHistoryRecords = Array.isArray(records) ? records : [];

        updateHistoryStatistics();
        applyHistoryFilters();

    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">Unable to load records: ${escapeHistoryText(error.message)}</td>
            </tr>
        `;

        document.getElementById("historyResultCount").textContent =
            "Unable to load parking records.";
    }
}


// UPDATE SUMMARY CARDS

function updateHistoryStatistics() {
    const total = allHistoryRecords.length;

    const active = allHistoryRecords.filter(record =>
        String(record.status).toUpperCase() === "ACTIVE"
    ).length;

    const completed = allHistoryRecords.filter(record =>
        String(record.status).toUpperCase() === "COMPLETED"
    ).length;

    const revenue = allHistoryRecords
        .filter(record =>
            String(record.status).toUpperCase() === "COMPLETED"
        )
        .reduce((sum, record) =>
            sum + Number(record.parkingFee || 0), 0
        );

    document.getElementById("historyTotal").textContent = total;
    document.getElementById("historyActive").textContent = active;
    document.getElementById("historyCompleted").textContent = completed;

    document.getElementById("historyRevenue").textContent =
        `₹${revenue.toFixed(2)}`;
}


// APPLY FILTERS

function applyHistoryFilters() {
    const search = document.getElementById("historySearch")
        .value.trim().toLowerCase();

    const type = document.getElementById("historyType").value;
    const status = document.getElementById("historyStatus").value;
    const fromDate = document.getElementById("historyFromDate").value;
    const toDate = document.getElementById("historyToDate").value;

    filteredHistoryRecords = allHistoryRecords.filter(record => {
        const vehicleNumber = String(record.vehicleNumber || "").toLowerCase();
        const ownerName = String(record.ownerName || "").toLowerCase();

        const matchesSearch =
            vehicleNumber.includes(search) ||
            ownerName.includes(search);

        const matchesType =
            type === "ALL" ||
            String(record.vehicleType).toUpperCase() === type;

        const matchesStatus =
            status === "ALL" ||
            String(record.status).toUpperCase() === status;

        const entryDate = record.entryTime
            ? new Date(record.entryTime)
            : null;

        const recordDate = entryDate && !isNaN(entryDate.getTime())
            ? entryDate.toLocaleDateString("en-CA")
            : "";

        const matchesFromDate =
            !fromDate || (recordDate && recordDate >= fromDate);

        const matchesToDate =
            !toDate || (recordDate && recordDate <= toDate);

        return matchesSearch &&
            matchesType &&
            matchesStatus &&
            matchesFromDate &&
            matchesToDate;
    });

    renderHistoryTable(filteredHistoryRecords);

    document.getElementById("historyResultCount").textContent =
        `Showing ${filteredHistoryRecords.length} of ${allHistoryRecords.length} records`;
}


// RENDER TABLE

function renderHistoryTable(records) {
    const tbody = document.getElementById("historyTableBody");

    tbody.innerHTML = "";

    if (!records.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">No matching parking records found.</td>
            </tr>
        `;
        return;
    }

    records.forEach(record => {
        const row = document.createElement("tr");

        const values = [
            record.recordId ?? "-",
            record.vehicleNumber || "-",
            record.ownerName || "-",
            record.vehicleType || "-",
            record.slotNumber ?? "-",
            formatHistoryDate(record.entryTime),
            formatHistoryDate(record.exitTime) || "Not exited",
            `₹${Number(record.parkingFee || 0).toFixed(2)}`
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");

        const status = String(record.status || "UNKNOWN").toUpperCase();

        badge.className = `history-status ${status.toLowerCase()}`;
        badge.textContent = status;

        statusCell.appendChild(badge);
        row.appendChild(statusCell);

        tbody.appendChild(row);
    });
}


// CLEAR FILTERS

function clearHistoryFilters() {
    document.getElementById("historySearch").value = "";
    document.getElementById("historyType").value = "ALL";
    document.getElementById("historyStatus").value = "ALL";
    document.getElementById("historyFromDate").value = "";
    document.getElementById("historyToDate").value = "";

    applyHistoryFilters();
}


// EXPORT CSV

function exportHistoryCSV() {
    if (!filteredHistoryRecords.length) {
        alert("There are no records to export.");
        return;
    }

    const headers = [
        "Record ID",
        "Vehicle Number",
        "Owner Name",
        "Vehicle Type",
        "Slot Number",
        "Entry Time",
        "Exit Time",
        "Parking Fee",
        "Status"
    ];

    const rows = filteredHistoryRecords.map(record => [
        record.recordId,
        record.vehicleNumber,
        record.ownerName,
        record.vehicleType,
        record.slotNumber,
        record.entryTime,
        record.exitTime,
        record.parkingFee,
        record.status
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(csvEscape).join(","))
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "SmartPark_Parking_History.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}


// HELPER FUNCTIONS

function csvEscape(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
}

function escapeHistoryText(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatHistoryDate(value) {
    if (!value) return "";

    const date = new Date(value);

    return isNaN(date.getTime())
        ? "-"
        : date.toLocaleString();
}
