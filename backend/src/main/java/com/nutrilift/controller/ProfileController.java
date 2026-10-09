package com.nutrilift.controller;

import com.nutrilift.config.UserPrincipal;
import com.nutrilift.dto.AiTargetRequest;
import com.nutrilift.dto.AiTargetResponse;
import com.nutrilift.dto.UpdateTargetsRequest;
import com.nutrilift.dto.UserDto;
import com.nutrilift.service.AiParsingService;
import com.nutrilift.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserService userService;
    private final AiParsingService aiParsingService;

    public ProfileController(UserService userService, AiParsingService aiParsingService) {
        this.userService = userService;
        this.aiParsingService = aiParsingService;
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

    @PostMapping("/ai-targets")
    public ResponseEntity<AiTargetResponse> calculateAiTargets(@Valid @RequestBody AiTargetRequest request) {
        AiTargetResponse response = aiParsingService.calculateAiTargets(request);
        return ResponseEntity.ok(response);
    }
}
