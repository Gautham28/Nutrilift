package com.nutrilift.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DailyStatsDto {
    private LocalDate date;
    private Integer totalCalories;
    private BigDecimal totalProtein;
    private BigDecimal totalCarbs;
    private BigDecimal totalFat;
    private Integer targetCalories;
    private Integer targetProteinG;

    public DailyStatsDto() {
    }

    public DailyStatsDto(LocalDate date, Integer totalCalories, BigDecimal totalProtein,
                         BigDecimal totalCarbs, BigDecimal totalFat,
                         Integer targetCalories, Integer targetProteinG) {
        this.date = date;
        this.totalCalories = totalCalories != null ? totalCalories : 0;
        this.totalProtein = totalProtein != null ? totalProtein : BigDecimal.ZERO;
        this.totalCarbs = totalCarbs != null ? totalCarbs : BigDecimal.ZERO;
        this.totalFat = totalFat != null ? totalFat : BigDecimal.ZERO;
        this.targetCalories = targetCalories;
        this.targetProteinG = targetProteinG;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
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
}
