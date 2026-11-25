package com.smartparking.smart_parking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.smartparking.smart_parking.entity.ParkingSlot;
import java.util.List;

public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Integer> {

    List<ParkingSlot> findByStatus(String status);

}