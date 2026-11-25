
const API_BASE = "";

async function apiRequest(endpoint, options = {}) {
    const config = {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);

        const text = await response.text();
        let data = {};

        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = { message: text };
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                data.error ||
                text ||
                `Request failed (${response.status})`
            );
        }

        return data;

    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

const SmartParkAPI = {
    health: () =>
        apiRequest("/api/health"),

    getSummary: () =>
        apiRequest("/api/dashboard/summary"),

    getSlots: () =>
        apiRequest("/api/dashboard/slots"),

    getActiveVehicles: () =>
        apiRequest("/api/dashboard/active-vehicles"),

    getParkingHistory: () =>
        apiRequest("/api/dashboard/parking-history"),

    getPaymentHistory: () =>
        apiRequest("/api/dashboard/payment-history"),

    parkVehicle: (vehicle) =>
        apiRequest("/api/parking/park", {
            method: "POST",
            body: JSON.stringify(vehicle)
        }),

    exitVehicle: (vehicle) =>
        apiRequest("/api/parking/exit", {
            method: "POST",
            body: JSON.stringify(vehicle)
        })
};

window.SmartParkAPI = SmartParkAPI;
