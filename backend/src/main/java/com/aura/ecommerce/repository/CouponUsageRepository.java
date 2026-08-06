package com.aura.ecommerce.repository;

import com.aura.ecommerce.model.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {
    List<CouponUsage> findByUserId(Long userId);
    List<CouponUsage> findByCouponId(Long couponId);
    long countByUserIdAndCouponId(Long userId, Long couponId);
}
