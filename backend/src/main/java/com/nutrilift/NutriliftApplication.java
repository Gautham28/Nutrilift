package com.nutrilift;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

@SpringBootApplication
public class NutriliftApplication {

    public static void main(String[] args) {
        loadDotEnvIfPresent();
        SpringApplication.run(NutriliftApplication.class, args);
    }

    private static void loadDotEnvIfPresent() {
        // Look for .env in current working dir or parent directory
        File envFile = new File(".env");
        if (!envFile.exists()) {
            envFile = new File("../.env");
        }
        if (envFile.exists()) {
            try {
                List<String> lines = Files.readAllLines(envFile.toPath());
                for (String line : lines) {
                    String trimmed = line.trim();
                    if (trimmed.isEmpty() || trimmed.startsWith("#")) continue;
                    int eqIndex = trimmed.indexOf('=');
                    if (eqIndex > 0) {
                        String key = trimmed.substring(0, eqIndex).trim();
                        String value = trimmed.substring(eqIndex + 1).trim();
                        if (System.getProperty(key) == null && System.getenv(key) == null) {
                            System.setProperty(key, value);
                        }
                    }
                }
                System.out.println("[NutriLift] Loaded configuration from " + envFile.getCanonicalPath());
            } catch (Exception e) {
                System.err.println("[NutriLift] Notice: Could not read .env file: " + e.getMessage());
            }
        }
    }
}
