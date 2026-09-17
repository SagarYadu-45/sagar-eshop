package com.sagar.sagareeshop.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sagar.sagareeshop.entity.Order;
import com.sagar.sagareeshop.entity.OrderItem;
import com.sagar.sagareeshop.entity.OrderReturn;
import com.sagar.sagareeshop.service.OrderService;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody Order order) {
        try {
            return ResponseEntity.ok(orderService.placeOrder(order));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unable to place order");
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getOrdersByUserId(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(orderService.getOrdersByUserId(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unable to load user orders");
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllOrders() {
        try {
            return ResponseEntity.ok(orderService.getAllOrders());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unable to load orders");
        }
    }

    @GetMapping("/{orderId}/items")
    public ResponseEntity<?> getOrderItems(@PathVariable Long orderId) {
        try {
            List<OrderItem> items = orderService.getOrderItems(orderId);
            return ResponseEntity.ok(items);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unable to load order items");
        }
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> request) {
        try {
            return ResponseEntity.ok(
                    orderService.updateOrderStatus(orderId, request.get("status")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unable to update order status");
        }
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(
            @PathVariable Long orderId,
            @RequestBody Map<String, Object> request) {
        try {
            Object userIdObject = request.get("userId");
            if (userIdObject == null) {
                return ResponseEntity.badRequest().body("User ID is required");
            }

            Long userId = Long.valueOf(String.valueOf(userIdObject));
            String reason = request.get("reason") == null
                    ? null
                    : String.valueOf(request.get("reason"));

            Order cancelledOrder = orderService.cancelOrder(orderId, userId, reason);
            return ResponseEntity.ok(cancelledOrder);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unable to cancel order");
        }
    }

    @PostMapping("/{orderId}/return")
    public ResponseEntity<?> returnOrder(
            @PathVariable Long orderId,
            @RequestBody Map<String, Object> request) {
        try {
            Object userIdObject = request.get("userId");
            if (userIdObject == null) {
                return ResponseEntity.badRequest().body("User ID is required");
            }

            Long userId = Long.valueOf(String.valueOf(userIdObject));
            String reason = request.get("reason") == null
                    ? null
                    : String.valueOf(request.get("reason"));

            OrderReturn orderReturn = orderService.returnOrder(orderId, userId, reason);
            return ResponseEntity.ok(orderReturn);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unable to create return request");
        }
    }

    @GetMapping("/{orderId}/return")
    public ResponseEntity<?> getReturnRequest(@PathVariable Long orderId) {
        try {
            return ResponseEntity.ok(orderService.getReturnRequest(orderId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unable to load return request");
        }
    }

    @GetMapping("/returns")
    public ResponseEntity<?> getAllReturnRequests() {
        try {
            List<OrderReturn> returns = orderService.getAllReturnRequests();
            return ResponseEntity.ok(returns);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unable to load return requests");
        }
    }

    @PutMapping("/returns/{returnId}/status")
    public ResponseEntity<?> updateReturnStatus(
            @PathVariable Long returnId,
            @RequestBody Map<String, String> request) {
        try {
            return ResponseEntity.ok(
                    orderService.updateReturnStatus(returnId, request.get("status")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unable to update return status");
        }
    }
}
