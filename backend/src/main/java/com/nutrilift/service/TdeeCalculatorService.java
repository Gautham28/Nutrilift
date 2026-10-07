package com.nutrilift.service;

import com.nutrilift.model.ActivityLevel;
import com.nutrilift.model.Gender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class TdeeCalculatorService {

    public record Targets(int targetCalories, int targetProteinG, int bmr, int tdee) {}

    /**
     * Calculates BMR and TDEE based on Mifflin-St Jeor Equation.
     */
    public Targets calculateTargets(Gender gender, BigDecimal weightKg, int heightCm, int age, ActivityLevel activityLevel) {
        if (weightKg == null) {
            throw new IllegalArgumentException("Weight is required");
        }
        if (gender == null) {
            gender = Gender.MALE;
        }
        if (activityLevel == null) {
            activityLevel = ActivityLevel.SEDENTARY;
        }

        double weight = weightKg.doubleValue();

        // 1. Calculate BMR (Basal Metabolic Rate)
        // Male: BMR = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
        // Female: BMR = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161
        double bmrValue;
        if (gender == Gender.FEMALE) {
            bmrValue = (10.0 * weight) + (6.25 * heightCm) - (5.0 * age) - 161.0;
        } else {
            bmrValue = (10.0 * weight) + (6.25 * heightCm) - (5.0 * age) + 5.0;
        }

        // 2. Calculate TDEE
        double multiplier = activityLevel.getMultiplier();
        double tdeeValue = bmrValue * multiplier;

        // 3. Set Targets (rounded to nearest integer)
        int targetCalories = (int) Math.round(tdeeValue);
        // Ensure healthy floor
        if (targetCalories < 1200) {
            targetCalories = 1200;
        }

        // target_protein_g = weight_kg * 1.8
        int targetProteinG = (int) Math.round(weight * 1.8);

        return new Targets(targetCalories, targetProteinG, (int) Math.round(bmrValue), (int) Math.round(tdeeValue));
    }
}
