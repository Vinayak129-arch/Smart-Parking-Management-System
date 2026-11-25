let vehiclesCache = [];
document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("pageContent");

    if (!root) {
        console.error("Vehicle page container not found.");
        return;
    }

    root.innerHTML = `
        <section class="panel">
            <div class="panel-header">
                <div>
                    <span class="section-label">VEHICLE OPERATIONS</span>
                    <h2>Vehicle Management</h2>
                    <p>Register vehicles and monitor currently parked vehicles.</p>
                </div>
                <button class="btn btn-secondary" id="vehicleRefreshBtn">
                    ↻ Refresh
                </button>
            </div>

            <form id="vehicleEntryForm" class="vehicle-form">
                <h3>Register Vehicle Entry</h3>

                <div class="form-grid">
                    <label>
                        Vehicle Number
                        <input id="vehicleNumber" required
                            placeholder="KA13AB1234">
                    </label>

                    <label>
                        Owner Name
                        <input id="ownerName" required
                            placeholder="Enter owner name">
                    </label>

                    <label>
                        Vehicle Type
                        <select id="vehicleType" required>
                            <option value="">Select type</option>
                            <option value="BIKE">Bike</option>
                            <option value="CAR">Car</option>
                            <option value="BUS">Bus</option>
                        </select>
                    </label>
                </div>

                <button type="submit" class="btn btn-primary">
                    + Register and Park Vehicle
                </button>
            </form>
        </section>

        <section class="panel">
            <div class="panel-header">
                <div>
                    <span class="section-label">LIVE MONITORING</span>
                    <h2>Currently Parked Vehicles</h2>
                    <p>Manage active parking sessions and process vehicle exits.</p>
                </div>
                <span id="vehicleCount">0 vehicles</span>
            </div>

            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Vehicle Number</th>
                            <th>Owner</th>
                            <th>Type</th>
                            <th>Slot</th>
                            <th>Entry Time</th>
                            <th>Status</th>
                            <th>Operation</th>
                        </tr>
                    </thead>

                    <tbody id="vehiclesTableBody">
                        <tr>
                            <td colspan="7">Loading vehicles...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    `;

    document.getElementById("vehicleEntryForm")
        .addEventListener("submit", handleVehicleEntry);

    document.getElementById("vehicleRefreshBtn")
        .addEventListener("click", loadVehiclesPage);

    // Event delegation for exit buttons
    document.getElementById("vehiclesTableBody")
        .addEventListener("click", async (event) => {
            const button = event.target.closest(".vehicle-exit-btn");

            if (!button) return;

                const selectedVehicle = vehiclesCache.find(
                    vehicle => vehicle.vehicleNumber === button.dataset.vehicle
                );

            if (selectedVehicle) {
                sessionStorage.setItem(
                "smartparkExitVehicle",
                JSON.stringify(selectedVehicle)
                );

                window.location.href = "exit.html";
            }
        });

    loadVehiclesPage();
});


// VEHICLE ENTRY

async function handleVehicleEntry(event) {
    event.preventDefault();

    const vehicle = {
        vehicleNumber: document.getElementById("vehicleNumber")
            .value.trim().toUpperCase(),

        ownerName: document.getElementById("ownerName")
            .value.trim(),

        vehicleType: document.getElementById("vehicleType").value
    };

    try {
        const result = await SmartParkAPI.parkVehicle(vehicle);

        alert(result.message || "Vehicle parked successfully!");

        document.getElementById("vehicleEntryForm").reset();

        await refreshVehicleData();

    } catch (error) {
        alert("Vehicle entry failed:\n" + error.message);
    }
}





// LOAD ACTIVE VEHICLES

async function loadVehiclesPage() {
    const tbody = document.getElementById("vehiclesTableBody");

    if (!tbody) return;

    tbody.innerHTML =
        `<tr><td colspan="7">Loading vehicles...</td></tr>`;

    try {
        const vehicles = await SmartParkAPI.getActiveVehicles();
        vehiclesCache = vehicles;

        document.getElementById("vehicleCount").textContent =
            `${vehicles.length} active vehicles`;

        if (!vehicles.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        No vehicles are currently parked.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = "";

        vehicles.forEach(vehicle => {
            const row = document.createElement("tr");

            const values = [
                vehicle.vehicleNumber || "-",
                vehicle.ownerName || "-",
                vehicle.vehicleType || "-",
                vehicle.slotNumber ?? "-",
                vehicle.entryTime
                    ? new Date(vehicle.entryTime).toLocaleString()
                    : "-",
                vehicle.status || "ACTIVE"
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            const actionCell = document.createElement("td");

            const exitButton = document.createElement("button");

            exitButton.className = "btn btn-primary vehicle-exit-btn";
            exitButton.textContent = "Exit Vehicle";
            exitButton.dataset.vehicle = vehicle.vehicleNumber;

            actionCell.appendChild(exitButton);
            row.appendChild(actionCell);

            tbody.appendChild(row);
        });

        

    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    Unable to load vehicles: ${error.message}
                </td>
            </tr>
        `;
    }
}


// REFRESH DASHBOARD AND VEHICLE DATA

async function refreshVehicleData() {
    await loadVehiclesPage();

    if (typeof loadDashboard === "function") {
        await loadDashboard();
    }
}
