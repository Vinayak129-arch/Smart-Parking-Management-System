
package com.smartparking.smart_parking.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smartparking.smart_parking.entity.ParkingRecord;
import com.smartparking.smart_parking.service.ParkingService;

import java.util.Map;

@RestController
@RequestMapping("/api/parking")
@CrossOrigin(origins = "*")
public class ParkingController {

    private final ParkingService parkingService;

    public ParkingController(ParkingService parkingService) {
        this.parkingService = parkingService;
    }

    // Park a vehicle
    @PostMapping("/park")
    public ResponseEntity<?> parkVehicle(@RequestBody Map<String, String> request) {

        try {
            String vehicleNumber = request.get("vehicleNumber");
            String ownerName = request.get("ownerName");
            String vehicleType = request.get("vehicleType");

            ParkingRecord record = parkingService.parkVehicle(
                    vehicleNumber,
                    ownerName,
                    vehicleType
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    Map.of(
                            "message", "Vehicle parked successfully!",
                            "vehicleNumber", record.getVehicleNumber(),
                            "ownerName", record.getOwnerName(),
                            "vehicleType", record.getVehicleType(),
                            "slotNumber", record.getSlotNumber(),
                            "entryTime", record.getEntryTime(),
                            "status", record.getStatus()
                    )
            );

        } catch (IllegalArgumentException | IllegalStateException e) {

            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage())
            );

        } catch (Exception e) {

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    Map.of("error", "Unable to park vehicle.")
            );
        }
    }


@PostMapping("/exit")
public ResponseEntity<?> exitVehicle(
        @RequestBody Map<String, String> request) {

    try {
        String vehicleNumber = request.get("vehicleNumber");
        String paymentMethod = request.get("paymentMethod");

        if (vehicleNumber == null || vehicleNumber.isBlank()) {
            throw new IllegalArgumentException(
                    "Vehicle number is required.");
        }

        Map<String, Object> result =
                parkingService.exitVehicle(vehicleNumber, paymentMethod);

        return ResponseEntity.ok(result);

    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(
                Map.of("error", e.getMessage()));

    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("error", "Unable to process vehicle exit."));
    }
}

}
