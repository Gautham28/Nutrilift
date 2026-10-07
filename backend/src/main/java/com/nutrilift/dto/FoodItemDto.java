package com.nutrilift.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

public class FoodItemDto {

    @JsonProperty("foodName")
    @JsonAlias({"food_name", "foodName", "name"})
    private String foodName;

    @JsonProperty("quantity")
    @JsonAlias({"quantity", "qty", "amount"})
    private BigDecimal quantity;

    @JsonProperty("unit")
    @JsonAlias({"unit", "servingUnit", "serving_unit"})
    private String unit;

    @JsonProperty("calories")
    @JsonAlias({"calories", "cals", "cal"})
    private Integer calories;

    @JsonProperty("proteinG")
    @JsonAlias({"protein_g", "proteinG", "protein"})
    private BigDecimal proteinG;

    @JsonProperty("carbsG")
    @JsonAlias({"carbs_g", "carbsG", "carbs", "carbohydrates_g"})
    private BigDecimal carbsG;

    @JsonProperty("fatG")
    @JsonAlias({"fat_g", "fatG", "fat", "fats_g"})
    private BigDecimal fatG;

    @JsonProperty("isAiParsed")
    @JsonAlias({"is_ai_parsed", "isAiParsed"})
    private Boolean isAiParsed = true;

    public FoodItemDto() {
    }

    public FoodItemDto(String foodName, BigDecimal quantity, String unit, Integer calories,
                       BigDecimal proteinG, BigDecimal carbsG, BigDecimal fatG, Boolean isAiParsed) {
        this.foodName = foodName;
        this.quantity = quantity;
        this.unit = unit;
        this.calories = calories;
        this.proteinG = proteinG;
        this.carbsG = carbsG;
        this.fatG = fatG;
        this.isAiParsed = isAiParsed != null ? isAiParsed : true;
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
