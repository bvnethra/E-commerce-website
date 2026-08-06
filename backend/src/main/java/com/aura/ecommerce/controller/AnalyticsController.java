package com.aura.ecommerce.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@Tag(name = "Analytics & Reports", description = "Endpoints for retrieving administrative sales, revenues, and orders logs metadata")
public class AnalyticsController {

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get admin dashboard metrics", description = "Retrieves e-commerce total revenues, orders size, active users, and low stock values")
    public ResponseEntity<Map<String, Object>> getDashboardMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalRevenue", new BigDecimal("124850.00"));
        metrics.put("ordersCount", 412);
        metrics.put("activeUsers", 1430);
        metrics.put("lowStockCount", 3);
        
        // Mock sales history data
        int[] monthlySales = {12000, 15000, 18000, 14000, 22000, 26000};
        metrics.put("monthlySales", monthlySales);
        
        return ResponseEntity.ok(metrics);
    }
}
