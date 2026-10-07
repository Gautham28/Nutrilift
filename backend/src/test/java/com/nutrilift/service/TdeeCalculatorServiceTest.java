package com.nutrilift.service;

import com.nutrilift.model.ActivityLevel;
import com.nutrilift.model.Gender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class TdeeCalculatorServiceTest {

    private TdeeCalculatorService calculatorService;

    @BeforeEach
    void setUp() {
        calculatorService = new TdeeCalculatorService();
    }

    @Test
    void testCalculateTargetsMaleSedentary() {
        // Mifflin-St Jeor Male: (10 * 70) + (6.25 * 175) - (5 * 25) + 5 = 700 + 1093.75 - 125 + 5 = 1673.75
        // TDEE Sedentary (* 1.2) = 2008.5 -> round: 2009
        // Target Protein (70 * 1.8) = 126
        TdeeCalculatorService.Targets targets = calculatorService.calculateTargets(
                Gender.MALE,
                BigDecimal.valueOf(70),
                175,
                25,
                ActivityLevel.SEDENTARY
        );

        assertEquals(2009, targets.targetCalories());
        assertEquals(126, targets.targetProteinG());
        assertEquals(1674, targets.bmr());
    }

    @Test
    void testCalculateTargetsFemaleModerate() {
        // Mifflin-St Jeor Female: (10 * 55) + (6.25 * 160) - (5 * 28) - 161 = 550 + 1000 - 140 - 161 = 1249
        // TDEE Moderate (* 1.55) = 1935.95 -> round: 1936
        // Target Protein (55 * 1.8) = 99
        TdeeCalculatorService.Targets targets = calculatorService.calculateTargets(
                Gender.FEMALE,
                BigDecimal.valueOf(55),
                160,
                28,
                ActivityLevel.MODERATE
        );

        assertEquals(1936, targets.targetCalories());
        assertEquals(99, targets.targetProteinG());
        assertEquals(1249, targets.bmr());
    }
}
