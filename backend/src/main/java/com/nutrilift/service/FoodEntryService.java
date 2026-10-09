package com.nutrilift.service;

import com.nutrilift.dto.*;
import com.nutrilift.exception.BadRequestException;
import com.nutrilift.exception.ResourceNotFoundException;
import com.nutrilift.model.FoodEntry;
import com.nutrilift.model.MealType;
import com.nutrilift.model.User;
import com.nutrilift.repository.FoodEntryRepository;
import com.nutrilift.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FoodEntryService {

    private final FoodEntryRepository foodEntryRepository;
    private final UserRepository userRepository;
    private final AiParsingService aiParsingService;

    public FoodEntryService(FoodEntryRepository foodEntryRepository,
                            UserRepository userRepository,
                            AiParsingService aiParsingService) {
        this.foodEntryRepository = foodEntryRepository;
        this.userRepository = userRepository;
        this.aiParsingService = aiParsingService;
    }

    public List<FoodItemDto> parseWithAi(AiParseRequest request) {
        return aiParsingService.parseMeal(request.getRawText(), request.getMealType());
    }

    public PlateScanResponseDto scanMealPlate(MultipartFile file, String mealType, String notes) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select or capture a meal image");
        }
        try {
            String mimeType = file.getContentType();
            if (mimeType == null || !mimeType.startsWith("image/")) {
                mimeType = "image/jpeg";
            }
            byte[] imageBytes = file.getBytes();
            return aiParsingService.scanPlate(imageBytes, mimeType, mealType, notes);
        } catch (IOException e) {
            throw new BadRequestException("Failed to read image file: " + e.getMessage());
        }
    }

    @Transactional
    public List<FoodEntryDto> createEntries(UUID userId, CreateEntriesRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("No food items provided");
        }

        LocalDate date = request.getEntryDate() != null ? request.getEntryDate() : LocalDate.now();
        MealType mealType = MealType.fromString(request.getMealType());

        List<FoodEntry> entitiesToSave = new ArrayList<>();

        for (FoodItemDto item : request.getItems()) {
            FoodEntry entry = new FoodEntry();
            entry.setUser(user);
            entry.setEntryDate(date);
            entry.setMealType(mealType);
            entry.setFoodName(item.getFoodName() != null ? item.getFoodName() : "Unnamed Item");
            entry.setQuantity(item.getQuantity() != null ? item.getQuantity() : BigDecimal.ONE);
            entry.setUnit(item.getUnit() != null ? item.getUnit() : "serving");
            entry.setCalories(item.getCalories() != null ? item.getCalories() : 0);
            entry.setProteinG(item.getProteinG() != null ? item.getProteinG() : BigDecimal.ZERO);
            entry.setCarbsG(item.getCarbsG() != null ? item.getCarbsG() : BigDecimal.ZERO);
            entry.setFatG(item.getFatG() != null ? item.getFatG() : BigDecimal.ZERO);
            entry.setIsAiParsed(item.getIsAiParsed() != null ? item.getIsAiParsed() : true);

            entitiesToSave.add(entry);
        }

        List<FoodEntry> saved = foodEntryRepository.saveAll(entitiesToSave);
        return saved.stream().map(FoodEntryDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TodayEntriesResponse getTodayEntries(UUID userId) {
        LocalDate today = LocalDate.now();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<FoodEntry> entries = foodEntryRepository.findByUserIdAndEntryDate(userId, today);
        List<FoodEntryDto> dtos = entries.stream().map(FoodEntryDto::fromEntity).collect(Collectors.toList());

        Map<String, List<FoodEntryDto>> grouped = new LinkedHashMap<>();
        for (MealType mt : MealType.values()) {
            grouped.put(mt.name(), new ArrayList<>());
        }
        for (FoodEntryDto dto : dtos) {
            String key = dto.getMealType() != null ? dto.getMealType() : MealType.SNACK.name();
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(dto);
        }

        int totalCal = 0;
        BigDecimal totalP = BigDecimal.ZERO;
        BigDecimal totalC = BigDecimal.ZERO;
        BigDecimal totalF = BigDecimal.ZERO;

        for (FoodEntryDto dto : dtos) {
            if (dto.getCalories() != null) totalCal += dto.getCalories();
            if (dto.getProteinG() != null) totalP = totalP.add(dto.getProteinG());
            if (dto.getCarbsG() != null) totalC = totalC.add(dto.getCarbsG());
            if (dto.getFatG() != null) totalF = totalF.add(dto.getFatG());
        }

        TodayEntriesResponse response = new TodayEntriesResponse();
        response.setDate(today);
        response.setGroupedByMeal(grouped);
        response.setEntries(dtos);
        response.setTotalCalories(totalCal);
        response.setTotalProtein(totalP.setScale(1, RoundingMode.HALF_UP));
        response.setTotalCarbs(totalC.setScale(1, RoundingMode.HALF_UP));
        response.setTotalFat(totalF.setScale(1, RoundingMode.HALF_UP));
        response.setTargetCalories(user.getTargetCalories());
        response.setTargetProteinG(user.getTargetProteinG());

        return response;
    }

    @Transactional(readOnly = true)
    public List<FoodEntryDto> getHistoryByDate(UUID userId, LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        List<FoodEntry> entries = foodEntryRepository.findByUserIdAndEntryDate(userId, targetDate);
        return entries.stream().map(FoodEntryDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DailyStatsDto> getStats(UUID userId, int days) {
        if (days <= 0) days = 7;
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<FoodEntry> entries = foodEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateAsc(
                userId, startDate, endDate
        );

        // Group entries by date
        Map<LocalDate, List<FoodEntry>> byDate = entries.stream()
                .collect(Collectors.groupingBy(FoodEntry::getEntryDate));

        List<DailyStatsDto> stats = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate current = startDate.plusDays(i);
            List<FoodEntry> dayEntries = byDate.getOrDefault(current, Collections.emptyList());

            int cals = 0;
            BigDecimal p = BigDecimal.ZERO;
            BigDecimal c = BigDecimal.ZERO;
            BigDecimal f = BigDecimal.ZERO;

            for (FoodEntry fe : dayEntries) {
                if (fe.getCalories() != null) cals += fe.getCalories();
                if (fe.getProteinG() != null) p = p.add(fe.getProteinG());
                if (fe.getCarbsG() != null) c = c.add(fe.getCarbsG());
                if (fe.getFatG() != null) f = f.add(fe.getFatG());
            }

            stats.add(new DailyStatsDto(
                    current,
                    cals,
                    p.setScale(1, RoundingMode.HALF_UP),
                    c.setScale(1, RoundingMode.HALF_UP),
                    f.setScale(1, RoundingMode.HALF_UP),
                    user.getTargetCalories(),
                    user.getTargetProteinG()
            ));
        }

        return stats;
    }

    @Transactional(readOnly = true)
    public List<DailyStatsDto> getStatsByDateRange(UUID userId, LocalDate startDate, LocalDate endDate) {
        if (startDate == null) startDate = LocalDate.now().minusDays(30);
        if (endDate == null) endDate = LocalDate.now();
        if (startDate.isAfter(endDate)) {
            LocalDate tmp = startDate;
            startDate = endDate;
            endDate = tmp;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<FoodEntry> entries = foodEntryRepository.findByUserIdAndEntryDateBetweenOrderByEntryDateAsc(
                userId, startDate, endDate
        );

        // Group entries by date
        Map<LocalDate, List<FoodEntry>> byDate = entries.stream()
                .collect(Collectors.groupingBy(FoodEntry::getEntryDate));

        long totalDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        List<DailyStatsDto> stats = new ArrayList<>();
        for (int i = 0; i < totalDays; i++) {
            LocalDate current = startDate.plusDays(i);
            List<FoodEntry> dayEntries = byDate.getOrDefault(current, Collections.emptyList());

            int cals = 0;
            BigDecimal p = BigDecimal.ZERO;
            BigDecimal c = BigDecimal.ZERO;
            BigDecimal f = BigDecimal.ZERO;

            for (FoodEntry fe : dayEntries) {
                if (fe.getCalories() != null) cals += fe.getCalories();
                if (fe.getProteinG() != null) p = p.add(fe.getProteinG());
                if (fe.getCarbsG() != null) c = c.add(fe.getCarbsG());
                if (fe.getFatG() != null) f = f.add(fe.getFatG());
            }

            stats.add(new DailyStatsDto(
                    current,
                    cals,
                    p.setScale(1, RoundingMode.HALF_UP),
                    c.setScale(1, RoundingMode.HALF_UP),
                    f.setScale(1, RoundingMode.HALF_UP),
                    user.getTargetCalories(),
                    user.getTargetProteinG()
            ));
        }

        return stats;
    }

    @Transactional
    public void deleteEntry(UUID userId, UUID entryId) {
        foodEntryRepository.deleteByIdAndUserId(entryId, userId);
    }
}
