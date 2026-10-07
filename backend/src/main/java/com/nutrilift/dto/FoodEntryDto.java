package com.nutrilift.dto;

import com.nutrilift.model.FoodEntry;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class FoodEntryDto {
    private UUID id;
    private UUID userId;
    private LocalDate entryDate;
    private String mealType;
    private String foodName;
    private BigDecimal quantity;
    private String unit;
    private Integer calories;
    private BigDecimal proteinG;
    private BigDecimal carbsG;
    private BigDecimal fatG;
    private Boolean isAiParsed;

    public FoodEntryDto() {
    }

    public static FoodEntryDto fromEntity(FoodEntry entity) {
        if (entity == null) return null;
        FoodEntryDto dto = new FoodEntryDto();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUser() != null ? entity.getUser().getId() : null);
        dto.setEntryDate(entity.getEntryDate());
        dto.setMealType(entity.getMealType() != null ? entity.getMealType().name() : null);
        dto.setFoodName(entity.getFoodName());
        dto.setQuantity(entity.getQuantity());
        dto.setUnit(entity.getUnit());
        dto.setCalories(entity.getCalories());
        dto.setProteinG(entity.getProteinG());
        dto.setCarbsG(entity.getCarbsG());
        dto.setFatG(entity.getFatG());
        dto.setIsAiParsed(entity.getIsAiParsed());
        return dto;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public LocalDate getEntryDate() {
        return entryDate;
    }

    public void setEntryDate(LocalDate entryDate) {
        this.entryDate = entryDate;
    }

    public String getMealType() {
        return mealType;
    }

    public void setMealType(String mealType) {
        this.mealType = mealType;
    }

    public String getFoodName() {
        return foodName;
    }

    public void setFoodName(String foodName) {
        this.foodName = foodName;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Integer getCalories() {
        return calories;
    }

    public void setCalories(Integer calories) {
        this.calories = calories;
    }

    public BigDecimal getProteinG() {
        return proteinG;
    }

    public void setProteinG(BigDecimal proteinG) {
        this.proteinG = proteinG;
    }

    public BigDecimal getCarbsG() {
        return carbsG;
    }

    public void setCarbsG(BigDecimal carbsG) {
        this.carbsG = carbsG;
    }

    public BigDecimal getFatG() {
        return fatG;
    }

    public void setFatG(BigDecimal fatG) {
        this.fatG = fatG;
    }

    public Boolean getIsAiParsed() {
        return isAiParsed;
    }

    public void setIsAiParsed(Boolean isAiParsed) {
        this.isAiParsed = isAiParsed;
    }
}
