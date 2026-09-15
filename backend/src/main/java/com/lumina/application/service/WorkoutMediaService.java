package com.lumina.application.service;

import java.io.IOException;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.lumina.api.dto.WorkoutMediaResponse;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.user.repository.UserRepository;
import com.lumina.domain.workout.entity.*;
import com.lumina.domain.workout.repository.*;
import com.lumina.infrastructure.media.WorkoutMediaStorage;
import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class WorkoutMediaService {
    private static final long MAX_BYTES = 10 * 1024 * 1024;
    private final WorkoutMediaRepository mediaRepository;
    private final WorkoutRepository workoutRepository;
    private final UserRepository userRepository;
    private final WorkoutMediaStorage storage;

    @Transactional
    public WorkoutMediaResponse upload(UUID userId, UUID workoutId, MultipartFile file, String caption) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_BYTES) throw invalid("Arquivo ausente ou maior que 10 MB");
        String type = file.getContentType();
        if (!isImageType(type)) throw invalid("Apenas imagens JPEG, PNG ou WebP são aceitas");
        byte[] bytes;
        try { bytes = file.getBytes(); } catch (IOException e) { throw invalid("Não foi possível ler a imagem"); }
        if (!assinaturaValida(type, bytes)) throw invalid("A assinatura da imagem é inválida");
        bytes = reprocessar(bytes);
        var workout = workoutRepository.findByIdAndUserId(workoutId, userId).orElseThrow(() -> new ResourceNotFoundException("Treino não encontrado"));
        var anterior = mediaRepository.findByWorkoutIdAndUserId(workoutId, userId);
        anterior.ifPresent(media -> { try { storage.delete(media.getStorageKey()); } catch (IOException ignored) {} mediaRepository.delete(media); });
        String key;
        try { key = storage.store(bytes, extension(type)); }
        catch (IOException e) { throw new BusinessException("MEDIA_STORAGE_FAILED", "Não foi possível armazenar a imagem", HttpStatus.SERVICE_UNAVAILABLE); }
        var media = mediaRepository.save(WorkoutMedia.builder().workout(workout).user(userRepository.getReferenceById(userId)).storageKey(key).status(WorkoutMediaStatus.READY).caption(caption == null ? null : caption.trim()).contentType("image/jpeg").byteSize(bytes.length).build());
        return toResponse(media);
    }

    @Transactional(readOnly = true)
    public WorkoutMedia get(UUID userId, UUID workoutId) { return mediaRepository.findByWorkoutIdAndUserId(workoutId, userId).orElseThrow(() -> new ResourceNotFoundException("Momento não encontrado")); }

    @Transactional
    public void delete(UUID userId, UUID workoutId) {
        var media = get(userId, workoutId);
        try { storage.delete(media.getStorageKey()); } catch (IOException ignored) { }
        mediaRepository.delete(media);
    }

    public java.nio.file.Path path(WorkoutMedia media) { return storage.path(media.getStorageKey()); }
    public byte[] read(WorkoutMedia media) throws IOException { return storage.read(media.getStorageKey()); }
    public WorkoutMediaResponse toResponse(WorkoutMedia m) { return new WorkoutMediaResponse(m.getId().toString(), m.getWorkout().getId().toString(), m.getStatus().name(), m.getCaption(), m.getContentType(), m.getByteSize()); }
    private BusinessException invalid(String msg) { return new BusinessException("INVALID_MEDIA", msg, HttpStatus.UNPROCESSABLE_ENTITY); }
    private boolean isImageType(String type) { return "image/jpeg".equals(type) || "image/png".equals(type) || "image/webp".equals(type); }
    private boolean assinaturaValida(String type, byte[] b) { return ("image/jpeg".equals(type) && b.length > 3 && (b[0]&255)==255 && (b[1]&255)==216 && (b[2]&255)==255) || ("image/png".equals(type) && b.length > 8 && (b[0]&255)==137 && b[1]=='P' && b[2]=='N' && b[3]=='G') || ("image/webp".equals(type) && b.length > 12 && b[0]=='R' && b[1]=='I' && b[2]=='F' && b[3]=='F' && b[8]=='W' && b[9]=='E' && b[10]=='B' && b[11]=='P'); }
    private String extension(String type) { return "image/png".equals(type) ? ".png" : "image/webp".equals(type) ? ".webp" : ".jpg"; }
    private byte[] reprocessar(byte[] original) {
        try {
            BufferedImage imagem = ImageIO.read(new ByteArrayInputStream(original));
            if (imagem == null || imagem.getWidth() > 4096 || imagem.getHeight() > 4096) throw invalid("Dimensões da imagem não são aceitas");
            var saida = new ByteArrayOutputStream();
            if (!ImageIO.write(imagem, "jpg", saida)) throw invalid("Formato de imagem não suportado");
            return saida.toByteArray();
        } catch (IOException e) { throw invalid("Não foi possível processar a imagem"); }
    }
}
