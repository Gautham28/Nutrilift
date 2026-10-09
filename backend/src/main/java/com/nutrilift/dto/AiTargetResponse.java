package com.nutrilift.dto;

import java.util.List;

public class AiTargetResponse {

    private int targetCalories;
    private int targetProteinG;
    private int targetCarbsG;
    private int targetFatG;
    private int bmr;
    private int tdee;
    private String strategy;
    private String explanation;
    private List<String> actionableTips;

    public AiTargetResponse() {}

    public AiTargetResponse(int targetCalories, int targetProteinG, int targetCarbsG, int targetFatG,
                            int bmr, int tdee, String strategy, String explanation, List<String> actionableTips) {
        this.targetCalories = targetCalories;
        this.targetProteinG = targetProteinG;
        this.targetCarbsG = targetCarbsG;
        this.targetFatG = targetFatG;
        this.bmr = bmr;
        this.tdee = tdee;
        this.strategy = strategy;
        this.explanation = explanation;
        this.actionableTips = actionableTips;
    }

    public int getTargetCalories() {
        return targetCalories;
    }

    public void setTargetCalories(int targetCalories) {
        this.targetCalories = targetCalories;
    }

    public int getTargetProteinG() {
        return targetProteinG;
    }

    public void setTargetProteinG(int targetProteinG) {
        this.targetProteinG = targetProteinG;
    }

    public int getTargetCarbsG() {
        return targetCarbsG;
    }

    public void setTargetCarbsG(int targetCarbsG) {
        this.targetCarbsG = targetCarbsG;
    }

    public int getTargetFatG() {
        return targetFatG;
    }

    public void setTargetFatG(int targetFatG) {
        this.targetFatG = targetFatG;
    }

    public int getBmr() {
        return bmr;
    }

    public void setBmr(int bmr) {
        this.bmr = bmr;
    }

    public int getTdee() {
        return tdee;
    }

    public void setTdee(int tdee) {
        this.tdee = tdee;
    }

    public String getStrategy() {
        return strategy;
    }

    public void setStrategy(String strategy) {
        this.strategy = strategy;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public List<String> getActionableTips() {
        return actionableTips;
    }

    public void setActionableTips(List<String> actionableTips) {
        this.actionableTips = actionableTips;
    }
}
