package com.ojt.java12.service;

import com.ojt.java12.dto.response.DocumentResponse;
import com.ojt.java12.dto.response.DocumentUrlResponse;
import com.ojt.java12.dto.response.FileDownloadResponse;
import com.ojt.java12.dto.response.PagedResponse;
import com.ojt.java12.entity.FileCategory;
import org.springframework.web.multipart.MultipartFile;

public interface DocumentService {

    DocumentResponse uploadDocument(Long projectId, MultipartFile file);

    PagedResponse<DocumentResponse> getProjectDocuments(Long projectId, int page, int size, String search, FileCategory category);

    DocumentResponse getDocumentById(Long id);

    DocumentUrlResponse getDocumentDownloadUrl(Long id);

    FileDownloadResponse getFileDownload(String objectKey);

    void deleteDocument(Long id);
}
