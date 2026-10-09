package com.nutrilift.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Token Bucket Rate Limiting service implemented using Bucket4j.
 * Protects AI endpoints against quota exhaustion, DoS, and spam.
 * Provides per-user and per-IP enforcement with RFC 6585 retry headers.
 */
@Service
public class RateLimitingService {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingService.class);

    // Limit: 15 token capacity, refills 10 tokens every 1 minute
    private static final long BUCKET_CAPACITY = 15;
    private static final long REFILL_TOKENS = 10;
    private static final Duration REFILL_DURATION = Duration.ofMinutes(1);

    private final Map<String, Bucket> bucketMap = new ConcurrentHashMap<>();

    public RateLimitResult tryConsume(String key, long tokens) {
        Bucket bucket = bucketMap.computeIfAbsent(key, this::createNewBucket);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(tokens);

        if (probe.isConsumed()) {
            return new RateLimitResult(true, probe.getRemainingTokens(), 0);
        } else {
            long retryAfterSeconds = Math.max(1, (probe.getNanosToWaitForRefill() / 1_000_000_000L) + 1);
            log.warn("⛔ [RATE LIMIT EXCEEDED] Client: [{}] - Retry after: {}s", key, retryAfterSeconds);
            return new RateLimitResult(false, 0, retryAfterSeconds);
        }
    }

    private Bucket createNewBucket(String key) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(BUCKET_CAPACITY)
                .refillGreedy(REFILL_TOKENS, REFILL_DURATION)
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    public static class RateLimitResult {
        private final boolean allowed;
        private final long tokensRemaining;
        private final long retryAfterSeconds;

        public RateLimitResult(boolean allowed, long tokensRemaining, long retryAfterSeconds) {
            this.allowed = allowed;
            this.tokensRemaining = tokensRemaining;
            this.retryAfterSeconds = retryAfterSeconds;
        }

        public boolean isAllowed() {
            return allowed;
        }

        public long getTokensRemaining() {
            return tokensRemaining;
        }

        public long getRetryAfterSeconds() {
            return retryAfterSeconds;
        }
    }
}
