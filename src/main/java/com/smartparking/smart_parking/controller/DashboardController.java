
package com.smartparking.smart_parking.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smartparking.smart_parking.entity.ParkingRecord;
import com.smartparking.smart_parking.entity.ParkingSlot;
import com.smartparking.smart_parking.service.ParkingService;
import com.smartparking.smart_parking.entity.Payment;


@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final ParkingService parkingService;

    public DashboardController(ParkingService parkingService) {
        this.parkingService = parkingService;
    }

    // Dashboard statistics
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {

        return ResponseEntity.ok(
                parkingService.getDashboardSummary()
        );
    }

    // Currently parked vehicles
    @GetMapping("/active-vehicles")
    public ResponseEntity<List<ParkingRecord>> getActiveVehicles() {

        return ResponseEntity.ok(
                parkingService.getActiveVehicles()
        );
    }

@GetMapping("/parking-history")
public ResponseEntity<List<ParkingRecord>> getParkingHistory() {

    return ResponseEntity.ok(
            parkingService.getParkingHistory()
    );
}

@GetMapping("/payment-history")
public ResponseEntity<List<Payment>> getPaymentHistory() {

    return ResponseEntity.ok(
            parkingService.getPaymentHistory()
    );
}

@GetMapping("/slots")
public ResponseEntity<List<ParkingSlot>> getAllParkingSlots() {

    return ResponseEntity.ok(
            parkingService.getAllParkingSlots()
    );
}



}
