package com.lumina.application.service;

import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.domain.user.entity.User;
import com.lumina.domain.user.repository.UserRepository;
import com.lumina.infrastructure.media.WorkoutMediaStorage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class ProfileAvatarService {
    private final UserRepository userRepository;
    private final WorkoutMediaStorage storage;

    @Transactional
    public User upload(UUID userId, MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() > 5 * 1024 * 1024)
            throw invalid("A foto deve ter até 5 MB");
        try {
            BufferedImage image = ImageIO.read(file.getInputStream());
            if (image == null || image.getWidth() > 4096 || image.getHeight() > 4096)
                throw invalid("Imagem inválida ou grande demais");
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(image, "jpg", out);
            User user = userRepository.findById(userId).orElseThrow();
            if (user.getAvatarUrl() != null && user.getAvatarUrl().startsWith("media:")) {
                try { storage.delete(user.getAvatarUrl().substring(6)); } catch (IOException ignored) { }
            }
            String key = storage.store(out.toByteArray(), ".jpg");
            user.setAvatarUrl("media:" + key);
            return user;
        } catch (IOException e) { throw invalid("Não foi possível processar a foto"); }
    }

    @Transactional(readOnly = true)
    public byte[] read(UUID userId) throws IOException {
        User user = userRepository.findById(userId).orElseThrow();
        if (user.getAvatarUrl() == null || !user.getAvatarUrl().startsWith("media:")) throw new FileNotFoundException();
        return storage.read(user.getAvatarUrl().substring(6));
    }

    private BusinessException invalid(String message) {
        return new BusinessException("INVALID_AVATAR", message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
