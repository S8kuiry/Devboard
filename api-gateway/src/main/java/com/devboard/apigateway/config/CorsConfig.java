package com.devboard.apigateway.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * The single CORS layer for the whole system — the browser only ever talks to the gateway.
 *
 * This must stay a Java config class. The servlet gateway
 * (spring-cloud-gateway-server-webmvc) exposes NO cors.* properties; the
 * `spring.cloud.gateway.globalcors.*` keys belong to the reactive/webflux gateway only.
 * Configuring CORS via application.properties here fails silently: Spring Boot ignores
 * the unknown keys, the app starts clean, and every browser request is blocked with no
 * server-side error.
 *
 * Downstream services must NOT add their own CORS config — two layers make the gateway
 * proxy duplicate Access-Control-Allow-Origin headers, which the browser also rejects.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // allowedOriginPatterns, not allowedOrigins: the literal "*" is illegal
                // when allowCredentials is true, and Spring throws at startup.
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
