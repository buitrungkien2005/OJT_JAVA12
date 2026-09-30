package com.ojt.java12.util;

import com.ojt.java12.entity.FileCategory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Set;

@Component
public class FileValidator {

    private static final Set<String> DOCUMENT_EXTENSIONS = Set.of(
            "pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "md", "txt"
    );

    private static final Set<String> IMAGE_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "svg", "bmp"
    );

    private static final Set<String> VIDEO_EXTENSIONS = Set.of(
            "mp4", "mov", "avi"
    );

    private static final Map<String, String> MIME_TYPES = Map.ofEntries(
            Map.entry("pdf", "application/pdf"),
            Map.entry("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            Map.entry("doc", "application/msword"),
            Map.entry("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
            Map.entry("xls", "application/vnd.ms-excel"),
            Map.entry("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
            Map.entry("ppt", "application/vnd.ms-powerpoint"),
            Map.entry("md", "text/markdown"),
            Map.entry("txt", "text/plain"),
            Map.entry("jpg", "image/jpeg"),
            Map.entry("jpeg", "image/jpeg"),
            Map.entry("png", "image/png"),
            Map.entry("gif", "image/gif"),
            Map.entry("svg", "image/svg+xml"),
            Map.entry("bmp", "image/bmp"),
            Map.entry("mp4", "video/mp4"),
            Map.entry("mov", "video/quicktime"),
            Map.entry("avi", "video/x-msvideo")
    );

    private final long maxSizeBytes;

    public FileValidator(@Value("${app.upload.max-size-bytes:52428800}") long maxSizeBytes) {
        this.maxSizeBytes = maxSizeBytes;
    }

    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        if (file.getSize() > maxSizeBytes) {
            throw new IllegalArgumentException(String.format("File size exceeds maximum limit of %d MB", maxSizeBytes / (1024 * 1024)));
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new IllegalArgumentException("File must have a valid extension");
        }

        String extension = getExtension(originalFilename);
        if (!DOCUMENT_EXTENSIONS.contains(extension) &&
            !IMAGE_EXTENSIONS.contains(extension) &&
            !VIDEO_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Unsupported file format ." + extension + ". Allowed: " +
                    "documents (pdf, docx, doc, xlsx, xls, pptx, ppt, md, txt), " +
                    "images (jpg, png, gif, svg, bmp), videos (mp4, mov, avi)"
            );
        }
    }

    public FileCategory resolveCategory(String filename) {
        String ext = getExtension(filename);
        if (IMAGE_EXTENSIONS.contains(ext)) {
            return FileCategory.IMAGE;
        } else if (VIDEO_EXTENSIONS.contains(ext)) {
            return FileCategory.VIDEO;
        } else if (DOCUMENT_EXTENSIONS.contains(ext)) {
            return FileCategory.DOCUMENT;
        }
        throw new IllegalArgumentException("Unknown file category for extension: " + ext);
    }

    public String resolveMimeType(String filename, String fallbackMimeType) {
        String ext = getExtension(filename);
        String detected = MIME_TYPES.get(ext);
        if (detected != null) {
            return detected;
        }
        return (fallbackMimeType != null && !fallbackMimeType.isBlank()) ? fallbackMimeType : "application/octet-stream";
    }

    public String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
