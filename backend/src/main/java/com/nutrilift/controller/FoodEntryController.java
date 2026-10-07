package com.nutrilift.controller;

import com.nutrilift.config.UserPrincipal;
import com.nutrilift.dto.*;
import com.nutrilift.service.FoodEntryService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/entries")
public class FoodEntryController {

    private final FoodEntryService foodEntryService;

    public FoodEntryController(FoodEntryService foodEntryService) {
        this.foodEntryService = foodEntryService;
    }

    @PostMapping("/ai-parse")
    public ResponseEntity<List<FoodItemDto>> parseWithAi(@Valid @RequestBody AiParseRequest request) {
        List<FoodItemDto> parsedItems = foodEntryService.parseWithAi(request);
        return ResponseEntity.ok(parsedItems);
    }

    @PostMapping
    public ResponseEntity<List<FoodEntryDto>> createEntries(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateEntriesRequest request) {
        List<FoodEntryDto> created = foodEntryService.createEntries(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/today")
    public ResponseEntity<TodayEntriesResponse> getTodayEntries(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        TodayEntriesResponse todayEntries = foodEntryService.getTodayEntries(currentUser.getId());
        return ResponseEntity.ok(todayEntries);
    }

    @GetMapping("/history")
    public ResponseEntity<List<FoodEntryDto>> getHistory(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<FoodEntryDto> history = foodEntryService.getHistoryByDate(currentUser.getId(), date);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/stats")
    public ResponseEntity<List<DailyStatsDto>> getStats(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "7") int days) {
        List<DailyStatsDto> stats = foodEntryService.getStats(currentUser.getId(), days);
        return ResponseEntity.ok(stats);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID id) {
        foodEntryService.deleteEntry(currentUser.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
