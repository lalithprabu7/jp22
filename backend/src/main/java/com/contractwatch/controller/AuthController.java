package com.contractwatch.controller;

import com.contractwatch.config.JwtUtil;
import com.contractwatch.dto.AuthRequest;
import com.contractwatch.dto.AuthResponse;
import com.contractwatch.dto.RegisterRequest;
import com.contractwatch.entity.User;
import com.contractwatch.entity.UserRole;
import com.contractwatch.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
            final String token = jwtUtil.generateToken(userDetails);
            
            User user = userRepository.findByEmailIgnoreCase(request.getEmail()).orElseThrow();

            return ResponseEntity.ok(AuthResponse.builder()
                    .token(token)
                    .id(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Email already in use"));
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.ADMIN)
                .build();

        userRepository.save(user);

        final UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        final String token = jwtUtil.generateToken(userDetails);

        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build());
    }
}
