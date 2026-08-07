package com.aura.ecommerce.controller;

import com.aura.ecommerce.model.Order;
import com.aura.ecommerce.repository.OrderRepository;
import com.aura.ecommerce.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@Tag(name = "Order Tracking & History", description = "Endpoints for managing client checkout orders and details")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping
    @Operation(summary = "Get user order history", description = "Retrieves active user's order lists history")
    public ResponseEntity<List<Order>> getOrders(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(orderRepository.findByUserId(userPrincipal.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order details", description = "Retrieves items details mapping to an order id")
    public ResponseEntity<Order> getOrderById(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                             @PathVariable Long id) {
        if (userPrincipal == null) return ResponseEntity.status(401).build();
        return orderRepository.findById(id)
                .map(order -> {
                    if (!order.getUser().getId().equals(userPrincipal.getId())) {
                        return ResponseEntity.status(403).<Order>build();
                    }
                    return ResponseEntity.ok(order);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
