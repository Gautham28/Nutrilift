package com.nutrilift.service;

import com.nutrilift.config.JwtTokenProvider;
import com.nutrilift.dto.AuthResponse;
import com.nutrilift.dto.LoginRequest;
import com.nutrilift.dto.RegisterRequest;
import com.nutrilift.dto.UserDto;
import com.nutrilift.exception.BadRequestException;
import com.nutrilift.model.ActivityLevel;
import com.nutrilift.model.Gender;
import com.nutrilift.model.User;
import com.nutrilift.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final TdeeCalculatorService tdeeCalculatorService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       AuthenticationManager authenticationManager,
                       TdeeCalculatorService tdeeCalculatorService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.authenticationManager = authenticationManager;
        this.tdeeCalculatorService = tdeeCalculatorService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An account with this email already exists");
        }

        Gender gender;
        try {
            gender = Gender.valueOf(request.getGender().trim().toUpperCase());
        } catch (Exception e) {
            gender = Gender.MALE;
        }

        ActivityLevel activityLevel = ActivityLevel.fromString(request.getActivityLevel());

        TdeeCalculatorService.Targets targets = tdeeCalculatorService.calculateTargets(
                gender,
                request.getWeightKg(),
                request.getHeightCm(),
                request.getAge(),
                activityLevel
        );

        User user = new User();
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName().trim());
        user.setAge(request.getAge());
        user.setGender(gender);
        user.setHeightCm(request.getHeightCm());
        user.setWeightKg(request.getWeightKg());
        user.setActivityLevel(activityLevel);
        user.setTargetCalories(targets.targetCalories());
        user.setTargetProteinG(targets.targetProteinG());

        User savedUser = userRepository.save(user);
        String token = tokenProvider.generateToken(savedUser);

        return new AuthResponse(token, UserDto.fromEntity(savedUser));
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        String token = tokenProvider.generateToken(user);
        return new AuthResponse(token, UserDto.fromEntity(user));
    }
}
