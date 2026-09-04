package com.lumina.infrastructure.messaging;

import com.lumina.infrastructure.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PasswordResetEmailListener {
    private final JavaMailSender mailSender;

    @Value("${lumina.mail.from:no-reply@lumina.app}")
    private String from;

    @RabbitListener(queues = RabbitMQConfig.Q_EMAIL)
    public void send(EventPublisher.EmailEvent event) {
        if (!"password-reset".equals(event.template())) return;
        boolean english = "en".equalsIgnoreCase(event.variables().get("locale"));
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(event.to());
        message.setSubject(english ? "Reset your Lumina password" : "Redefina sua senha do Lumina");
        message.setText(english
            ? "Hello, " + event.name() + ".\n\nUse this link within 15 minutes:\n" + event.variables().get("url")
                + "\n\nIf you did not request this, you can ignore this email."
            : "Olá, " + event.name() + ".\n\nUse este link em até 15 minutos:\n" + event.variables().get("url")
                + "\n\nSe você não fez este pedido, ignore este e-mail.");
        mailSender.send(message);
    }
}
