package com.nutrilift.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class UpdateTargetsRequest {

    @NotNull(message = "Target calories is required")
    @Positive(message = "Target calories must be positive")
    private Integer targetCalories;

    @NotNull(message = "Target protein is required")
    @Positive(message = "Target protein must be positive")
    private Integer targetProteinG;

    public UpdateTargetsRequest() {
    }

    public UpdateTargetsRequest(Integer targetCalories, Integer targetProteinG) {
        this.targetCalories = targetCalories;
        this.targetProteinG = targetProteinG;
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
