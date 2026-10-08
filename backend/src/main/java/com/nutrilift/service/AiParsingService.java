package com.nutrilift.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrilift.dto.FoodItemDto;
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

    @Value("${gemini.api.key:AQ.Ab8RN6K0inGGTgMeZvHK6RbJ5sqVXkIIQwn1EkyvNbVoNX_f0A}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-flash-latest}")
    private String geminiModel;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public AiParsingService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    public List<FoodItemDto> parseMeal(String rawText, String mealType) {
        if (rawText == null || rawText.trim().isEmpty()) {
            throw new BadRequestException("Meal description cannot be empty");
        }

        String cleanedInput = rawText.trim();

        if (isGeminiApiKeyConfigured()) {
            return callGeminiApi(cleanedInput, mealType);
        } else {
            throw new BadRequestException("AI service is not configured. Please contact support.");
        }
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
}
