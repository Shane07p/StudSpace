package com.studspace.course;

import com.studspace.semester.Semester;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @Column(length = 20)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 100)
    private String instructor;

    @Builder.Default
    private int credits = 3;

    @Column(name = "total_classes")
    @Builder.Default
    private int totalClasses = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
