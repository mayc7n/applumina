package com.lumina.infrastructure.security;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumina.api.dto.ApiResponse;
import com.lumina.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.*;
import java.util.*;

@Configuration @EnableWebSecurity @EnableMethodSecurity @RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtFilter;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final RateLimitFilter rateLimitFilter;
    private final CookieOriginFilter cookieOriginFilter;
    @Value("${lumina.security.cors.allowed-origins}") private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(c -> c.configurationSource(corsConfigSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers(HttpMethod.POST, "/auth/mobile/**").permitAll()
                .requestMatchers(HttpMethod.POST,"/auth/register","/auth/login","/auth/refresh",
                    "/auth/logout","/auth/forgot-password","/auth/reset-password","/auth/verify-email").permitAll()
                .requestMatchers("/auth/oauth2/**","/actuator/health","/actuator/info",
                    "/billing/webhook","/v3/api-docs/**","/swagger-ui/**","/swagger-ui.html").permitAll()
                .anyRequest().authenticated())
            .headers(h -> h
                .frameOptions(f -> f.deny())
                .httpStrictTransportSecurity(s -> s.maxAgeInSeconds(31536000).includeSubDomains(true).preload(true))
                .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .contentSecurityPolicy(c -> c.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
                .addHeaderWriter((request, response) -> {
                    response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
                    response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                    response.setHeader("Cross-Origin-Resource-Policy", "same-site");
                    response.setHeader("X-Permitted-Cross-Domain-Policies", "none");
                }))
            .exceptionHandling(e -> e
                .authenticationEntryPoint((request, response, exception) -> {
                    response.setStatus(401);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    objectMapper.writeValue(
                        response.getOutputStream(),
                        ApiResponse.error("UNAUTHORIZED", "Autenticação necessária")
                    );
                })
                .accessDeniedHandler((request, response, exception) -> {
                    response.setStatus(403);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    objectMapper.writeValue(
                        response.getOutputStream(),
                        ApiResponse.error("ACCESS_DENIED", "Permissão insuficiente")
                    );
                }))
            .authenticationProvider(authenticationProvider(userDetailsService(), passwordEncoder()))
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(cookieOriginFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigSource() {
        var config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(allowedOrigins.split(",")).map(String::trim).toList());
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of(
            "Authorization", "Content-Type", "Accept", "X-Requested-With", "X-Lumina-Legacy-Session"
        ));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return email -> userRepository.findByEmailAndDeletedAtIsNull(email)
            .map(user -> org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(Optional.ofNullable(user.getPasswordHash()).orElse(""))
                .roles(user.getRole().name())
                .disabled(!user.isActive())
                .build())
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Bean public AuthenticationProvider authenticationProvider(
        UserDetailsService userDetailsService,
        PasswordEncoder passwordEncoder
    ) {
        var p = new DaoAuthenticationProvider();
        p.setUserDetailsService(userDetailsService);
        p.setPasswordEncoder(passwordEncoder);
        return p;
    }
    @Bean public AuthenticationManager authenticationManager(AuthenticationConfiguration c) throws Exception { return c.getAuthenticationManager(); }
    @Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
}
