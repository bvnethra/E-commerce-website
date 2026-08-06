package com.aura.ecommerce.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @CreationTimestamp
    @Column(name = "payment_date", nullable = false, updatable = false)
    private LocalDateTime paymentDate;

    @NotBlank
    @Size(max = 50)
    @Column(name = "payment_method", nullable = false)
    private String paymentMethod;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @NotBlank
    @Size(max = 30)
    @Column(nullable = false)
    private String status = "PENDING"; // e.g. PENDING, COMPLETED, FAILED, REFUNDED

    @Size(max = 100)
    @Column(name = "transaction_id", unique = true)
    private String transactionId;

    public Payment(Order order, String paymentMethod, BigDecimal amount, String status, String transactionId) {
        this.order = order;
        this.paymentMethod = paymentMethod;
        this.amount = amount;
        this.status = status;
        this.transactionId = transactionId;
    }
}
