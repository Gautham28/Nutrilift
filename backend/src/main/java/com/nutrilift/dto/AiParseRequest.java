package com.nutrilift.dto;

import jakarta.validation.constraints.NotBlank;

public class AiParseRequest {

    @NotBlank(message = "Meal description text is required")
    private String rawText;

    private String mealType;

    public AiParseRequest() {
    }

    public AiParseRequest(String rawText, String mealType) {
        this.rawText = rawText;
        this.mealType = mealType;
    }

    public String getRawText() {
        return rawText;
    }

    public void setRawText(String rawText) {
        this.rawText = rawText;
    }

    public String getMealType() {
        return mealType;
    }

    public void setMealType(String mealType) {
        this.mealType = mealType;
    }
}
