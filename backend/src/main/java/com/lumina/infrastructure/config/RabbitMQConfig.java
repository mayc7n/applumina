package com.lumina.infrastructure.config;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.*;
import org.springframework.context.annotation.*;

@Configuration
public class RabbitMQConfig {
    public static final String EX_LUMINA="lumina.events", EX_NOTIF="lumina.notifications", EX_DLX="lumina.dlx";
    public static final String Q_EMAIL="lumina.email", Q_NOTIF="lumina.notifications", Q_ANALYTICS="lumina.analytics",
        Q_HABIT="lumina.habit-reminders", Q_ACHIEVE="lumina.achievements", Q_DLQ="lumina.dlq";
    public static final String RK_EMAIL="email.send", RK_NOTIF="notification.push", RK_ANALYTICS="analytics.event",
        RK_HABIT="habit.reminder", RK_ACHIEVE="achievement.check";

    @Bean TopicExchange luminaExchange(){ return ExchangeBuilder.topicExchange(EX_LUMINA).durable(true).build(); }
    @Bean TopicExchange notifExchange() { return ExchangeBuilder.topicExchange(EX_NOTIF).durable(true).build(); }
    @Bean DirectExchange dlxExchange()  { return ExchangeBuilder.directExchange(EX_DLX).durable(true).build(); }

    private Queue durable(String name){ return QueueBuilder.durable(name).withArgument("x-dead-letter-exchange",EX_DLX).withArgument("x-dead-letter-routing-key","dlq").build(); }
    @Bean Queue emailQueue()    { return durable(Q_EMAIL); }
    @Bean Queue notifQueue()    { return durable(Q_NOTIF); }
    @Bean Queue analyticsQueue(){ return durable(Q_ANALYTICS); }
    @Bean Queue habitQueue()    { return durable(Q_HABIT); }
    @Bean Queue achieveQueue()  { return durable(Q_ACHIEVE); }
    @Bean Queue dlqQueue()      { return QueueBuilder.durable(Q_DLQ).build(); }

    @Bean Binding emailBinding(TopicExchange luminaExchange)    { return BindingBuilder.bind(emailQueue()).to(luminaExchange).with(RK_EMAIL); }
    @Bean Binding notifBinding(TopicExchange notifExchange)     { return BindingBuilder.bind(notifQueue()).to(notifExchange).with(RK_NOTIF); }
    @Bean Binding analyticsBinding(TopicExchange luminaExchange){ return BindingBuilder.bind(analyticsQueue()).to(luminaExchange).with(RK_ANALYTICS); }
    @Bean Binding habitBinding(TopicExchange luminaExchange)    { return BindingBuilder.bind(habitQueue()).to(luminaExchange).with(RK_HABIT); }
    @Bean Binding achieveBinding(TopicExchange luminaExchange)  { return BindingBuilder.bind(achieveQueue()).to(luminaExchange).with(RK_ACHIEVE); }
    @Bean Binding dlqBinding(DirectExchange dlxExchange)        { return BindingBuilder.bind(dlqQueue()).to(dlxExchange).with("dlq"); }

    @Bean public MessageConverter jsonConverter(){ return new Jackson2JsonMessageConverter(); }
    @Bean public RabbitTemplate rabbitTemplate(ConnectionFactory cf){ var t=new RabbitTemplate(cf); t.setMessageConverter(jsonConverter()); return t; }
    @Bean public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(ConnectionFactory cf){
        var f=new SimpleRabbitListenerContainerFactory(); f.setConnectionFactory(cf);
        f.setMessageConverter(jsonConverter()); f.setDefaultRequeueRejected(false);
        f.setConcurrentConsumers(2); f.setMaxConcurrentConsumers(10); return f;
    }
}
