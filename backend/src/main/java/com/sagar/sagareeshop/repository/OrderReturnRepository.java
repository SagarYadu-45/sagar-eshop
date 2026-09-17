
package com.sagar.sagareeshop.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sagar.sagareeshop.entity.OrderReturn;

public interface OrderReturnRepository extends JpaRepository<OrderReturn, Long> {

    Optional<OrderReturn> findByOrderId(Long orderId);

    List<OrderReturn> findAllByOrderByIdDesc();
}

