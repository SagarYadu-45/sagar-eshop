package com.sagar.sagareeshop.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sagar.sagareeshop.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {

}