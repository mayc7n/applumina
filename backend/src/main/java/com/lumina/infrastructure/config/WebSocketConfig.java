package com.lumina.infrastructure.config;
import com.lumina.infrastructure.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.*;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.*;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.*;
import java.util.List;

@Configuration @EnableWebSocketMessageBroker @RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtService jwtService;

    @Override public void configureMessageBroker(MessageBrokerRegistry r){ r.enableSimpleBroker("/topic","/queue"); r.setApplicationDestinationPrefixes("/app"); r.setUserDestinationPrefix("/user"); }
    @Override public void registerStompEndpoints(StompEndpointRegistry r){ r.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS().setHeartbeatTime(25000); }
    @Override public void configureClientInboundChannel(ChannelRegistration r){
        r.interceptors(new ChannelInterceptor(){
            @Override public Message<?> preSend(Message<?> msg, MessageChannel ch){
                var a=MessageHeaderAccessor.getAccessor(msg,StompHeaderAccessor.class);
                if(a!=null && StompCommand.CONNECT.equals(a.getCommand())){
                    String h=a.getFirstNativeHeader("Authorization");
                    if(h!=null && h.startsWith("Bearer ")){
                        String t=h.substring(7);
                        if(jwtService.isValid(t)){ a.setUser(new UsernamePasswordAuthenticationToken(jwtService.extractUserId(t),null,List.of(new SimpleGrantedAuthority("ROLE_USER")))); }
                    }
                }
                return msg;
            }
        });
    }
}
