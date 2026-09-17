package com.sagar.sagareeshop.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.sagar.sagareeshop.entity.Product;
import com.sagar.sagareeshop.service.ProductService;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(
            ProductService productService) {

        this.productService = productService;
    }

    // =========================
    // ADD PRODUCT
    // =========================
    @PostMapping(consumes = "multipart/form-data")
    public Product addProduct(
            @RequestPart("product")
            Product product,

            @RequestPart(value = "image", required = false)
            MultipartFile image) {

        return productService.addProduct(
                product,
                image
        );
    }

    // =========================
    // GET ALL PRODUCTS
    // =========================
    @GetMapping
    public List<Product> getAllProducts() {

        return productService.getAllProducts();
    }

    // =========================
    // GET PRODUCT BY ID
    // =========================
    @GetMapping("/{id}")
    public Product getProductById(
            @PathVariable Long id) {

        return productService.getProductById(id);
    }

    // =========================
    // UPDATE PRODUCT
    // =========================
    @PutMapping(
            value = "/{id}",
            consumes = "multipart/form-data"
    )
    public Product updateProduct(
            @PathVariable Long id,

            @RequestPart("product")
            Product product,

            @RequestPart(
                    value = "image",
                    required = false
            )
            MultipartFile image) {

        return productService.updateProduct(
                id,
                product,
                image
        );
    }

    // =========================
    // DELETE PRODUCT
    // =========================
    @DeleteMapping("/{id}")
    public String deleteProduct(
            @PathVariable Long id) {

        productService.deleteProduct(id);

        return "Product deleted successfully";
    }
}