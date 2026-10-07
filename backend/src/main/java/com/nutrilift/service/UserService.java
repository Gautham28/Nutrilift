package com.nutrilift.service;

import com.nutrilift.dto.UpdateTargetsRequest;
import com.nutrilift.dto.UserDto;
import com.nutrilift.exception.ResourceNotFoundException;
import com.nutrilift.model.User;
import com.nutrilift.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserDto getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto updateTargets(UUID userId, UpdateTargetsRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setTargetCalories(request.getTargetCalories());
        user.setTargetProteinG(request.getTargetProteinG());

        User updatedUser = userRepository.save(user);
        return UserDto.fromEntity(updatedUser);
    }
}
