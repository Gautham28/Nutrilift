package com.nutrilift.dto;

import com.nutrilift.model.User;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class UserDto {
    private UUID id;
    private String email;
    private String fullName;
    private Integer age;
    private String gender;
    private Integer heightCm;
    private BigDecimal weightKg;
    private String activityLevel;
    private Integer targetCalories;
    private Integer targetProteinG;
    private LocalDateTime createdAt;

    public UserDto() {
    }

    public static UserDto fromEntity(User user) {
        if (user == null) return null;
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setAge(user.getAge());
        dto.setGender(user.getGender() != null ? user.getGender().name() : null);
        dto.setHeightCm(user.getHeightCm());
        dto.setWeightKg(user.getWeightKg());
        dto.setActivityLevel(user.getActivityLevel() != null ? user.getActivityLevel().name() : null);
        dto.setTargetCalories(user.getTargetCalories());
        dto.setTargetProteinG(user.getTargetProteinG());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public Integer getHeightCm() {
        return heightCm;
    }

    public void setHeightCm(Integer heightCm) {
        this.heightCm = heightCm;
    }

    public BigDecimal getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(BigDecimal weightKg) {
        this.weightKg = weightKg;
    }

    public String getActivityLevel() {
        return activityLevel;
    }

    public void setActivityLevel(String activityLevel) {
        this.activityLevel = activityLevel;
    }

    public Integer getTargetCalories() {
        return targetCalories;
    }

    public void setTargetCalories(Integer targetCalories) {
        this.targetCalories = targetCalories;
    }

    public Integer getTargetProteinG() {
        return targetProteinG;
    }

    public void setTargetProteinG(Integer targetProteinG) {
        this.targetProteinG = targetProteinG;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
