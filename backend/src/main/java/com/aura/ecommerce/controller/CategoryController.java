package com.aura.ecommerce.controller;

import com.aura.ecommerce.model.Category;
import com.aura.ecommerce.repository.CategoryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Product Categories", description = "Endpoints for retrieving categorizations mapping")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping
    @Operation(summary = "Get all categories", description = "Retrieves all categories mapping slug metadata")
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }
}
