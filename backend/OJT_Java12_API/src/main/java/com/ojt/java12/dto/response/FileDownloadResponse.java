package com.ojt.java12.dto.response;

import org.springframework.core.io.Resource;

public record FileDownloadResponse(
    Resource resource,
    String filename,
    String contentType
) {}
