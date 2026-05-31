package com.studspace.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserHandleRepository extends JpaRepository<UserHandle, UUID> {
    List<UserHandle> findByUserIdOrderByDisplayOrderAsc(UUID userId);
    void deleteByUserId(UUID userId);
}
