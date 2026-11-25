
package com.smartparking.smart_parking.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartparking.smart_parking.entity.Vehicle;
import com.smartparking.smart_parking.entity.ParkingSlot;
import com.smartparking.smart_parking.entity.ParkingRecord;

import com.smartparking.smart_parking.repository.VehicleRepository;
import com.smartparking.smart_parking.repository.ParkingSlotRepository;
import com.smartparking.smart_parking.repository.ParkingRecordRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.Map;

import com.smartparking.smart_parking.entity.Payment;
import com.smartparking.smart_parking.repository.PaymentRepository;

@Service
public class ParkingService {

    private final VehicleRepository vehicleRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final ParkingRecordRepository parkingRecordRepository;
    private final PaymentRepository paymentRepository;

    public ParkingService(
            VehicleRepository vehicleRepository,
            ParkingSlotRepository parkingSlotRepository,
            ParkingRecordRepository parkingRecordRepository,
            PaymentRepository paymentRepository) {

        this.vehicleRepository = vehicleRepository;
        this.parkingSlotRepository = parkingSlotRepository;
        this.parkingRecordRepository = parkingRecordRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public ParkingRecord parkVehicle(
            String vehicleNumber,
            String ownerName,
            String vehicleType) {

        vehicleNumber = vehicleNumber.trim().toUpperCase();
        ownerName = ownerName.trim();
        vehicleType = vehicleType.trim().toUpperCase();

        // Validate vehicle details
        if (vehicleNumber.isEmpty() || ownerName.isEmpty()) {
            throw new IllegalArgumentException(
                    "Vehicle number and owner name are required.");
        }

        if (!List.of("BIKE", "CAR", "BUS").contains(vehicleType)) {
            throw new IllegalArgumentException(
                    "Vehicle type must be BIKE, CAR or BUS.");
        }

        // Check permanent duplicate vehicle registration
        if (vehicleRepository.existsByVehicleNumber(vehicleNumber)) {
            throw new IllegalArgumentException(
                    "This vehicle number is already registered.");
        }

        // Find an available parking slot
        List<ParkingSlot> availableSlots =
                parkingSlotRepository.findByStatus("AVAILABLE");

        if (availableSlots.isEmpty()) {
            throw new IllegalStateException(
                    "Parking is full. No available slots.");
        }

        // Select the first available slot
        ParkingSlot slot = availableSlots.get(0);

        // Register vehicle permanently
        Vehicle vehicle = new Vehicle(
                vehicleNumber,
                ownerName,
                vehicleType
        );

        vehicleRepository.save(vehicle);

        // Update slot status
        slot.setStatus("OCCUPIED");
        slot.setVehicleNumber(vehicleNumber);

        parkingSlotRepository.save(slot);

        // Create parking record
        ParkingRecord record = new ParkingRecord();

        record.setVehicleNumber(vehicleNumber);
        record.setOwnerName(ownerName);
        record.setVehicleType(vehicleType);
        record.setSlotNumber(slot.getSlotNumber());
        record.setEntryTime(LocalDateTime.now());
        record.setStatus("ACTIVE");
        record.setParkingFee(java.math.BigDecimal.ZERO);

        return parkingRecordRepository.save(record);
    }


@Transactional
public Map<String, Object> exitVehicle(
        String vehicleNumber,
        String paymentMethod) {

    vehicleNumber = vehicleNumber.trim().toUpperCase();

    if (paymentMethod == null || paymentMethod.isBlank()) {
        throw new IllegalArgumentException("Payment method is required.");
    }

    String method = paymentMethod.trim();

    if (!List.of("CASH", "UPI", "CARD").contains(method.toUpperCase())) {
        throw new IllegalArgumentException(
                "Payment method must be CASH, UPI or CARD.");
    }

    // Find the active parking record
    ParkingRecord record = parkingRecordRepository
            .findByVehicleNumber(vehicleNumber)
            .stream()
            .filter(r -> "ACTIVE".equalsIgnoreCase(r.getStatus()))
            .findFirst()
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "No active parking record found for this vehicle."));

    LocalDateTime exitTime = LocalDateTime.now();

    // Calculate parking duration
    long minutes = Duration.between(
            record.getEntryTime(), exitTime).toMinutes();

    long hours = Math.max(1, (long) Math.ceil(minutes / 60.0));

    // Calculate fee based on vehicle type
    BigDecimal hourlyRate;

    switch (record.getVehicleType().toUpperCase()) {
        case "BIKE":
            hourlyRate = BigDecimal.valueOf(10);
            break;
        case "CAR":
            hourlyRate = BigDecimal.valueOf(20);
            break;
        case "BUS":
            hourlyRate = BigDecimal.valueOf(40);
            break;
        default:
            throw new IllegalStateException("Invalid vehicle type.");
    }

    BigDecimal fee = hourlyRate.multiply(BigDecimal.valueOf(hours))
            .setScale(2, RoundingMode.HALF_UP);

    // Update parking record
    record.setExitTime(exitTime);
    record.setParkingFee(fee);
    record.setStatus("COMPLETED");

    parkingRecordRepository.save(record);

    // Release the parking slot
    ParkingSlot slot = parkingSlotRepository.findById(record.getSlotNumber())
            .orElseThrow(() ->
                    new IllegalStateException("Parking slot not found."));

    slot.setStatus("AVAILABLE");
    slot.setVehicleNumber(null);

    parkingSlotRepository.save(slot);

    // Save payment record
    Payment payment = new Payment();

    payment.setRecordId(record.getRecordId());
    payment.setAmount(fee);
    payment.setPaymentMethod(method.toUpperCase());
    payment.setPaymentStatus("SUCCESS");
    payment.setPaymentTime(exitTime);

    paymentRepository.save(payment);

    
                Map<String, Object> response = new java.util.HashMap<>();

                response.put("message", "Vehicle exited successfully!");
                response.put("vehicleNumber", vehicleNumber);
                response.put("ownerName", record.getOwnerName());
                response.put("vehicleType", record.getVehicleType());
                response.put("slotNumber", record.getSlotNumber());
                response.put("entryTime", record.getEntryTime());
                response.put("exitTime", exitTime);
                response.put("parkingHours", hours);
                response.put("parkingFee", fee);
                response.put("paymentMethod", paymentMethod);
                response.put("paymentStatus", "SUCCESS");

        return response;

}

// Get parking dashboard statistics
public Map<String, Object> getDashboardSummary() {

    long totalSlots = parkingSlotRepository.count();

    long availableSlots =
            parkingSlotRepository.findByStatus("AVAILABLE").size();

    long occupiedSlots =
            parkingSlotRepository.findByStatus("OCCUPIED").size();

    long activeVehicles =
            parkingRecordRepository.findByStatus("ACTIVE").size();

    Map<String, Object> summary = new java.util.HashMap<>();

    summary.put("totalSlots", totalSlots);
    summary.put("availableSlots", availableSlots);
    summary.put("occupiedSlots", occupiedSlots);
    summary.put("activeVehicles", activeVehicles);

    return summary;
}

// Get currently parked vehicles
public List<ParkingRecord> getActiveVehicles() {

    return parkingRecordRepository.findByStatus("ACTIVE");
}

public List<ParkingRecord> getParkingHistory() {

    return parkingRecordRepository.findAll(
            org.springframework.data.domain.Sort
                    .by(org.springframework.data.domain.Sort.Direction.DESC,
                            "recordId")
    );
}

public List<Payment> getPaymentHistory() {

    return paymentRepository.findAll(
            org.springframework.data.domain.Sort
                    .by(org.springframework.data.domain.Sort.Direction.DESC,
                            "paymentId")
    );
}

public List<ParkingSlot> getAllParkingSlots() {

    return parkingSlotRepository.findAll(
            org.springframework.data.domain.Sort
                    .by(org.springframework.data.domain.Sort.Direction.ASC,
                            "slotNumber")
    );
}

}
