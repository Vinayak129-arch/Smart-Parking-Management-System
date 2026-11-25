
async function handleVehicleEntry() {
    const vehicleNumber = prompt("Enter vehicle registration number:");

    if (!vehicleNumber || !vehicleNumber.trim()) return;

    const ownerName = prompt("Enter vehicle owner's name:");

    if (!ownerName || !ownerName.trim()) return;

    const vehicleType = prompt(
        "Enter vehicle type:\nBIKE\nCAR\nBUS"
    );

    if (!vehicleType) return;

    const type = vehicleType.trim().toUpperCase();

    if (!["BIKE", "CAR", "BUS"].includes(type)) {
        alert("Invalid vehicle type. Enter BIKE, CAR, or BUS.");
        return;
    }

    try {
        const result = await SmartParkAPI.parkVehicle({
            vehicleNumber: vehicleNumber.trim().toUpperCase(),
            ownerName: ownerName.trim(),
            vehicleType: type
        });

        alert(
            result.message ||
            `Vehicle ${vehicleNumber.toUpperCase()} registered successfully!`
        );

        await loadDashboard();

    } catch (error) {
        alert(`Vehicle entry failed:\n${error.message}`);
    }
}

async function handleVehicleExit() {
    const vehicleNumber = prompt(
        "Enter vehicle registration number for exit:"
    );

    if (!vehicleNumber || !vehicleNumber.trim()) return;

    const paymentMethod = prompt(
        "Select payment method:\nCASH\nUPI\nCARD"
    );

    if (!paymentMethod || !paymentMethod.trim()) return;

    const method = paymentMethod.trim().toUpperCase();

    if (!["CASH", "UPI", "CARD"].includes(method)) {
        alert("Invalid payment method.");
        return;
    }

    try {
        const result = await SmartParkAPI.exitVehicle({
            vehicleNumber: vehicleNumber.trim().toUpperCase(),
            paymentMethod: method
        });

        const details = [
            "VEHICLE EXIT SUCCESSFUL",
            "------------------------------",
            `Vehicle: ${result.vehicleNumber ?? vehicleNumber}`,
            `Owner: ${result.ownerName ?? "-"}`,
            `Slot: ${result.slotNumber ?? "-"}`,
            `Parking Hours: ${result.parkingHours ?? "-"}`,
            `Parking Fee: ₹${result.parkingFee ?? "-"}`,
            `Payment: ${result.paymentMethod ?? method}`,
            `Status: ${result.paymentStatus ?? "SUCCESS"}`
        ].join("\n");

        alert(details);

        await loadDashboard();

    } catch (error) {
        alert(`Vehicle exit failed:\n${error.message}`);
    }
}

function initializeParkingActions() {
    const entryButtons = [
        "addVehicleBtn",
        "parkVehicleBtn"
    ];

    entryButtons.forEach(id => {
        const button = document.getElementById(id);

        if (button) {
            button.addEventListener("click", handleVehicleEntry);
        }
    });

    const exitButton = document.getElementById("exitVehicleBtn");

    if (exitButton) {
        exitButton.addEventListener("click", handleVehicleExit);
    }

    const slotsButton = document.getElementById("viewSlotsBtn");

    if (slotsButton) {
        slotsButton.addEventListener("click", () => {
            document.getElementById("slotPreview")?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        });
    }
}

window.initializeParkingActions = initializeParkingActions;
