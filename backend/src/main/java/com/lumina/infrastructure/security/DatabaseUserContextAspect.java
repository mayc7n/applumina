package com.lumina.infrastructure.security;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class DatabaseUserContextAspect {
    private final JdbcTemplate jdbcTemplate;

    public DatabaseUserContextAspect(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Around("@annotation(org.springframework.transaction.annotation.Transactional)")
    public Object setDatabaseUser(ProceedingJoinPoint joinPoint) throws Throwable {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            jdbcTemplate.queryForObject(
                "SELECT set_config('lumina.user_id', ?, true)",
                String.class,
                principal.getUserId().toString()
            );
        }
        return joinPoint.proceed();
    }
}
