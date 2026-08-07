package com.aura.ecommerce.controller;

import com.aura.ecommerce.model.Banner;
import com.aura.ecommerce.repository.BannerRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/banners")
@Tag(name = "Home Banners", description = "Endpoints for retrieving active marketing banners and links")
public class BannerController {

    @Autowired
    private BannerRepository bannerRepository;

    @GetMapping
    @Operation(summary = "Get active banners", description = "Retrieves active marketing banners ordered by display position")
    public List<Banner> getActiveBanners() {
        return bannerRepository.findByIsActiveTrueOrderByPositionAsc();
    }
}
