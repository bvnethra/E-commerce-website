package com.aura.ecommerce.controller;

import com.aura.ecommerce.model.Coupon;
import com.aura.ecommerce.repository.CouponRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@Tag(name = "Coupons & Offers", description = "Endpoints for retrieving active store promotional coupons")
public class CouponController {

    @Autowired
    private CouponRepository couponRepository;

    @GetMapping
    @Operation(summary = "Get all coupons", description = "Get list of available discount coupons")
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Get coupon by code", description = "Find discount details by coupon code")
    public ResponseEntity<Coupon> getCouponByCode(@PathVariable String code) {
        return couponRepository.findByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
