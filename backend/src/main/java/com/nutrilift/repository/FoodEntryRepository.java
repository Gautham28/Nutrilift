package com.nutrilift.repository;

import com.nutrilift.model.FoodEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FoodEntryRepository extends JpaRepository<FoodEntry, UUID> {

    List<FoodEntry> findByUserIdAndEntryDate(UUID userId, LocalDate entryDate);

    List<FoodEntry> findByUserIdAndEntryDateBetweenOrderByEntryDateAsc(UUID userId, LocalDate startDate, LocalDate endDate);

    Optional<FoodEntry> findByIdAndUserId(UUID id, UUID userId);

    void deleteByIdAndUserId(UUID id, UUID userId);
}
