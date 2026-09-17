package com.sagar.sagareeshop.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sagar.sagareeshop.entity.Order;
import com.sagar.sagareeshop.entity.OrderItem;
import com.sagar.sagareeshop.entity.OrderReturn;
import com.sagar.sagareeshop.entity.Product;
import com.sagar.sagareeshop.entity.User;

import com.sagar.sagareeshop.repository.OrderItemRepository;
import com.sagar.sagareeshop.repository.OrderRepository;
import com.sagar.sagareeshop.repository.OrderReturnRepository;
import com.sagar.sagareeshop.repository.ProductRepository;
import com.sagar.sagareeshop.repository.UserRepository;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderReturnRepository orderReturnRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            OrderReturnRepository orderReturnRepository,
            ProductRepository productRepository,
            UserRepository userRepository) {

        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderReturnRepository = orderReturnRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    // =========================================================
    // PLACE ORDER
    // =========================================================

    @Transactional
    public Order placeOrder(Order order) {

        if (order == null) {
            throw new RuntimeException("Order data is required");
        }

        if (order.getUserId() == null) {
            throw new RuntimeException("User ID is required");
        }

        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new RuntimeException("Order items are required");
        }

        userRepository.findById(order.getUserId())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        if (order.getStatus() == null ||
                order.getStatus().isBlank()) {

            order.setStatus("PLACED");

        } else {

            order.setStatus(
                    order.getStatus()
                            .trim()
                            .toUpperCase()
            );
        }

        Order savedOrder =
                orderRepository.save(order);

        float calculatedTotal = 0.0f;

        for (OrderItem item : order.getItems()) {

            if (item == null) {
                throw new RuntimeException(
                        "Order item cannot be null");
            }

            if (item.getProductId() == null) {
                throw new RuntimeException(
                        "Product ID is required");
            }

            if (item.getQuantity() == null ||
                    item.getQuantity() <= 0) {

                throw new RuntimeException(
                        "Invalid product quantity");
            }

            Product product =
                    productRepository
                            .findById(item.getProductId())
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Product not found: "
                                                    + item.getProductId()));

            Integer availableStock =
                    product.getQuantity();

            if (availableStock == null) {
                availableStock = 0;
            }

            if (availableStock < item.getQuantity()) {

                throw new RuntimeException(
                        "Insufficient stock for product: "
                                + product.getName());
            }

            if (item.getPrice() == null) {
                item.setPrice(product.getPrice());
            }

            calculatedTotal +=
                    (float)
                    (item.getPrice()
                            * item.getQuantity());

            item.setOrderId(
                    savedOrder.getId());

            product.setQuantity(
                    availableStock
                            - item.getQuantity());

            productRepository.save(product);

            orderItemRepository.save(item);
        }

        savedOrder.setTotalAmount(
                calculatedTotal);

        return orderRepository.save(savedOrder);
    }

    // =========================================================
    // GET USER ORDERS
    // =========================================================

    public List<Order> getOrdersByUserId(
            Long userId) {

        if (userId == null) {
            throw new RuntimeException(
                    "User ID is required");
        }

        List<Order> orders =
                orderRepository.findByUserId(userId);

        for (Order order : orders) {

            order.setItems(
                    orderItemRepository
                            .findByOrderId(
                                    order.getId()));
        }

        return orders;
    }

    // =========================================================
    // GET ALL ORDERS
    // =========================================================

    public List<Order> getAllOrders() {

        List<Order> orders =
                orderRepository.findAll();

        for (Order order : orders) {

            order.setItems(
                    orderItemRepository
                            .findByOrderId(
                                    order.getId()));
        }

        return orders;
    }

    // =========================================================
    // GET ORDER ITEMS
    // =========================================================

    public List<OrderItem> getOrderItems(
            Long orderId) {

        if (orderId == null) {
            throw new RuntimeException(
                    "Order ID is required");
        }

        return orderItemRepository
                .findByOrderId(orderId);
    }

    // =========================================================
    // UPDATE ORDER STATUS
    // =========================================================

    @Transactional
    public Order updateOrderStatus(
            Long orderId,
            String status) {

        if (orderId == null) {
            throw new RuntimeException(
                    "Order ID is required");
        }

        if (status == null ||
                status.isBlank()) {

            throw new RuntimeException(
                    "Status is required");
        }

        Order order =
                orderRepository.findById(orderId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Order not found"));

        String newStatus =
                status.trim().toUpperCase();

        // Cancellation must use dedicated
        // cancelOrder() method.
        if ("CANCELLED".equals(newStatus)) {

            throw new RuntimeException(
                    "Use cancel order option to cancel an order");
        }

        order.setStatus(newStatus);

        if ("DELIVERED".equals(newStatus) && order.getDeliveredAt() == null) {
            order.setDeliveredAt(LocalDateTime.now());
        }

        return orderRepository.save(order);
    }

    // =========================================================
    // CANCEL ORDER
    // =========================================================

    @Transactional
    public Order cancelOrder(
            Long orderId,
            Long userId,
            String reason) {

        if (orderId == null) {
            throw new RuntimeException(
                    "Order ID is required");
        }

        if (userId == null) {
            throw new RuntimeException(
                    "User ID is required");
        }

        if (reason == null || reason.isBlank()) {
            throw new RuntimeException(
                    "Cancellation reason is required");
        }

        User user =
                userRepository.findById(userId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"));

        Order order =
                orderRepository.findById(orderId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Order not found"));

        boolean isAdmin =
                user.getRole() != null
                        && "ADMIN".equalsIgnoreCase(
                                user.getRole());

        // Normal USER can cancel only own order.
        if (!isAdmin
                && (order.getUserId() == null
                        || !order.getUserId()
                                .equals(userId))) {

            throw new RuntimeException(
                    "You are not allowed to cancel this order");
        }

        String status = order.getStatus();

        if (status == null ||
                status.isBlank()) {

            throw new RuntimeException(
                    "Order status is missing");
        }

        String currentStatus =
                status.trim().toUpperCase();

        if ("CANCELLED".equals(currentStatus)) {

            throw new RuntimeException(
                    "Order is already cancelled");
        }

        if ("SHIPPED".equals(currentStatus)
                || "DELIVERED".equals(currentStatus)
                || "RETURNED".equals(currentStatus)) {

            throw new RuntimeException(
                    "Order cannot be cancelled at this stage");
        }

        // Restore stock.
        List<OrderItem> items =
                orderItemRepository
                        .findByOrderId(orderId);

        for (OrderItem item : items) {

            if (item == null) {
                throw new RuntimeException(
                        "Order item cannot be null");
            }

            if (item.getProductId() == null) {
                continue;
            }

            Product product =
                    productRepository
                            .findById(
                                    item.getProductId())
                            .orElse(null);

            if (product == null) {
                continue;
            }

            Integer currentStock =
                    product.getQuantity();

            if (currentStock == null) {
                currentStock = 0;
            }

            Integer orderQuantity =
                    item.getQuantity();

            if (orderQuantity == null ||
                    orderQuantity <= 0) {

                continue;
            }

            product.setQuantity(
                    currentStock
                            + orderQuantity);

            productRepository.save(product);
        }

        order.setStatus("CANCELLED");

        return orderRepository.save(order);
    }

    // =========================================================
    // CREATE RETURN REQUEST
    // =========================================================

    @Transactional
    public OrderReturn returnOrder(
            Long orderId,
            Long userId,
            String reason) {

        if (orderId == null) {
            throw new RuntimeException(
                    "Order ID is required");
        }

        if (userId == null) {
            throw new RuntimeException(
                    "User ID is required");
        }

        Order order =
                orderRepository.findById(orderId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Order not found"));

        // Return can be requested only by
        // the owner of the order.
        if (order.getUserId() == null
                || !order.getUserId()
                        .equals(userId)) {

            throw new RuntimeException(
                    "You are not allowed to return this order");
        }

        // Only delivered orders can be returned.
        if (!"DELIVERED".equalsIgnoreCase(
                order.getStatus())) {

            throw new RuntimeException(
                    "Only delivered orders can be returned");
        }

        if (order.getDeliveredAt() == null) {
            throw new RuntimeException(
                    "Delivery date is not available for this order");
        }

        if (LocalDateTime.now().isAfter(order.getDeliveredAt().plusDays(7))) {
            throw new RuntimeException(
                    "Return period has expired. Returns are available only within 7 days of delivery");
        }

        if (reason == null ||
                reason.isBlank()) {

            throw new RuntimeException(
                    "Return reason is required");
        }

        OrderReturn existing =
                orderReturnRepository
                        .findByOrderId(orderId)
                        .orElse(null);

        if (existing != null) {

            throw new RuntimeException(
                    "Return request already exists");
        }

        OrderReturn orderReturn =
                new OrderReturn();

        orderReturn.setOrderId(orderId);
        orderReturn.setUserId(userId);
        orderReturn.setReason(reason.trim());
        orderReturn.setStatus("REQUESTED");
        orderReturn.setStockRestored(false);

        return orderReturnRepository
                .save(orderReturn);
    }

    // =========================================================
    // GET RETURN REQUEST FOR ONE ORDER
    // =========================================================

    public OrderReturn getReturnRequest(
            Long orderId) {

        if (orderId == null) {
            throw new RuntimeException(
                    "Order ID is required");
        }

        return orderReturnRepository
                .findByOrderId(orderId)
                .orElse(null);
    }

    // =========================================================
    // GET ALL RETURN REQUESTS
    // =========================================================

    public List<OrderReturn> getAllReturnRequests() {

        return orderReturnRepository
                .findAllByOrderByIdDesc();
    }

    // =========================================================
    // UPDATE RETURN STATUS
    // =========================================================

    @Transactional
    public OrderReturn updateReturnStatus(
            Long returnId,
            String status) {

        if (returnId == null) {
            throw new RuntimeException(
                    "Return ID is required");
        }

        if (status == null ||
                status.isBlank()) {

            throw new RuntimeException(
                    "Status is required");
        }

        OrderReturn orderReturn =
                orderReturnRepository
                        .findById(returnId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Return request not found"));

        String newStatus =
                status.trim().toUpperCase();

        // Only these statuses are allowed.
        if (!newStatus.equals("REQUESTED")
                && !newStatus.equals("APPROVED")
                && !newStatus.equals("REJECTED")
                && !newStatus.equals("COMPLETED")) {

            throw new RuntimeException(
                    "Invalid return status");
        }

        orderReturn.setStatus(newStatus);

        // Restore stock only once when
        // return is finally completed.
        if ("COMPLETED".equals(newStatus)
                && !orderReturn.isStockRestored()) {

            List<OrderItem> items =
                    orderItemRepository
                            .findByOrderId(
                                    orderReturn.getOrderId());

            for (OrderItem item : items) {

                if (item == null) {
                    throw new RuntimeException(
                            "Order item cannot be null");
                }

                if (item.getProductId() == null) {
                    continue;
                }

                Product product =
                        productRepository
                                .findById(
                                        item.getProductId())
                                .orElse(null);

                if (product == null) {
                    continue;
                }

                Integer currentStock =
                        product.getQuantity();

                if (currentStock == null) {
                    currentStock = 0;
                }

                Integer quantity =
                        item.getQuantity();

                if (quantity == null ||
                        quantity <= 0) {

                    continue;
                }

                product.setQuantity(
                        currentStock
                                + quantity);

                productRepository.save(product);
            }

            orderReturn.setStockRestored(true);

            Order order =
                    orderRepository
                            .findById(
                                    orderReturn.getOrderId())
                            .orElse(null);

            if (order != null) {

                order.setStatus("RETURNED");

                orderRepository.save(order);
            }
        }

        return orderReturnRepository
                .save(orderReturn);
    }
}