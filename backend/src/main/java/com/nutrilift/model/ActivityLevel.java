package com.nutrilift.model;

public enum ActivityLevel {
    SEDENTARY(1.2),
    LIGHT(1.375),
    MODERATE(1.55),
    ACTIVE(1.725),
    VERY_ACTIVE(1.725);

    private final double multiplier;

    ActivityLevel(double multiplier) {
        this.multiplier = multiplier;
    }

    public double getMultiplier() {
        return multiplier;
    }

    public static ActivityLevel fromString(String value) {
        if (value == null) return SEDENTARY;
        String normalized = value.trim().toUpperCase().replace("-", "_").replace(" ", "_");
        for (ActivityLevel level : values()) {
            if (level.name().equalsIgnoreCase(normalized)) {
                return level;
            }
        }
        // Handle common variations
        if (normalized.contains("SEDENTARY")) return SEDENTARY;
        if (normalized.contains("LIGHT")) return LIGHT;
        if (normalized.contains("MODERATE")) return MODERATE;
        if (normalized.contains("VERY")) return VERY_ACTIVE;
        if (normalized.contains("ACTIVE")) return ACTIVE;
        return SEDENTARY;
    }
}
