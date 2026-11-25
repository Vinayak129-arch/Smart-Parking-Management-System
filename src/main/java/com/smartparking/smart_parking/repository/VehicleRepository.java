package com.smartparking.smart_parking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.smartparking.smart_parking.entity.Vehicle;

public interface VehicleRepository extends JpaRepository<Vehicle, String> {

    boolean existsByVehicleNumber(String vehicleNumber);

}