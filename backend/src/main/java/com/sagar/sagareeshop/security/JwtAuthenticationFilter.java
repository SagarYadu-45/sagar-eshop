package com.sagar.sagareeshop.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.sagar.sagareeshop.entity.User;
import com.sagar.sagareeshop.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// NOTE: intentionally NOT a @Component.
// If this were a @Component, Spring Boot would auto-register it as a
// generic servlet filter (outside Spring Security's own chain), and there
// would be no guarantee it runs before AuthorizationFilter decides
// permitAll()/hasRole() — which is exactly why everything looked like it
// needed permitAll() before. We instead build it by hand in SecurityConfig
// and place it precisely with addFilterBefore(...).
public class JwtAuthenticationFilter
        extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader =
                request.getHeader("Authorization");

        if (authHeader == null ||
                !authHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        String token =
                authHeader.substring(7);

        try {

            if (!jwtService.isTokenValid(token)) {

                filterChain.doFilter(request, response);
                return;
            }

            String email =
                    jwtService.extractUsername(token);

            if (email == null ||
                    SecurityContextHolder
                            .getContext()
                            .getAuthentication() != null) {

                filterChain.doFilter(request, response);
                return;
            }

            User user =
                    userRepository
                            .findByEmail(email)
                            .orElse(null);

            if (user == null) {

                filterChain.doFilter(request, response);
                return;
            }

            String role = user.getRole();

            if (role == null ||
                    role.trim().isEmpty()) {

                role = "USER";
            }

            SimpleGrantedAuthority authority =
                    new SimpleGrantedAuthority(
                            "ROLE_" + role.toUpperCase()
                    );

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            user.getEmail(),
                            null,
                            java.util.List.of(authority)
                    );

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(authentication);

        } catch (Exception e) {

            System.out.println(
                    "JWT validation failed: "
                            + e.getMessage()
            );
        }

        filterChain.doFilter(request, response);
    }
}