package com.smartparking.smart_parking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.smartparking.smart_parking.entity.Payment;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    List<Payment> findByRecordId(Integer recordId);

}