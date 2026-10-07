package com.nutrilift.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class TodayEntriesResponse {
    private LocalDate date;
    private Map<String, List<FoodEntryDto>> groupedByMeal;
    private List<FoodEntryDto> entries;
    private Integer totalCalories;
    private BigDecimal totalProtein;
    private BigDecimal totalCarbs;
    private BigDecimal totalFat;
    private Integer targetCalories;
    private Integer targetProteinG;

    public TodayEntriesResponse() {
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Map<String, List<FoodEntryDto>> getGroupedByMeal() {
        return groupedByMeal;
    }

    public void setGroupedByMeal(Map<String, List<FoodEntryDto>> groupedByMeal) {
        this.groupedByMeal = groupedByMeal;
    }

    public List<FoodEntryDto> getEntries() {
        return entries;
    }

    public void setEntries(List<FoodEntryDto> entries) {
        this.entries = entries;
    }

    public Integer getTotalCalories() {
        return totalCalories;
    }

    public void setTotalCalories(Integer totalCalories) {
        this.totalCalories = totalCalories;
    }

    public BigDecimal getTotalProtein() {
        return totalProtein;
    }

    public void setTotalProtein(BigDecimal totalProtein) {
        this.totalProtein = totalProtein;
    }

    public BigDecimal getTotalCarbs() {
        return totalCarbs;
    }

    public void setTotalCarbs(BigDecimal totalCarbs) {
        this.totalCarbs = totalCarbs;
    }

    public BigDecimal getTotalFat() {
        return fatG();
    }

    public BigDecimal getFatG() {
        return totalFat;
    }

    public BigDecimal getTotalFatG() {
        return totalFat;
    }

    public void setTotalFat(BigDecimal totalFat) {
        this.totalFat = totalFat;
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

    private BigDecimal fatG() {
        return totalFat;
    }
}
