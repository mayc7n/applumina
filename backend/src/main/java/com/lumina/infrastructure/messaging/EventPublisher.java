package com.lumina.infrastructure.messaging;
import com.lumina.infrastructure.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Component @RequiredArgsConstructor @Slf4j
public class EventPublisher {
    private final RabbitTemplate rabbit;
    @Async public void publishHabitCompleted(UUID uid,UUID hid,int streak){ publish(RabbitMQConfig.EX_LUMINA,RabbitMQConfig.RK_ANALYTICS,new HabitCompletedEvent(uid.toString(),hid.toString(),streak)); }
    @Async public void publishAchievementCheck(UUID uid,String code){ publish(RabbitMQConfig.EX_LUMINA,RabbitMQConfig.RK_ACHIEVE,new AchievementCheckEvent(uid.toString(),code)); }
    @Async public void publishEmail(String to,String name,String template,java.util.Map<String,String> vars){ publish(RabbitMQConfig.EX_LUMINA,RabbitMQConfig.RK_EMAIL,new EmailEvent(template,to,name,vars)); }
    @Async public void publishNotification(String uid,String type,String title,String body){ publish(RabbitMQConfig.EX_NOTIF,RabbitMQConfig.RK_NOTIF,new NotificationEvent(uid,type,title,body)); }
    private void publish(String ex,String rk,Object payload){ try{ rabbit.convertAndSend(ex,rk,payload); }catch(Exception e){log.error("Publish failed {}/{}: {}",ex,rk,e.getMessage());} }
    public record HabitCompletedEvent(String userId,String habitId,int streak){}
    public record AchievementCheckEvent(String userId,String achievementCode){}
    public record EmailEvent(String template,String to,String name,java.util.Map<String,String> variables){}
    public record NotificationEvent(String userId,String type,String title,String body){}
}
