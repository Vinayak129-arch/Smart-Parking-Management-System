
document.addEventListener("DOMContentLoaded", async () => {
    console.log("SmartPark 360 initialized.");

    const connectionStatus = document.getElementById(
        "connectionStatus"
    );

    try {
        await SmartParkAPI.health();

        if (connectionStatus) {
            connectionStatus.textContent = "System Online";
        }

        await loadDashboard();
        await loadAdvancedAnalytics();

        setInterval(async () => {
            await loadDashboard();
            await loadAdvancedAnalytics();
        }, 15000);

    } catch (error) {
        console.error("Backend connection error:", error);

        if (connectionStatus) {
            connectionStatus.textContent = "Backend Offline";
        }
    }

    if (typeof initializeParkingActions === "function") {
        initializeParkingActions();
    }
});
