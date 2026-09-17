package com.sagar.sagareeshop.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sagar.sagareeshop.entity.User;
import com.sagar.sagareeshop.security.JwtService;
import com.sagar.sagareeshop.service.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;

    public UserController(
            UserService userService,
            JwtService jwtService
    ) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(
            @RequestBody User user
    ) {

        try {

            User existingUser =
                    userService.findByEmail(
                            user.getEmail()
                    );

            if (existingUser != null) {

                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body("Email already registered");
            }

            userService.registerUser(user);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body("Registration successful");

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Registration failed");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(
            @RequestBody User user
    ) {

        try {

            User loggedInUser =
                    userService.loginUser(
                            user.getEmail(),
                            user.getPassword()
                    );

            if (loggedInUser == null) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid email or password");
            }

            // Generate JWT token
            String token =
                    jwtService.generateToken(
                            loggedInUser
                    );

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "token",
                    token
            );

            response.put(
                    "id",
                    loggedInUser.getId()
            );

            response.put(
                    "name",
                    loggedInUser.getName()
            );

            response.put(
                    "email",
                    loggedInUser.getEmail()
            );

            response.put(
                    "role",
                    loggedInUser.getRole()
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body("Login failed");
        }
    }
}