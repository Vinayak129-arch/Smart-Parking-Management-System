package com.smartparking.smart_parking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.smartparking.smart_parking.entity.ParkingRecord;
import java.util.List;

public interface ParkingRecordRepository extends JpaRepository<ParkingRecord, Integer> {

    List<ParkingRecord> findByStatus(String status);

    List<ParkingRecord> findByVehicleNumber(String vehicleNumber);

}