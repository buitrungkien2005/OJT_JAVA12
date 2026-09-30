package com.ojt.java12.controller;

import com.ojt.java12.dto.response.DocumentResponse;
import com.ojt.java12.dto.response.DocumentUrlResponse;
import com.ojt.java12.dto.response.FileDownloadResponse;
import com.ojt.java12.dto.response.PagedResponse;
import com.ojt.java12.entity.FileCategory;
import com.ojt.java12.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Tag(name = "Documents", description = "Endpoints for uploading, listing, downloading, and deleting project documents")
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(value = "/projects/{projectId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload document to project", description = "Uploads a document, image, or video to the project and stores in MinIO")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Document uploaded successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid file type or size exceeds limit"),
            @ApiResponse(responseCode = "403", description = "Forbidden - not a project member"),
            @ApiResponse(responseCode = "404", description = "Project not found")
    })
    public ResponseEntity<DocumentResponse> uploadDocument(
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file
    ) {
        DocumentResponse response = documentService.uploadDocument(projectId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/projects/{projectId}")
    @Operation(summary = "List project documents", description = "Returns a paged list of documents within a project with optional search and category filter")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Documents listed successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - not a member"),
            @ApiResponse(responseCode = "404", description = "Project not found")
    })
    public ResponseEntity<PagedResponse<DocumentResponse>> getProjectDocuments(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) FileCategory category
    ) {
        PagedResponse<DocumentResponse> response = documentService.getProjectDocuments(projectId, page, size, search, category);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get document metadata", description = "Returns document metadata by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document found"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    public ResponseEntity<DocumentResponse> getDocumentById(@PathVariable Long id) {
        DocumentResponse response = documentService.getDocumentById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/url")
    @Operation(summary = "Get document presigned URL", description = "Generates a presigned MinIO URL for viewing or downloading the document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Presigned URL generated successfully"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    public ResponseEntity<DocumentUrlResponse> getDocumentDownloadUrl(@PathVariable Long id) {
        DocumentUrlResponse response = documentService.getDocumentDownloadUrl(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/file")
    @Operation(summary = "Serve document file content", description = "Streams document file content directly for in-browser preview or download")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "File served successfully"),
            @ApiResponse(responseCode = "404", description = "File not found")
    })
    public ResponseEntity<Resource> serveFile(@RequestParam("key") String objectKey) {
        FileDownloadResponse file = documentService.getFileDownload(objectKey);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.filename() + "\"")
                .body(file.resource());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete document", description = "Deletes a document from database and MinIO storage (uploader, owner, or admin only)")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Document deleted successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - unauthorized to delete"),
            @ApiResponse(responseCode = "404", description = "Document not found")
    })
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }
}
