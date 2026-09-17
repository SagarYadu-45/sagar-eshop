package com.sagar.sagareeshop.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sagar.sagareeshop.entity.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);
}