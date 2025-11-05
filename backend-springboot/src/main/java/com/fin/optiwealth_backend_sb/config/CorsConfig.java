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
                "http://localhost:*"
        ));

        config.setAllowCredentials(true);          // allow cookies / JWT headers
        config.setAllowedHeaders(Arrays.asList("*"));  // allow all headers
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS")); // explicitly list methods

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
