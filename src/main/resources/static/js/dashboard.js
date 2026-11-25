
function getNumber(data, keys) {
    for (const key of keys) {
        const value = data?.[key];

        if (value !== undefined && value !== null && !isNaN(Number(value))) {
            return Number(value);
        }
    }

    return null;
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function updateOccupancy(total, occupied, available) {
    const percentage = total > 0
        ? Math.round((occupied / total) * 100)
        : 0;

    setText("occupancyPercent", `${percentage}%`);

    const ring = document.getElementById("occupancyRing");

    if (ring) {
        ring.style.background = `conic-gradient(
            #f5a742 0% ${percentage}%,
            #203647 ${percentage}% 100%
        )`;
    }

    const legend = document.querySelectorAll(
        ".occupancy-legend-value"
    );

    if (legend.length >= 2) {
        legend[0].textContent = available;
        legend[1].textContent = occupied;
    }
}

function renderParkingSlots(slots) {
    const container = document.getElementById("slotPreview");

    if (!container) return;

    if (!Array.isArray(slots) || slots.length === 0) {
        container.textContent = "No parking slots found.";
        return;
    }

    container.innerHTML = "";

    slots.forEach(slot => {
        const number = slot.slotNumber;
        const occupied = String(slot.status).toUpperCase() === "OCCUPIED";

        const item = document.createElement("div");

        item.className = occupied
            ? "slot-item occupied"
            : "slot-item available";

        item.innerHTML = `
            <span class="slot-number">P${number}</span>
            <span class="slot-status">
                ${occupied ? "Occupied" : "Available"}
            </span>
`       ;

        item.title = occupied
            ? `Slot ${number} is occupied`
            : `Slot ${number} is available`;

        container.appendChild(item);
    });
}

async function loadDashboard() {
    try {
        const [summary, slots] = await Promise.all([
            SmartParkAPI.getSummary(),
            SmartParkAPI.getSlots()
        ]);

        const total = getNumber(summary, [
            "totalSlots", "totalCapacity", "total"
        ]);

        const occupied = getNumber(summary, [
            "occupiedSlots", "occupied", "occupiedCount"
        ]);

        const available = getNumber(summary, [
            "availableSlots", "available", "availableCount"
        ]);

        const active = getNumber(summary, [
            "activeVehicles", "activeVehicleCount"
        ]);

        setText("totalSlots", total ?? "--");
        setText("occupiedSlots", occupied ?? "--");
        setText("availableSlots", available ?? "--");
        setText("activeVehicles", active ?? "--");

        if (total !== null && occupied !== null) {
            updateOccupancy(
                total,
                occupied,
                available ?? Math.max(0, total - occupied)
            );
        }

        renderParkingSlots(slots);

        setText(
            "lastUpdated",
            `Last updated: ${new Date().toLocaleTimeString()}`
        );

        const status = document.getElementById("connectionStatus");

        if (status) {
            status.textContent = "Connected to server";
        }

    } catch (error) {
        console.error("Dashboard loading failed:", error);

        const container = document.getElementById("slotPreview");

        if (container) {
            container.textContent = "Unable to load parking slots. Check backend connection.";
        }

        const status = document.getElementById("connectionStatus");

        if (status) {
            status.textContent = "Backend connection failed";
        }
    }
}

window.loadDashboard = loadDashboard;


// ============================================
// SMARTPARK 360 - ADVANCED ANALYTICS
// ============================================

async function loadAdvancedAnalytics() {
    try {
        const [history, payments, slots] = await Promise.all([
            SmartParkAPI.getParkingHistory(),
            SmartParkAPI.getPaymentHistory(),
            SmartParkAPI.getSlots()
        ]);

        renderVehicleAnalytics(history);
        renderUtilizationAnalytics(slots);
        renderRevenueAnalytics(payments);
        renderRecentTransactions(payments);

    } catch (error) {
        console.error("Analytics loading failed:", error);

        [
            "vehicleAnalytics",
            "utilizationAnalytics",
            "revenueAnalytics",
            "recentTransactions"
        ].forEach(id => {
            const element = document.getElementById(id);

            if (element) {
                element.textContent = "Unable to load analytics data.";
            }
        });
    }
}


// 1. VEHICLE DISTRIBUTION

function renderVehicleAnalytics(records) {
    const container = document.getElementById("vehicleAnalytics");
    if (!container) return;

    const types = {
        BIKE: 0,
        CAR: 0,
        BUS: 0
    };

    records.forEach(record => {
        const type = String(record.vehicleType || "").toUpperCase();

        if (Object.prototype.hasOwnProperty.call(types, type)) {
            types[type]++;
        }
    });

    const total = Object.values(types).reduce((a, b) => a + b, 0);

    container.innerHTML = "";

    Object.entries(types).forEach(([type, count]) => {
        const percentage = total
            ? Math.round((count / total) * 100)
            : 0;

        const row = document.createElement("div");
        row.className = "vehicle-analytics-row";

        const label = document.createElement("div");
        label.className = "vehicle-analytics-label";

        const name = document.createElement("strong");
        name.textContent = type;

        const value = document.createElement("span");
        value.textContent = `${count} records · ${percentage}%`;

        label.append(name, value);

        const track = document.createElement("div");
        track.className = "analytics-bar-track";

        const bar = document.createElement("div");
        bar.className = `analytics-bar ${type.toLowerCase()}`;
        bar.style.width = `${percentage}%`;

        track.appendChild(bar);
        row.append(label, track);
        container.appendChild(row);
    });

    const footer = document.createElement("div");
    footer.className = "analytics-total-line";
    footer.textContent = `Total parking records: ${total}`;

    container.appendChild(footer);
}


// 2. PARKING UTILIZATION

function renderUtilizationAnalytics(slots) {
    const container = document.getElementById("utilizationAnalytics");
    if (!container) return;

    const total = slots.length;

    const occupied = slots.filter(slot =>
        String(slot.status).toUpperCase() === "OCCUPIED"
    ).length;

    const available = total - occupied;

    const percentage = total
        ? Math.round((occupied / total) * 100)
        : 0;

    container.innerHTML = `
        <div class="utilization-main">
            <div class="utilization-circle"
                 style="--utilization:${percentage}%">
                <div class="utilization-circle-inner">
                    <strong>${percentage}%</strong>
                    <span>IN USE</span>
                </div>
            </div>
        </div>

        <div class="utilization-legend">
            <div>
                <span class="legend-dot occupied-dot"></span>
                <span>Occupied</span>
                <strong>${occupied}</strong>
            </div>

            <div>
                <span class="legend-dot available-dot"></span>
                <span>Available</span>
                <strong>${available}</strong>
            </div>

            <div>
                <span class="legend-dot total-dot"></span>
                <span>Total Capacity</span>
                <strong>${total}</strong>
            </div>
        </div>
    `;
}


// 3. REVENUE OVERVIEW - LAST SEVEN DAYS

function renderRevenueAnalytics(payments) {
    const container = document.getElementById("revenueAnalytics");
    if (!container) return;

    const successfulPayments = payments.filter(payment =>
        String(payment.paymentStatus).toUpperCase() === "SUCCESS"
    );

    const totalRevenue = successfulPayments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
    );

    const totalElement = document.getElementById(
        "analyticsTotalRevenue"
    );

    if (totalElement) {
        totalElement.textContent = `₹${totalRevenue.toFixed(2)}`;
    }

    const days = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - i);

        days.push({
            date,
            label: date.toLocaleDateString("en-IN", {
                weekday: "short"
            }),
            revenue: 0
        });
    }

    successfulPayments.forEach(payment => {
        if (!payment.paymentTime) return;

        const paymentDate = new Date(payment.paymentTime);

        if (isNaN(paymentDate.getTime())) return;

        const day = days.find(item =>
            item.date.getFullYear() === paymentDate.getFullYear() &&
            item.date.getMonth() === paymentDate.getMonth() &&
            item.date.getDate() === paymentDate.getDate()
        );

        if (day) {
            day.revenue += Number(payment.amount || 0);
        }
    });

    const maxRevenue = Math.max(
        ...days.map(day => day.revenue),
        1
    );

    container.innerHTML = "";

    const chart = document.createElement("div");
    chart.className = "revenue-chart";

    days.forEach(day => {
        const column = document.createElement("div");
        column.className = "revenue-column";

        const amount = document.createElement("span");
        amount.className = "revenue-bar-value";
        amount.textContent = `₹${day.revenue.toFixed(0)}`;

        const track = document.createElement("div");
        track.className = "revenue-bar-track";

        const bar = document.createElement("div");
        bar.className = "revenue-bar";
        bar.style.height =
            `${Math.max((day.revenue / maxRevenue) * 100, 2)}%`;

        bar.title = `${day.label}: ₹${day.revenue.toFixed(2)}`;

        track.appendChild(bar);

        const label = document.createElement("span");
        label.className = "revenue-day-label";
        label.textContent = day.label;

        column.append(amount, track, label);
        chart.appendChild(column);
    });

    container.appendChild(chart);
}


// 4. RECENT TRANSACTIONS

function renderRecentTransactions(payments) {
    const tbody = document.getElementById("recentTransactions");
    if (!tbody) return;

    tbody.innerHTML = "";

    const recent = [...payments]
        .sort((a, b) =>
            new Date(b.paymentTime || 0) -
            new Date(a.paymentTime || 0)
        )
        .slice(0, 5);

    if (!recent.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">No transactions available yet.</td>
            </tr>
        `;
        return;
    }

    recent.forEach(payment => {
        const row = document.createElement("tr");

        const values = [
            payment.paymentId ?? "-",
            payment.recordId ?? "-",
            `₹${Number(payment.amount || 0).toFixed(2)}`,
            payment.paymentMethod || "-",
            payment.paymentTime
                ? new Date(payment.paymentTime).toLocaleString()
                : "-"
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
}

window.loadAdvancedAnalytics = loadAdvancedAnalytics;
