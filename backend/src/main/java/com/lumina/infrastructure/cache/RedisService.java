package com.lumina.infrastructure.cache;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.util.Set;

@Service @RequiredArgsConstructor @Slf4j
public class RedisService {
    private final RedisTemplate<String,String> redisTemplate;
    public void set(String k,String v,Duration ttl){ redisTemplate.opsForValue().set(k,v,ttl); }
    public String get(String k){ return redisTemplate.opsForValue().get(k); }
    public boolean exists(String k){ return Boolean.TRUE.equals(redisTemplate.hasKey(k)); }
    public void delete(String k){ redisTemplate.delete(k); }
    public void deletePattern(String pattern){ try{ Set<String> ks=redisTemplate.keys(pattern); if(ks!=null&&!ks.isEmpty()) redisTemplate.delete(ks); }catch(Exception e){log.warn("Failed delete pattern: {}",pattern);} }
    public Long increment(String k){ return redisTemplate.opsForValue().increment(k); }
    public void expire(String k,Duration ttl){ redisTemplate.expire(k,ttl); }
    public Long getExpireSeconds(String k){ return redisTemplate.getExpire(k,java.util.concurrent.TimeUnit.SECONDS); }
}
