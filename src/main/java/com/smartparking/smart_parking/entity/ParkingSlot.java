
package com.smartparking.smart_parking.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "parking_slots")
public class ParkingSlot {

    @Id
    @Column(name = "slot_number")
    private Integer slotNumber;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "vehicle_number", length = 20)
    private String vehicleNumber;

    public ParkingSlot() {
    }

    public ParkingSlot(Integer slotNumber, String status,
                       String vehicleNumber) {
        this.slotNumber = slotNumber;
        this.status = status;
        this.vehicleNumber = vehicleNumber;
    }

    public Integer getSlotNumber() {
        return slotNumber;
    }

    public void setSlotNumber(Integer slotNumber) {
        this.slotNumber = slotNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }
}
