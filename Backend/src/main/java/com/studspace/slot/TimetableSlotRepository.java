package com.studspace.slot;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TimetableSlotRepository extends JpaRepository<TimetableSlot, UUID> {
    List<TimetableSlot> findBySemesterIdOrderByDayAscStartTimeAsc(UUID semesterId);

    List<TimetableSlot> findBySemesterIdAndDay(UUID semesterId, String day);
}
