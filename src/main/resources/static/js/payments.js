
document.addEventListener("DOMContentLoaded", () => {
    const root =
        document.getElementById("pageContent") ||
        document.getElementById("mainContent") ||
        document.getElementById("content");

    if (!root) {
        console.error("Payment page container not found.");
        return;
    }

    root.innerHTML = `
        <section class="panel">
            <div class="panel-header">
                <div>
                    <span class="section-label">REVENUE CENTER</span>
                    <h2>Payment Management</h2>
                    <p>Monitor parking transactions and collected revenue.</p>
                </div>

                <button class="btn btn-primary" id="paymentRefreshBtn">
                    Refresh
                </button>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <span>Total Transactions</span>
                    <h2 id="paymentCount">--</h2>
                </div>

                <div class="stat-card">
                    <span>Total Revenue</span>
                    <h2 id="totalRevenue">₹--</h2>
                </div>
            </div>
        </section>

        <section class="panel">
            <div class="panel-header">
                <div>
                    <span class="section-label">TRANSACTION RECORDS</span>
                    <h2>Payment History</h2>
                </div>
            </div>

            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>Record ID</th>
                            <th>Amount</th>
                            <th>Payment Method</th>
                            <th>Status</th>
                            <th>Payment Time</th>
                        </tr>
                    </thead>
                    <tbody id="paymentsTableBody">
                        <tr><td colspan="6">Loading payments...</td></tr>
                    </tbody>
                </table>
            </div>
        </section>
    `;

    document.getElementById("paymentRefreshBtn")
        .addEventListener("click", loadPaymentsPage);

    loadPaymentsPage();
});

async function loadPaymentsPage() {
    const tbody = document.getElementById("paymentsTableBody");
    if (!tbody) return;

    tbody.innerHTML =
        `<tr><td colspan="6">Loading payments...</td></tr>`;

    try {
        const payments = await SmartParkAPI.getPaymentHistory();

        let revenue = 0;

        payments.forEach(payment => {
            if (
                String(payment.paymentStatus).toUpperCase() === "SUCCESS"
            ) {
                revenue += Number(payment.amount || 0);
            }
        });

        document.getElementById("paymentCount").textContent =
            payments.length;

        document.getElementById("totalRevenue").textContent =
            `₹${revenue.toFixed(2)}`;

        if (!payments.length) {
            tbody.innerHTML =
                `<tr><td colspan="6">No payment records found.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        payments.forEach(payment => {
            const row = document.createElement("tr");

            const values = [
                payment.paymentId ?? "-",
                payment.recordId ?? "-",
                `₹${Number(payment.amount || 0).toFixed(2)}`,
                payment.paymentMethod || "-",
                payment.paymentStatus || "-",
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

    } catch (error) {
        tbody.innerHTML =
            `<tr><td colspan="6">Unable to load payments: ${
                error.message
            }</td></tr>`;
    }
}
