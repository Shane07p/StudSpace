package com.studspace.user;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "user_handles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserHandle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 50, nullable = false)
    private String platform;

    @Column(length = 500)
    private String url;

    @Column(name = "display_order")
    private int displayOrder;
}
