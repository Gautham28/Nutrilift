package com.nutrilift.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "food_entries")
public class FoodEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_type", nullable = false, length = 50)
    private MealType mealType;

    @Column(name = "food_name", nullable = false)
    private String foodName;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal quantity;

    @Column(nullable = false, length = 50)
    private String unit;

    @Column(nullable = false)
    private Integer calories;

    @Column(name = "protein_g", nullable = false, precision = 6, scale = 2)
    private BigDecimal proteinG;

    @Column(name = "carbs_g", nullable = false, precision = 6, scale = 2)
    private BigDecimal carbsG;

    @Column(name = "fat_g", nullable = false, precision = 6, scale = 2)
    private BigDecimal fatG;

    @Column(name = "is_ai_parsed", nullable = false)
    private Boolean isAiParsed = true;

    @PrePersist
    protected void onCreate() {
        if (entryDate == null) {
            entryDate = LocalDate.now();
        }
        if (isAiParsed == null) {
            isAiParsed = true;
        }
    }

    public FoodEntry() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDate getEntryDate() {
        return entryDate;
    }

    public void setEntryDate(LocalDate entryDate) {
        this.entryDate = entryDate;
    }

    public MealType getMealType() {
        return mealType;
    }

    public void setMealType(MealType mealType) {
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
