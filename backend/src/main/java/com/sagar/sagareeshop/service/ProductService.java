package com.sagar.sagareeshop.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.sagar.sagareeshop.entity.Product;
import com.sagar.sagareeshop.repository.ProductRepository;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    private final String uploadDir = "uploads/";

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // =========================
    // ADD PRODUCT
    // =========================
    public Product addProduct(Product product, MultipartFile image) {

        try {

            Path uploadPath = Paths.get(uploadDir);

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            if (image != null && !image.isEmpty()) {

                String originalFileName =
                        image.getOriginalFilename();

                String fileExtension = "";

                if (originalFileName != null
                        && originalFileName.contains(".")) {

                    fileExtension =
                            originalFileName.substring(
                                    originalFileName.lastIndexOf(".")
                            );
                }

                String fileName =
                        UUID.randomUUID() + fileExtension;

                Path filePath =
                        uploadPath.resolve(fileName);

                Files.copy(
                        image.getInputStream(),
                        filePath,
                        StandardCopyOption.REPLACE_EXISTING
                );

                product.setImage(fileName);
            }

            return productRepository.save(product);

        } catch (IOException e) {

            throw new RuntimeException(
                    "Image upload failed",
                    e
            );
        }
    }

    // =========================
    // GET ALL PRODUCTS
    // =========================
    public List<Product> getAllProducts() {

        return productRepository.findAll();
    }

    // =========================
    // GET PRODUCT BY ID
    // =========================
    public Product getProductById(Long id) {

        return productRepository
                .findById(id)
                .orElse(null);
    }

    // =========================
    // UPDATE PRODUCT
    // =========================
    public Product updateProduct(
            Long id,
            Product updatedProduct,
            MultipartFile image) {

        try {

            Product existingProduct =
                    productRepository
                            .findById(id)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Product not found: " + id
                                    )
                            );

            // Update basic information
            existingProduct.setName(
                    updatedProduct.getName()
            );

            existingProduct.setPrice(
                    updatedProduct.getPrice()
            );

            existingProduct.setDescription(
                    updatedProduct.getDescription()
            );

            existingProduct.setQuantity(
                    updatedProduct.getQuantity()
            );

            // =========================
            // UPDATE IMAGE
            // =========================
            if (image != null && !image.isEmpty()) {

                Path uploadPath =
                        Paths.get(uploadDir);

                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }

                // Delete old image
                String oldImage =
                        existingProduct.getImage();

                if (oldImage != null
                        && !oldImage.isBlank()) {

                    try {

                        Path oldImagePath =
                                uploadPath.resolve(oldImage);

                        Files.deleteIfExists(
                                oldImagePath
                        );

                    } catch (Exception e) {

                        System.out.println(
                                "Old image delete failed: "
                                        + e.getMessage()
                        );
                    }
                }

                // Generate new image name
                String originalFileName =
                        image.getOriginalFilename();

                String fileExtension = "";

                if (originalFileName != null
                        && originalFileName.contains(".")) {

                    fileExtension =
                            originalFileName.substring(
                                    originalFileName.lastIndexOf(".")
                            );
                }

                String newFileName =
                        UUID.randomUUID()
                                + fileExtension;

                Path newFilePath =
                        uploadPath.resolve(newFileName);

                Files.copy(
                        image.getInputStream(),
                        newFilePath,
                        StandardCopyOption.REPLACE_EXISTING
                );

                existingProduct.setImage(
                        newFileName
                );
            }

            return productRepository.save(
                    existingProduct
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Product update failed",
                    e
            );
        }
    }

    // =========================
    // DELETE PRODUCT
    // =========================
    public void deleteProduct(Long id) {

        try {

            Product product =
                    productRepository
                            .findById(id)
                            .orElse(null);

            if (product == null) {
                throw new RuntimeException(
                        "Product not found: " + id
                );
            }

            // Delete image from uploads folder
            String imageName =
                    product.getImage();

            if (imageName != null
                    && !imageName.isBlank()) {

                Path imagePath =
                        Paths.get(uploadDir)
                                .resolve(imageName);

                Files.deleteIfExists(imagePath);
            }

            // Delete product from database
            productRepository.deleteById(id);

        } catch (IOException e) {

            throw new RuntimeException(
                    "Product delete failed",
                    e
            );
        }
    }
}