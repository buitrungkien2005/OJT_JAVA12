package com.ojt.java12.dto.response;

public record DocumentUrlResponse(
    String url,
    String originalName,
    String mimeType
) {}
