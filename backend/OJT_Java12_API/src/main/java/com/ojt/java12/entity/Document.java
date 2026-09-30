package com.ojt.java12.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "documents",
    indexes = {
        @Index(name = "idx_documents_project_id", columnList = "project_id"),
        @Index(name = "idx_documents_uploader_id", columnList = "uploader_id"),
        @Index(name = "idx_documents_category", columnList = "file_category")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_category", nullable = false, length = 30)
    private FileCategory fileCategory;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "object_key", nullable = false, unique = true, length = 255)
    private String objectKey;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploader_id", nullable = false)
    private User uploader;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
