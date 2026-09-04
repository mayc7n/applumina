package com.lumina;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication @EnableCaching @EnableAsync @EnableScheduling @EnableTransactionManagement(order = 0)
public class LuminaApplication {
    public static void main(String[] args) {
        SpringApplication.run(LuminaApplication.class, args);
    }
}
