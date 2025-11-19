package com.fin.optiwealth_backend_sb.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // Allow Vercel frontend and localhost (for testing)
        config.setAllowedOriginPatterns(Arrays.asList(
                "https://optiwealth-drab.vercel.app",
                "https://*.vercel.app",
                "http://localhost:*",
                "http://localhost:5173"
        ));

        config.setAllowCredentials(true);          // allow cookies / JWT headers
        config.setAllowedHeaders(Arrays.asList("*"));  // allow all headers
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")); // explicitly list methods
        config.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
        config.setMaxAge(3600L); // Cache preflight response for 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
