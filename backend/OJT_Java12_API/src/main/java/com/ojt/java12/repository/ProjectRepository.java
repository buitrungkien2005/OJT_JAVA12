package com.ojt.java12.repository;

import com.ojt.java12.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("SELECT DISTINCT p FROM Project p " +
           "LEFT JOIN p.members m " +
           "WHERE p.owner.id = :userId OR m.user.id = :userId " +
           "ORDER BY p.updatedAt DESC")
    List<Project> findAccessibleProjectsForUser(@Param("userId") Long userId);

    @Query("SELECT DISTINCT p FROM Project p " +
           "LEFT JOIN p.members m " +
           "WHERE (:userId IS NULL OR p.owner.id = :userId OR m.user.id = :userId) AND " +
           "(:search IS NULL OR :search = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Project> searchAccessibleProjects(
            @Param("userId") Long userId,
            @Param("search") String search,
            Pageable pageable
    );
}
