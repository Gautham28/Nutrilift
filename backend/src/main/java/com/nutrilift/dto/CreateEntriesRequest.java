package com.nutrilift.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public class CreateEntriesRequest {

    @NotNull(message = "Entry date is required")
    private LocalDate entryDate;

    @NotNull(message = "Meal type is required")
    private String mealType;

    @NotEmpty(message = "Items list cannot be empty")
    private List<FoodItemDto> items;

    public CreateEntriesRequest() {
    }

    public CreateEntriesRequest(LocalDate entryDate, String mealType, List<FoodItemDto> items) {
        this.entryDate = entryDate;
        this.mealType = mealType;
        this.items = items;
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

    public List<FoodItemDto> getItems() {
        return items;
    }

    public void setItems(List<FoodItemDto> items) {
        this.items = items;
    }
}
