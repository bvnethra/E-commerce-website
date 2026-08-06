package com.aura.ecommerce.controller;

import com.aura.ecommerce.model.Cart;
import com.aura.ecommerce.model.CartItem;
import com.aura.ecommerce.model.Product;
import com.aura.ecommerce.model.User;
import com.aura.ecommerce.repository.CartItemRepository;
import com.aura.ecommerce.repository.CartRepository;
import com.aura.ecommerce.repository.ProductRepository;
import com.aura.ecommerce.repository.UserRepository;
import com.aura.ecommerce.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/cart")
@Tag(name = "Shopping Cart", description = "Endpoints for managing items in a customer shopping bag")
public class CartController {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    @Operation(summary = "Get user cart", description = "Retrieves active user's cart and list of added items")
    public ResponseEntity<Cart> getCart(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) return ResponseEntity.status(401).build();
        
        Cart cart = cartRepository.findByUserId(userPrincipal.getId())
                .orElseGet(() -> {
                    User user = userRepository.findById(userPrincipal.getId()).orElseThrow();
                    Cart newCart = new Cart(user);
                    return cartRepository.save(newCart);
                });
                
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/items")
    @Operation(summary = "Add item to cart", description = "Adds a product variant to the customer cart")
    public ResponseEntity<?> addItemToCart(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                           @RequestParam Long productId,
                                           @RequestParam Integer quantity) {
        if (userPrincipal == null) return ResponseEntity.status(401).build();
        if (quantity <= 0) return ResponseEntity.badRequest().body("Quantity must be positive");

        Cart cart = cartRepository.findByUserId(userPrincipal.getId())
                .orElseGet(() -> {
                    User user = userRepository.findById(userPrincipal.getId()).orElseThrow();
                    Cart newCart = new Cart(user);
                    return cartRepository.save(newCart);
                });

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Optional<CartItem> existingItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId);

        CartItem cartItem;
        if (existingItem.isPresent()) {
            cartItem = existingItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + quantity);
        } else {
            cartItem = new CartItem(cart, product, null, quantity);
        }

        cartItemRepository.save(cartItem);
        return ResponseEntity.ok("Item added to cart successfully");
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Remove item from cart", description = "Removes a product line from the customer cart")
    public ResponseEntity<?> removeItemFromCart(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                                @PathVariable Long productId) {
        if (userPrincipal == null) return ResponseEntity.status(401).build();

        Cart cart = cartRepository.findByUserId(userPrincipal.getId())
                .orElseThrow(() -> new RuntimeException("Cart not found"));

        cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .ifPresent(cartItemRepository::delete);

        return ResponseEntity.ok("Item removed from cart");
    }
}
