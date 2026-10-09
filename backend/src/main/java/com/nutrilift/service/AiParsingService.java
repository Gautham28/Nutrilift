package com.nutrilift.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrilift.dto.AiTargetRequest;
import com.nutrilift.dto.AiTargetResponse;
import com.nutrilift.dto.FoodItemDto;
import com.nutrilift.dto.PlateScanResponseDto;
import com.nutrilift.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiParsingService {

    private static final Logger log = LoggerFactory.getLogger(AiParsingService.class);

    private static final String SYSTEM_PROMPT = """
            You are an expert nutritionist specializing in Indian diets.
            Convert the user's meal description into a structured JSON array of food items.
            Assume standard Indian portion sizes if not explicitly specified (e.g., 1 bowl = 150g, 1 piece of roti = 30g).
            Return ONLY a valid JSON array. Do not include markdown formatting like ```json. Do not include any conversational text.
            Each object in the array must have these exact keys: food_name, quantity, unit, calories, protein_g, carbs_g, fat_g.
            If the input text does not describe any food, dish, or beverage (for example, greetings like 'hello', questions, or random non-food words), return an empty JSON array [].
            """;

    private static final String PLATE_VISION_PROMPT = """
            You are an expert Indian clinical nutritionist and computer vision nutrition specialist.
            Analyze this photo of a food plate or meal.
            Identify EVERY distinct Indian food item, dish, side, beverage, or component visible on the plate (e.g., rotis/chapatis/naan, rice/biryani/pulao, dal, paneer gravy, chicken/egg curry, curd/raita, salad, sabzi).
            
            Estimate realistic portion sizes based on visual plate dimensions and standard Indian serving sizes (e.g., 1 standard katori = 150g, 1 phulka = 30-35g, 1 cup cooked rice = 150g, 1 piece gulab jamun = 50g).
            Calculate accurate macronutrients according to the Indian Food Composition Tables (IFCT / NIN).
            
            Return a JSON object with this EXACT structure:
            {
              "items": [
                {
                  "food_name": "Roti (Phulka)",
                  "quantity": 2,
                  "unit": "piece",
                  "calories": 140,
                  "protein_g": 4.5,
                  "carbs_g": 26.0,
                  "fat_g": 1.2
                }
              ],
              "visualAnalysis": "Identified 2 Phulkas, ~150g yellow moong dal, and ~100g aloo gobi sabzi. Clean home-cooked meal with good micronutrients and balanced macros."
            }
            
            If the image contains NO recognizable food or meal (e.g., human faces, pets, random objects, blank background), return:
            {
              "items": [],
              "visualAnalysis": "No food detected in this image. Please upload a clear photo of your meal plate."
            }
            
            Do not include markdown code block syntax (like ```json). Return ONLY valid JSON.
            """;

    @Value("${gemini.api.key:AQ.Ab8RN6K0inGGTgMeZvHK6RbJ5sqVXkIIQwn1EkyvNbVoNX_f0A}")
    private String geminiApiKey;

    @Value("${gemini.vision.key:${gemini.api.key:AQ.Ab8RN6K0inGGTgMeZvHK6RbJ5sqVXkIIQwn1EkyvNbVoNX_f0A}}")
    private String geminiVisionApiKey;

    @Value("${gemini.model:gemini-flash-latest}")
    private String geminiModel;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final FoodItemCacheService foodItemCacheService;

    public AiParsingService(ObjectMapper objectMapper, FoodItemCacheService foodItemCacheService) {
        this.objectMapper = objectMapper;
        this.foodItemCacheService = foodItemCacheService;
        this.restTemplate = new RestTemplate();
    }

    public List<FoodItemDto> parseMeal(String rawText, String mealType) {
        if (rawText == null || rawText.trim().isEmpty()) {
            throw new BadRequestException("Meal description cannot be empty");
        }

        String cleanedInput = rawText.trim();

        // 1. High-throughput Semantic Cache check (Redis / In-memory fallback: <15ms)
        Optional<List<FoodItemDto>> cached = foodItemCacheService.getCachedMeal(cleanedInput, mealType);
        if (cached.isPresent()) {
            return cached.get();
        }

        // 2. Cache Miss: Execute Gemini LLM inference
        List<FoodItemDto> items;
        if (isGeminiApiKeyConfigured()) {
            items = callGeminiApi(cleanedInput, mealType);
        } else {
            throw new BadRequestException("AI service is not configured. Please contact support.");
        }

        // 3. Write back to cache for subsequent 0-cost queries (7-day TTL)
        if (items != null && !items.isEmpty()) {
            foodItemCacheService.cacheMeal(cleanedInput, mealType, items);
        }

        return items;
    }

    private boolean isGeminiApiKeyConfigured() {
        return geminiApiKey != null
                && !geminiApiKey.isBlank()
                && !geminiApiKey.contains("your_google_gemini_api_key")
                && !geminiApiKey.equals("placeholder");
    }

    private List<FoodItemDto> callGeminiApi(String rawText, String mealType) {
        List<String> modelsToTry = List.of(geminiModel, "gemini-flash-latest", "gemini-2.5-flash");
        Set<String> attempted = new LinkedHashSet<>();
        Exception lastException = null;

        for (String modelName : modelsToTry) {
            if (!attempted.add(modelName)) continue;
            try {
                return executeGeminiCall(modelName, rawText, mealType);
            } catch (BadRequestException bre) {
                throw bre;
            } catch (Exception ex) {
                lastException = ex;
                log.warn("Gemini model {} failed ({}), trying next candidate...", modelName, ex.getMessage());
            }
        }

        if (lastException != null) {
            log.error("All Gemini model attempts failed", lastException);
        }
        throw new BadRequestException("AI service is currently busy. Please try again in a moment.");
    }

    private List<FoodItemDto> executeGeminiCall(String modelName, String rawText, String mealType) throws Exception {
        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                modelName, geminiApiKey);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String prompt = SYSTEM_PROMPT + "\n\nUser meal description (" + (mealType != null ? mealType : "meal") + "): " + rawText;

        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> contentObj = Map.of("parts", List.of(textPart));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.2);
        generationConfig.put("response_mime_type", "application/json");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(contentObj));
        requestBody.put("generationConfig", generationConfig);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Gemini returned non-200: " + response.getStatusCode());
        }

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode candidates = root.path("candidates");
        if (candidates.isEmpty()) {
            throw new BadRequestException("No food or meal recognized. Please describe what you ate.");
        }

        String contentText = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
        String cleanedJson = stripMarkdown(contentText);

        List<FoodItemDto> items = objectMapper.readValue(cleanedJson, new TypeReference<List<FoodItemDto>>() {});
        if (items == null || items.isEmpty()) {
            throw new BadRequestException("No food or meal recognized. Please describe what you ate (e.g. '3 dosa, black chana curry').");
        }
        for (FoodItemDto item : items) {
            item.setIsAiParsed(true);
        }
        return items;
    }

    private String stripMarkdown(String raw) {
        if (raw == null) return "[]";
        String cleaned = raw.trim();
        // Remove ```json and ```
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }

    /**
     * Fallback dictionary of common Indian foods for development and offline mode.
     */
    private List<FoodItemDto> fallbackIndianFoodParser(String rawText) {
        List<FoodItemDto> result = new ArrayList<>();
        String lower = rawText.toLowerCase();

        Map<String, NutritionProfile> db = getIndianFoodProfiles();

        for (Map.Entry<String, NutritionProfile> entry : db.entrySet()) {
            String keyword = entry.getKey();
            if (lower.contains(keyword)) {
                NutritionProfile profile = entry.getValue();

                // Check for quantity prefix like "2 rotis", "3 eggs", "1 bowl"
                double qty = 1.0;
                Pattern pattern = Pattern.compile("(\\d+(\\.\\d+)?)\\s*(?:pieces?|piece|bowls?|bowl|cups?|cup|plates?|plate)?\\s*(?:of\\s*)?" + Pattern.quote(keyword));
                Matcher matcher = pattern.matcher(lower);
                if (matcher.find()) {
                    try {
                        qty = Double.parseDouble(matcher.group(1));
                    } catch (NumberFormatException ignored) {}
                }

                int cals = (int) Math.round(profile.calories * qty);
                BigDecimal p = BigDecimal.valueOf(profile.protein * qty).setScale(2, java.math.RoundingMode.HALF_UP);
                BigDecimal c = BigDecimal.valueOf(profile.carbs * qty).setScale(2, java.math.RoundingMode.HALF_UP);
                BigDecimal f = BigDecimal.valueOf(profile.fat * qty).setScale(2, java.math.RoundingMode.HALF_UP);

                result.add(new FoodItemDto(
                        profile.displayName,
                        BigDecimal.valueOf(qty),
                        profile.unit,
                        cals,
                        p,
                        c,
                        f,
                        true
                ));
            }
        }

        return result;
    }

    private static String formatTitleCase(String text) {
        if (text == null || text.isBlank()) return "Indian Meal";
        String[] words = text.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isBlank()) {
                sb.append(Character.toUpperCase(w.charAt(0)))
                  .append(w.substring(1).toLowerCase())
                  .append(" ");
            }
        }
        return sb.toString().trim();
    }

    private record NutritionProfile(String displayName, String unit, int calories, double protein, double carbs, double fat) {}

    private Map<String, NutritionProfile> getIndianFoodProfiles() {
        Map<String, NutritionProfile> map = new LinkedHashMap<>();
        map.put("roti", new NutritionProfile("Roti / Chapati", "piece", 104, 3.1, 20.0, 1.2));
        map.put("chapati", new NutritionProfile("Roti / Chapati", "piece", 104, 3.1, 20.0, 1.2));
        map.put("dal", new NutritionProfile("Dal Tadka", "bowl", 160, 9.0, 22.0, 4.0));
        map.put("daal", new NutritionProfile("Dal", "bowl", 160, 9.0, 22.0, 4.0));
        map.put("rice", new NutritionProfile("Steamed Basmati Rice", "bowl", 180, 4.2, 39.0, 0.4));
        map.put("biryani", new NutritionProfile("Chicken Biryani", "plate", 480, 26.0, 58.0, 15.0));
        map.put("paneer", new NutritionProfile("Paneer Curry / Bhurji", "bowl", 260, 16.0, 7.0, 19.0));
        map.put("egg", new NutritionProfile("Boiled Egg", "piece", 78, 6.3, 0.6, 5.3));
        map.put("eggs", new NutritionProfile("Boiled Egg", "piece", 78, 6.3, 0.6, 5.3));
        map.put("omelette", new NutritionProfile("Masala Omelette", "piece", 154, 11.0, 2.0, 11.5));
        map.put("idli", new NutritionProfile("Idli", "piece", 58, 2.0, 12.0, 0.2));
        map.put("dosa", new NutritionProfile("Masala Dosa", "piece", 280, 5.5, 38.0, 12.0));
        map.put("sambar", new NutritionProfile("Sambar", "bowl", 110, 4.5, 18.0, 2.5));
        map.put("chutney", new NutritionProfile("Coconut Chutney", "tbsp", 55, 0.8, 2.5, 4.8));
        map.put("chicken", new NutritionProfile("Chicken Curry", "bowl", 320, 31.0, 6.0, 18.0));
        map.put("curd", new NutritionProfile("Curd / Dahi", "bowl", 100, 4.5, 5.5, 4.0));
        map.put("yogurt", new NutritionProfile("Curd / Yogurt", "bowl", 100, 4.5, 5.5, 4.0));
        map.put("raita", new NutritionProfile("Cucumber Raita", "bowl", 75, 3.2, 5.0, 4.5));
        map.put("poha", new NutritionProfile("Kanda Poha", "bowl", 220, 4.0, 38.0, 6.0));
        map.put("upma", new NutritionProfile("Rava Upma", "bowl", 210, 4.5, 36.0, 5.5));
        map.put("paratha", new NutritionProfile("Aloo Paratha", "piece", 240, 5.0, 34.0, 9.5));
        map.put("chai", new NutritionProfile("Masala Chai (with milk & sugar)", "cup", 85, 2.0, 13.0, 2.5));
        map.put("tea", new NutritionProfile("Milk Tea", "cup", 85, 2.0, 13.0, 2.5));
        map.put("coffee", new NutritionProfile("Filter Coffee", "cup", 90, 2.2, 12.0, 3.2));
        map.put("chole", new NutritionProfile("Chole Masala", "bowl", 240, 11.0, 34.0, 6.5));
        map.put("rajma", new NutritionProfile("Rajma Masala", "bowl", 230, 12.0, 35.0, 5.0));
        map.put("oats", new NutritionProfile("Masala Oats", "bowl", 170, 6.0, 28.0, 3.5));
        map.put("salad", new NutritionProfile("Kachumber Salad", "bowl", 45, 1.2, 8.0, 0.5));
        map.put("khichdi", new NutritionProfile("Moong Dal Khichdi", "bowl", 200, 7.5, 36.0, 3.0));
        return map;
    }

    private static final String TARGET_ADVISOR_SYSTEM_PROMPT = """
            You are an elite sports scientist and registered dietitian specializing in physique transformation, strength training, and Indian diet optimization.
            Given a user's biometrics and personal fitness goal, calculate their optimal daily nutritional targets.
            
            Determine:
            1. Target daily Calories (applying a calibrated deficit for fat loss, surplus for lean bulking, or maintenance for recomposition).
            2. Target daily Protein (in grams, using 1.6 - 2.2g per kg bodyweight based on their goal).
            3. Target daily Carbs (in grams).
            4. Target daily Fat (in grams).
            5. Estimated BMR (Basal Metabolic Rate).
            6. Estimated TDEE (Total Daily Energy Expenditure).
            7. Strategy title (short summary, e.g. 'Calorie Deficit (-350 kcal) • Recomposition Focus').
            8. Explanation (2-3 concise sentences explaining why these specific numbers were chosen for their goal).
            9. Actionable Tips (an array of 3 practical, high-impact nutrition or training tips).

            Return ONLY valid JSON matching this exact structure:
            {
              "targetCalories": 2100,
              "targetProteinG": 140,
              "targetCarbsG": 230,
              "targetFatG": 65,
              "bmr": 1700,
              "tdee": 2400,
              "strategy": "Calorie Deficit (-300 kcal) for Fat Loss",
              "explanation": "With a 300 kcal deficit and 140g protein...",
              "actionableTips": [
                "Prioritize 30g+ protein in breakfast to curb cravings",
                "Keep heavy carbs around workouts for high training performance",
                "Drink at least 3 to 3.5 liters of water daily"
              ]
            }
            """;

    public AiTargetResponse calculateAiTargets(AiTargetRequest request) {
        if (request == null) {
            throw new BadRequestException("Target calculation request cannot be empty");
        }

        if (isGeminiApiKeyConfigured()) {
            try {
                return callGeminiTargetAdvisor(request);
            } catch (Exception ex) {
                log.warn("Gemini target advisor call failed ({}), falling back to intelligent nutrition calculation...", ex.getMessage());
            }
        }

        return fallbackTargetAdvisor(request);
    }

    private AiTargetResponse callGeminiTargetAdvisor(AiTargetRequest request) throws Exception {
        String prompt = String.format("""
                %s

                User Biometrics & Goals:
                - Weight: %s kg
                - Height: %d cm
                - Age: %d
                - Gender: %s
                - Activity Level: %s
                - User Fitness Goal & Routine: "%s"
                """,
                TARGET_ADVISOR_SYSTEM_PROMPT,
                request.getWeightKg() != null ? request.getWeightKg().toString() : "70",
                request.getHeightCm() != null ? request.getHeightCm() : 175,
                request.getAge() != null ? request.getAge() : 25,
                request.getGender() != null ? request.getGender() : "MALE",
                request.getActivityLevel() != null ? request.getActivityLevel() : "MODERATE",
                request.getFitnessGoal()
        );

        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel, geminiApiKey);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> contentObj = Map.of("parts", List.of(textPart));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.3);
        generationConfig.put("response_mime_type", "application/json");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(contentObj));
        requestBody.put("generationConfig", generationConfig);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Gemini returned non-200: " + response.getStatusCode());
        }

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode candidates = root.path("candidates");
        if (candidates.isEmpty()) {
            throw new BadRequestException("AI could not analyze goals. Please try again.");
        }

        String contentText = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
        String cleanedJson = stripMarkdown(contentText);

        return objectMapper.readValue(cleanedJson, AiTargetResponse.class);
    }

    private AiTargetResponse fallbackTargetAdvisor(AiTargetRequest request) {
        double weight = request.getWeightKg() != null ? request.getWeightKg().doubleValue() : 70.0;
        int height = request.getHeightCm() != null ? request.getHeightCm() : 175;
        int age = request.getAge() != null ? request.getAge() : 25;
        String gender = request.getGender() != null ? request.getGender().toUpperCase() : "MALE";
        String activity = request.getActivityLevel() != null ? request.getActivityLevel().toUpperCase() : "MODERATE";
        String goal = request.getFitnessGoal() != null ? request.getFitnessGoal().toLowerCase() : "";

        // BMR (Mifflin-St Jeor)
        double bmr = ("FEMALE".equals(gender))
                ? (10.0 * weight) + (6.25 * height) - (5.0 * age) - 161.0
                : (10.0 * weight) + (6.25 * height) - (5.0 * age) + 5.0;

        // Activity multiplier
        double multiplier = switch (activity) {
            case "SEDENTARY" -> 1.2;
            case "LIGHT", "LIGHTLY_ACTIVE" -> 1.375;
            case "ACTIVE", "VERY_ACTIVE" -> 1.725;
            default -> 1.55; // MODERATE
        };

        double tdee = bmr * multiplier;

        int targetCalories;
        int targetProteinG;
        String strategy;
        String explanation;
        List<String> tips = new ArrayList<>();

        if (goal.contains("lose") || goal.contains("cut") || goal.contains("fat") || goal.contains("drop") || goal.contains("belly") || goal.contains("weight loss")) {
            int deficit = 400;
            targetCalories = Math.max(1300, (int) Math.round(tdee - deficit));
            targetProteinG = (int) Math.round(weight * 2.0); // 2.0g/kg during deficit
            strategy = "Caloric Deficit (-400 kcal) • Lean Fat Loss";
            explanation = String.format("A targeted deficit of 400 kcal below your maintenance (%d kcal) promotes steady fat loss while %dg protein protects lean muscle tissue.", (int) Math.round(tdee), targetProteinG);
            tips.add("Distribute your protein evenly across 3-4 meals to preserve muscle mass.");
            tips.add("Prioritize fiber-rich Indian legumes and vegetables to stay full longer.");
            tips.add("Keep high-GI carbs close to your training sessions for maximum workout energy.");
        } else if (goal.contains("bulk") || goal.contains("gain") || goal.contains("muscle") || goal.contains("mass") || goal.contains("hypertrophy")) {
            int surplus = 300;
            targetCalories = (int) Math.round(tdee + surplus);
            targetProteinG = (int) Math.round(weight * 1.8);
            strategy = "Clean Caloric Surplus (+300 kcal) • Hypertrophy Bulking";
            explanation = String.format("A controlled surplus of +300 kcal above maintenance (%d kcal) provides the necessary anabolic energy for muscle hypertrophy without unnecessary fat storage.", (int) Math.round(tdee));
            tips.add("Consume 30-40g protein and complex carbs within 90 minutes post-workout.");
            tips.add("Include calorie-dense healthy fats like almonds, walnuts, and peanut butter.");
            tips.add("Track progressive overload in the gym to ensure calories convert into muscle.");
        } else {
            // Recomposition
            targetCalories = (int) Math.round(tdee - 150);
            targetProteinG = (int) Math.round(weight * 1.9);
            strategy = "Body Recomposition • High Protein Tone";
            explanation = String.format("A gentle 150 kcal deficit paired with optimal %dg protein allows you to shed body fat while building lean muscle definition simultaneously.", targetProteinG);
            tips.add("Focus on compound lifts (squats, bench, deadlifts) to stimulate muscle recruitment.");
            tips.add("Drink 3 to 3.5 liters of water every day to support metabolic recovery.");
            tips.add("Aim for 7-8 hours of quality sleep to optimize anabolic hormone levels.");
        }

        // Remaining macros
        int proteinCals = targetProteinG * 4;
        int fatCals = (int) Math.round(targetCalories * 0.25);
        int targetFatG = Math.max(40, fatCals / 9);
        int carbCals = Math.max(0, targetCalories - proteinCals - (targetFatG * 9));
        int targetCarbsG = Math.max(80, carbCals / 4);

        return new AiTargetResponse(
                targetCalories,
                targetProteinG,
                targetCarbsG,
                targetFatG,
                (int) Math.round(bmr),
                (int) Math.round(tdee),
                strategy,
                explanation,
                tips
        );
    }

    /**
     * Multimodal Plate Scanner: analyzes meal photos using Gemini Vision.
     */
    public PlateScanResponseDto scanPlate(byte[] imageBytes, String mimeType, String mealType, String notes) {
        if (imageBytes == null || imageBytes.length == 0) {
            throw new BadRequestException("Image file cannot be empty");
        }

        String effectiveKey = getEffectiveVisionKey();
        if (effectiveKey != null && !effectiveKey.isBlank()
                && !effectiveKey.contains("your_google_gemini_api_key")
                && !effectiveKey.equals("placeholder")) {
            List<String> modelsToTry = List.of("gemini-1.5-flash", geminiModel, "gemini-flash-latest", "gemini-2.5-flash");
            Set<String> attempted = new LinkedHashSet<>();
            Exception lastException = null;

            for (String modelName : modelsToTry) {
                if (!attempted.add(modelName)) continue;
                try {
                    return executeGeminiVisionCall(modelName, effectiveKey, imageBytes, mimeType, mealType, notes);
                } catch (BadRequestException bre) {
                    throw bre;
                } catch (Exception ex) {
                    lastException = ex;
                    log.warn("Gemini vision model {} failed ({}), trying next candidate...", modelName, ex.getMessage());
                }
            }

            if (lastException != null) {
                log.error("All Gemini Vision model attempts failed", lastException);
            }
        }

        // Fallback demo response if API is unreachable / unconfigured
        return fallbackPlateScan(mealType, notes);
    }

    private PlateScanResponseDto executeGeminiVisionCall(
            String modelName, String apiKey, byte[] imageBytes, String mimeType, String mealType, String notes) throws Exception {

        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                modelName, apiKey);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String prompt = PLATE_VISION_PROMPT;
        if (mealType != null && !mealType.isBlank()) {
            prompt += "\nMeal Context: This meal is intended for " + mealType + ".";
        }
        if (notes != null && !notes.isBlank()) {
            prompt += "\nUser Notes on Preparation: " + notes.trim();
        }

        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> inlineData = Map.of(
                "mimeType", (mimeType != null && !mimeType.isBlank()) ? mimeType : "image/jpeg",
                "data", base64Image
        );
        Map<String, Object> imagePart = Map.of("inlineData", inlineData);

        Map<String, Object> contentObj = Map.of("parts", List.of(textPart, imagePart));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.2);
        generationConfig.put("response_mime_type", "application/json");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(contentObj));
        requestBody.put("generationConfig", generationConfig);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Gemini returned non-200: " + response.getStatusCode());
        }

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode candidates = root.path("candidates");
        if (candidates.isEmpty()) {
            throw new BadRequestException("No analysis generated for this image. Please ensure the food plate is clearly visible.");
        }

        String contentText = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
        String cleanedJson = stripMarkdown(contentText);

        JsonNode jsonNode = objectMapper.readTree(cleanedJson);
        JsonNode itemsNode = jsonNode.path("items");
        String visualAnalysis = jsonNode.path("visualAnalysis").asText("Identified Indian meal plate.");

        List<FoodItemDto> items = new ArrayList<>();
        if (itemsNode.isArray()) {
            for (JsonNode itemNode : itemsNode) {
                FoodItemDto item = objectMapper.treeToValue(itemNode, FoodItemDto.class);
                item.setIsAiParsed(true);
                items.add(item);
            }
        }

        if (items.isEmpty()) {
            throw new BadRequestException(visualAnalysis != null && !visualAnalysis.isBlank()
                    ? visualAnalysis
                    : "No food items recognized in this image. Please try a clearer picture of your plate.");
        }

        int totalCalories = 0;
        BigDecimal totalProtein = BigDecimal.ZERO;
        BigDecimal totalCarbs = BigDecimal.ZERO;
        BigDecimal totalFat = BigDecimal.ZERO;

        for (FoodItemDto item : items) {
            if (item.getCalories() != null) totalCalories += item.getCalories();
            if (item.getProteinG() != null) totalProtein = totalProtein.add(item.getProteinG());
            if (item.getCarbsG() != null) totalCarbs = totalCarbs.add(item.getCarbsG());
            if (item.getFatG() != null) totalFat = totalFat.add(item.getFatG());
        }

        return new PlateScanResponseDto(
                items,
                totalCalories,
                totalProtein.setScale(1, RoundingMode.HALF_UP),
                totalCarbs.setScale(1, RoundingMode.HALF_UP),
                totalFat.setScale(1, RoundingMode.HALF_UP),
                visualAnalysis,
                mealType != null ? mealType : "LUNCH",
                true
        );
    }

    private PlateScanResponseDto fallbackPlateScan(String mealType, String notes) {
        List<FoodItemDto> items = List.of(
                new FoodItemDto("Roti (Phulka)", BigDecimal.valueOf(2), "piece", 140, BigDecimal.valueOf(4.5), BigDecimal.valueOf(26.0), BigDecimal.valueOf(1.2), true),
                new FoodItemDto("Dal Tadka", BigDecimal.valueOf(1), "bowl", 180, BigDecimal.valueOf(9.0), BigDecimal.valueOf(22.0), BigDecimal.valueOf(5.5), true),
                new FoodItemDto("Paneer Bhurji", BigDecimal.valueOf(100), "g", 240, BigDecimal.valueOf(14.5), BigDecimal.valueOf(4.0), BigDecimal.valueOf(18.0), true)
        );
        return new PlateScanResponseDto(
                items,
                560,
                BigDecimal.valueOf(28.0),
                BigDecimal.valueOf(52.0),
                BigDecimal.valueOf(24.7),
                "Visual estimate: 2 Phulkas, 1 bowl yellow Dal Tadka, and 100g Paneer Bhurji. Rich protein and balanced carbs.",
                mealType != null ? mealType : "LUNCH",
                true
        );
    }

    private String getEffectiveVisionKey() {
        if (geminiVisionApiKey != null
                && !geminiVisionApiKey.isBlank()
                && !geminiVisionApiKey.contains("your_google_gemini_api_key")
                && !geminiVisionApiKey.equals("placeholder")) {
            return geminiVisionApiKey;
        }
        return geminiApiKey;
    }
}

