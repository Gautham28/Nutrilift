package com.nutrilift.controller;

import com.nutrilift.config.UserPrincipal;
import com.nutrilift.dto.UpdateTargetsRequest;
import com.nutrilift.dto.UserDto;
import com.nutrilift.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserService userService;

    public ProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<UserDto> getProfile(@AuthenticationPrincipal UserPrincipal currentUser) {
        UserDto profile = userService.getProfile(currentUser.getId());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/targets")
    public ResponseEntity<UserDto> updateTargets(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody UpdateTargetsRequest request) {
        UserDto updated = userService.updateTargets(currentUser.getId(), request);
        return ResponseEntity.ok(updated);
    }
}
