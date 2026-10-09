package com.nutrilift.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class PlateScanResponseDto {

    @JsonProperty("items")
    private List<FoodItemDto> items = new ArrayList<>();

    @JsonProperty("totalCalories")
    private Integer totalCalories = 0;

    @JsonProperty("totalProteinG")
    private BigDecimal totalProteinG = BigDecimal.ZERO;

    @JsonProperty("totalCarbsG")
    private BigDecimal totalCarbsG = BigDecimal.ZERO;

    @JsonProperty("totalFatG")
    private BigDecimal totalFatG = BigDecimal.ZERO;

    @JsonProperty("visualAnalysis")
    private String visualAnalysis;

    @JsonProperty("mealType")
    private String mealType;

    @JsonProperty("isSuccess")
    private Boolean isSuccess = true;

    public PlateScanResponseDto() {
    }

    public PlateScanResponseDto(List<FoodItemDto> items, Integer totalCalories, BigDecimal totalProteinG,
                                BigDecimal totalCarbsG, BigDecimal totalFatG, String visualAnalysis,
                                String mealType, Boolean isSuccess) {
        this.items = items != null ? items : new ArrayList<>();
        this.totalCalories = totalCalories != null ? totalCalories : 0;
        this.totalProteinG = totalProteinG != null ? totalProteinG : BigDecimal.ZERO;
        this.totalCarbsG = totalCarbsG != null ? totalCarbsG : BigDecimal.ZERO;
        this.totalFatG = totalFatG != null ? totalFatG : BigDecimal.ZERO;
        this.visualAnalysis = visualAnalysis;
        this.mealType = mealType;
        this.isSuccess = isSuccess != null ? isSuccess : true;
    }

    public List<FoodItemDto> getItems() {
        return items;
    }

    public void setItems(List<FoodItemDto> items) {
        this.items = items;
    }

    public Integer getTotalCalories() {
        return totalCalories;
    }

    public void setTotalCalories(Integer totalCalories) {
        this.totalCalories = totalCalories;
    }

    public BigDecimal getTotalProteinG() {
        return totalProteinG;
    }

    public void setTotalProteinG(BigDecimal totalProteinG) {
        this.totalProteinG = totalProteinG;
    }

    public BigDecimal getTotalCarbsG() {
        return totalCarbsG;
    }

    public void setTotalCarbsG(BigDecimal totalCarbsG) {
        this.totalCarbsG = totalCarbsG;
    }

    public BigDecimal getTotalFatG() {
        return totalFatG;
    }

    public void setTotalFatG(BigDecimal totalFatG) {
        this.totalFatG = totalFatG;
    }

    public String getVisualAnalysis() {
        return visualAnalysis;
    }

    public void setVisualAnalysis(String visualAnalysis) {
        this.visualAnalysis = visualAnalysis;
    }

    public String getMealType() {
        return mealType;
    }

    public void setMealType(String mealType) {
        this.mealType = mealType;
    }

    public Boolean getIsSuccess() {
        return isSuccess;
    }

    public void setIsSuccess(Boolean isSuccess) {
        this.isSuccess = isSuccess;
    }
}
