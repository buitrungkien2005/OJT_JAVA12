package com.ojt.java12.repository;

import com.ojt.java12.entity.Document;
import com.ojt.java12.entity.FileCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    @Query("SELECT d FROM Document d WHERE d.project.id = :projectId " +
           "AND (:category IS NULL OR d.fileCategory = :category) " +
           "AND (:search IS NULL OR :search = '' OR LOWER(d.originalName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Document> searchProjectDocuments(
            @Param("projectId") Long projectId,
            @Param("category") FileCategory category,
            @Param("search") String search,
            Pageable pageable
    );

    List<Document> findByProjectId(Long projectId);

    java.util.Optional<Document> findByObjectKey(String objectKey);

    long countByProjectId(Long projectId);
}
