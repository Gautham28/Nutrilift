package com.nutrilift.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrilift.config.UserPrincipal;
import com.nutrilift.service.RateLimitingService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/**
 * HTTP filter that intercepts requests to computationally intensive AI endpoints
 * and enforces Token Bucket rate limits per user/IP.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> AI_RATE_LIMITED_PATHS = Set.of(
            "/api/entries/ai-parse",
            "/api/entries/scan-plate",
            "/api/profile/ai-targets"
    );

    private final RateLimitingService rateLimitingService;
    private final ObjectMapper objectMapper;

    public RateLimitFilter(RateLimitingService rateLimitingService, ObjectMapper objectMapper) {
        this.rateLimitingService = rateLimitingService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return AI_RATE_LIMITED_PATHS.stream().noneMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String clientKey = resolveClientKey(request);
        RateLimitingService.RateLimitResult result = rateLimitingService.tryConsume(clientKey, 1);

        if (result.isAllowed()) {
            response.setHeader("X-RateLimit-Remaining", String.valueOf(result.getTokensRemaining()));
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429); // 429 Too Many Requests
            response.setHeader("Retry-After", String.valueOf(result.getRetryAfterSeconds()));
            response.setHeader("X-RateLimit-Retry-After-Seconds", String.valueOf(result.getRetryAfterSeconds()));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            Map<String, Object> body = Map.of(
                    "status", 429,
                    "error", "Too Many Requests",
                    "message", "AI rate limit reached. Please wait " + result.getRetryAfterSeconds() + " seconds before making another request.",
                    "retryAfterSeconds", result.getRetryAfterSeconds()
            );

            objectMapper.writeValue(response.getOutputStream(), body);
        }
    }

    private String resolveClientKey(HttpServletRequest request) {
        // 1. Check if user is authenticated
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            return "user:" + principal.getId();
        }

        // 2. Fall back to Client IP for unauthenticated / guest sessions
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return "ip:" + xForwardedFor.split(",")[0].trim();
        }

        return "ip:" + request.getRemoteAddr();
    }
}
