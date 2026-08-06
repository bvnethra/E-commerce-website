package com.aura.ecommerce.controller;

import com.aura.ecommerce.model.Product;
import com.aura.ecommerce.repository.ProductRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@Tag(name = "Product Catalog", description = "Endpoints for browsing products, variants, and stock information")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    @Operation(summary = "Get all products", description = "Retrieves a listing of all available products with categories and brands")
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID", description = "Retrieves detailed product metadata, inventory, and images by product ID")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get product by slug", description = "Retrieves product info by its unique URL slug")
    public ResponseEntity<Product> getProductBySlug(@PathVariable String slug) {
        return productRepository.findBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Get products by Category ID", description = "Filter products by their category identification code")
    public List<Product> getProductsByCategory(@PathVariable Long categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }
}
