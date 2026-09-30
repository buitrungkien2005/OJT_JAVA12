package com.ojt.java12.service.impl;

import com.ojt.java12.dto.response.DocumentResponse;
import com.ojt.java12.dto.response.DocumentUrlResponse;
import com.ojt.java12.dto.response.FileDownloadResponse;
import com.ojt.java12.dto.response.PagedResponse;
import com.ojt.java12.dto.response.UserResponse;
import com.ojt.java12.entity.Document;
import com.ojt.java12.entity.FileCategory;
import com.ojt.java12.entity.Project;
import com.ojt.java12.entity.User;
import com.ojt.java12.repository.DocumentRepository;
import com.ojt.java12.repository.ProjectMemberRepository;
import com.ojt.java12.repository.ProjectRepository;
import com.ojt.java12.repository.UserRepository;
import com.ojt.java12.service.DocumentService;
import com.ojt.java12.service.StorageService;
import com.ojt.java12.util.FileValidator;
import com.ojt.java12.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final FileValidator fileValidator;
    private final SecurityUtil securityUtil;

    @Override
    public DocumentResponse uploadDocument(Long projectId, MultipartFile file) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NoSuchElementException("Project not found with id: " + projectId));

        User currentUser = getCurrentUser();
        checkProjectAccess(project, currentUser);

        fileValidator.validate(file);

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "unnamed_file";
        }
        // Sanitize filename
        originalFilename = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");

        FileCategory category = fileValidator.resolveCategory(originalFilename);
        String mimeType = fileValidator.resolveMimeType(originalFilename, file.getContentType());
        String objectKey = "projects/" + projectId + "/" + UUID.randomUUID() + "_" + originalFilename;

        try (InputStream inputStream = file.getInputStream()) {
            storageService.uploadFile(objectKey, inputStream, file.getSize(), mimeType);
        } catch (Exception e) {
            log.error("Failed to process and upload file: {}", e.getMessage(), e);
            throw new RuntimeException("File upload failed: " + e.getMessage());
        }

        Document document = Document.builder()
                .originalName(originalFilename)
                .mimeType(mimeType)
                .fileCategory(category)
                .fileSize(file.getSize())
                .objectKey(objectKey)
                .uploader(currentUser)
                .project(project)
                .build();

        Document saved = documentRepository.save(document);
        return toDocumentResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<DocumentResponse> getProjectDocuments(
            Long projectId,
            int page,
            int size,
            String search,
            FileCategory category
    ) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NoSuchElementException("Project not found with id: " + projectId));

        User currentUser = getCurrentUser();
        checkProjectAccess(project, currentUser);

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("createdAt").descending());
        Page<Document> docPage = documentRepository.searchProjectDocuments(projectId, category, search, pageable);

        return new PagedResponse<>(
                docPage.getContent().stream().map(this::toDocumentResponse).toList(),
                docPage.getNumber(),
                docPage.getSize(),
                docPage.getTotalElements(),
                docPage.getTotalPages(),
                docPage.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentResponse getDocumentById(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Document not found with id: " + id));

        User currentUser = getCurrentUser();
        checkProjectAccess(document.getProject(), currentUser);

        return toDocumentResponse(document);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentUrlResponse getDocumentDownloadUrl(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Document not found with id: " + id));

        User currentUser = getCurrentUser();
        checkProjectAccess(document.getProject(), currentUser);

        String presignedUrl = storageService.generatePresignedUrl(document.getObjectKey(), 3600); // 1 hour validity
        return new DocumentUrlResponse(presignedUrl, document.getOriginalName(), document.getMimeType());
    }

    @Override
    @Transactional(readOnly = true)
    public FileDownloadResponse getFileDownload(String objectKey) {
        Document document = documentRepository.findByObjectKey(objectKey)
                .orElseThrow(() -> new NoSuchElementException("File not found for key: " + objectKey));

        Resource resource = storageService.loadFileAsResource(objectKey);
        return new FileDownloadResponse(resource, document.getOriginalName(), document.getMimeType());
    }

    @Override
    public void deleteDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Document not found with id: " + id));

        User currentUser = getCurrentUser();
        boolean isUploader = document.getUploader().getId().equals(currentUser.getId());
        boolean isOwner = document.getProject().getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = securityUtil.isAdmin();

        if (!isUploader && !isOwner && !isAdmin) {
            throw new AccessDeniedException("Only the uploader, project owner, or an administrator can delete this document");
        }

        try {
            storageService.deleteFile(document.getObjectKey());
        } catch (Exception e) {
            log.warn("Storage deletion error for key {}: {}", document.getObjectKey(), e.getMessage());
        }

        documentRepository.delete(document);
    }

    private void checkProjectAccess(Project project, User user) {
        if (securityUtil.isAdmin()) {
            return;
        }
        boolean isOwner = project.getOwner().getId().equals(user.getId());
        boolean isMember = projectMemberRepository.existsByProjectIdAndUserId(project.getId(), user.getId());
        if (!isOwner && !isMember) {
            throw new AccessDeniedException("You do not have access to this project's documents");
        }
    }

    private User getCurrentUser() {
        String email = securityUtil.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));
    }

    private DocumentResponse toDocumentResponse(Document doc) {
        return new DocumentResponse(
                doc.getId(),
                doc.getOriginalName(),
                doc.getMimeType(),
                doc.getFileCategory(),
                doc.getFileSize(),
                toUserResponse(doc.getUploader()),
                doc.getProject().getId(),
                doc.getCreatedAt()
        );
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
