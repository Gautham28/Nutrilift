package com.nutrilift.model;

public enum MealType {
    BREAKFAST,
    LUNCH,
    DINNER,
    SNACK;

    public static MealType fromString(String value) {
        if (value == null) return SNACK;
        String normalized = value.trim().toUpperCase().replace("-", "_").replace(" ", "_");
        for (MealType type : values()) {
            if (type.name().equalsIgnoreCase(normalized)) {
                return type;
            }
        }
        return SNACK;
    }
}
