package com.aura.ecommerce.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "shipments")
@Getter
@Setter
@NoArgsConstructor
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @NotBlank
    @Size(max = 100)
    @Column(name = "shipping_method", nullable = false)
    private String shippingMethod;

    @Size(max = 100)
    @Column(name = "tracking_number", unique = true)
    private String trackingNumber;

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false)
    private String status = "PENDING"; // e.g. PENDING, SHIPPED, DELIVERED, CANCELLED

    @Column(name = "shipped_at")
    private LocalDateTime shippedAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Shipment(Order order, String shippingMethod, String trackingNumber, String status) {
        this.order = order;
        this.shippingMethod = shippingMethod;
        this.trackingNumber = trackingNumber;
        this.status = status;
    }
}
