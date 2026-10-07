package com.nutrilift.config;

import com.nutrilift.dto.RegisterRequest;
import com.nutrilift.repository.UserRepository;
import com.nutrilift.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final AuthService authService;

    public DataSeeder(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("demo@nutrilift.com")) {
            RegisterRequest req = new RegisterRequest();
            req.setEmail("demo@nutrilift.com");
            req.setPassword("password123");
            req.setFullName("Aarav Patel");
            req.setAge(26);
            req.setGender("MALE");
            req.setHeightCm(178);
            req.setWeightKg(BigDecimal.valueOf(72.0));
            req.setActivityLevel("MODERATE");

            authService.register(req);
            log.info("[NutriLift] Automatically provisioned demo user: demo@nutrilift.com");
        }
    }
}
