package com.aura.ecommerce.controller;

import com.aura.ecommerce.model.Notification;
import com.aura.ecommerce.repository.NotificationRepository;
import com.aura.ecommerce.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Customer Notifications", description = "Endpoints for retrieving notifications lists")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    @Operation(summary = "Get user notifications", description = "Get notifications list mapped to active user session")
    public ResponseEntity<List<Notification>> getNotifications(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(notificationRepository.findByUserIdOrderByCreatedAtDesc(userPrincipal.getId()));
    }
}
