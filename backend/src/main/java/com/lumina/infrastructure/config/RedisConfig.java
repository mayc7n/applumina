package com.lumina.infrastructure.config;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.*;
import org.springframework.data.redis.cache.*;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.*;
import java.time.Duration;

@Configuration @EnableCaching
public class RedisConfig {
    @Bean
    public RedisTemplate<String,String> redisTemplate(RedisConnectionFactory f) {
        var t = new RedisTemplate<String,String>();
        t.setConnectionFactory(f);
        var s = new StringRedisSerializer();
        t.setKeySerializer(s); t.setHashKeySerializer(s);
        t.setValueSerializer(s); t.setHashValueSerializer(s);
        t.setDefaultSerializer(s); t.afterPropertiesSet(); return t;
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory f) {
        var json = new GenericJackson2JsonRedisSerializer();
        var def = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(60))
            .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(json))
            .disableCachingNullValues();
        return RedisCacheManager.builder(f)
            .cacheDefaults(def)
            .withCacheConfiguration("users", def.entryTtl(Duration.ofMinutes(15)))
            .withCacheConfiguration("dashboard", def.entryTtl(Duration.ofMinutes(3)))
            .withCacheConfiguration("analytics", def.entryTtl(Duration.ofMinutes(5)))
            .build();
    }
}
