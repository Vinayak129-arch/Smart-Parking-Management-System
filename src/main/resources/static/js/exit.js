
document.addEventListener("DOMContentLoaded", () => {
    const vehicleData = sessionStorage.getItem("smartparkExitVehicle");

    const message = document.getElementById("exitMessage");
    const form = document.getElementById("exitPaymentForm");

    if (!vehicleData) {
        message.hidden = false;
        message.textContent =
            "No vehicle was selected. Please return to Vehicle Operations and select a vehicle.";
        form.querySelector("button[type='submit']").disabled = true;
        return;
    }

    let vehicle;

    try {
        vehicle = JSON.parse(vehicleData);
    } catch {
        message.hidden = false;
        message.textContent = "Invalid vehicle information. Please select the vehicle again.";
        return;
    }

    document.getElementById("exitVehicleNumber").textContent =
        vehicle.vehicleNumber || "--";

    document.getElementById("exitVehicleType").textContent =
        vehicle.vehicleType || "Vehicle";

    document.getElementById("exitOwnerName").textContent =
        vehicle.ownerName || "--";

    document.getElementById("exitSlotNumber").textContent =
        vehicle.slotNumber ?? "--";

    document.getElementById("exitEntryTime").textContent =
        vehicle.entryTime
            ? new Date(vehicle.entryTime).toLocaleString()
            : "--";

    document.getElementById("exitPaymentForm")
        .addEventListener("submit", async event => {
            event.preventDefault();

            const paymentMethod = new FormData(form)
                .get("paymentMethod");

            const button = document.getElementById("confirmExitBtn");
            const status = document.getElementById("connectionStatus");

            button.disabled = true;
            button.textContent = "Processing Exit...";
            status.textContent = "Processing payment...";

            try {
                const result = await SmartParkAPI.exitVehicle({
                    vehicleNumber: vehicle.vehicleNumber,
                    paymentMethod: paymentMethod
                });

                if (
                    result.paymentStatus &&
                    String(result.paymentStatus).toUpperCase() !== "SUCCESS"
                ) {
                    throw new Error("Payment was not successful. Please contact the administrator.");
                }

                showReceipt(result, vehicle, paymentMethod);

                sessionStorage.removeItem("smartparkExitVehicle");

                status.textContent = "Exit completed successfully";

                if (typeof SmartParkAPI.getSlots === "function") {
                    // Dashboard and parking pages fetch fresh data when reopened.
                }

            } catch (error) {
                message.hidden = false;
                message.textContent = "Exit processing failed: " + error.message;

                button.disabled = false;
                button.textContent = "Retry Exit Processing";
                status.textContent = "Exit processing failed";
            }
        });

    document.getElementById("printReceiptBtn")
        .addEventListener("click", () => {
            window.print();
        });
});


function showReceipt(result, vehicle, paymentMethod) {
    const workspace = document.getElementById("exitWorkspace");
    const receiptSection = document.getElementById("receiptSection");
    const receiptContent = document.getElementById("receiptContent");

    const receiptFields = [
        ["Receipt / Record ID", result.recordId ?? "-"],
        ["Vehicle Number", result.vehicleNumber || vehicle.vehicleNumber],
        ["Owner Name", result.ownerName || vehicle.ownerName || "-"],
        ["Vehicle Type", result.vehicleType || vehicle.vehicleType || "-"],
        ["Parking Slot", result.slotNumber ?? vehicle.slotNumber ?? "-"],
        ["Entry Time", result.entryTime
            ? new Date(result.entryTime).toLocaleString()
            : vehicle.entryTime
                ? new Date(vehicle.entryTime).toLocaleString()
                : "-"],
        ["Exit Time", result.exitTime
            ? new Date(result.exitTime).toLocaleString()
            : "-"],
        ["Parking Duration", result.parkingHours != null
            ? `${result.parkingHours} hour(s)`
            : "-"],
        ["Payment Method", result.paymentMethod || paymentMethod],
        ["Payment Status", result.paymentStatus || "SUCCESS"]
    ];

    receiptContent.innerHTML = "";

    receiptFields.forEach(([label, value]) => {
        const row = document.createElement("div");
        row.className = "receipt-row";

        const heading = document.createElement("span");
        heading.textContent = label;

        const detail = document.createElement("strong");
        detail.textContent = value;

        row.append(heading, detail);
        receiptContent.appendChild(row);
    });

    const fee = document.createElement("div");
    fee.className = "receipt-total";

    const feeLabel = document.createElement("span");
    feeLabel.textContent = "TOTAL PARKING FEE";

    const feeValue = document.createElement("strong");
    feeValue.textContent =
        `₹${Number(result.parkingFee ?? 0).toFixed(2)}`;

    fee.append(feeLabel, feeValue);
    receiptContent.appendChild(fee);

    workspace.hidden = true;
    receiptSection.hidden = false;

    receiptSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}
