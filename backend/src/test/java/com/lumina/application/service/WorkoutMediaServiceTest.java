package com.lumina.application.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import java.util.Optional;
import java.util.UUID;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import com.lumina.domain.user.repository.UserRepository;
import com.lumina.domain.workout.entity.Workout;
import com.lumina.domain.workout.entity.WorkoutMedia;
import com.lumina.domain.workout.repository.WorkoutMediaRepository;
import com.lumina.domain.workout.repository.WorkoutRepository;
import com.lumina.infrastructure.media.WorkoutMediaStorage;

@ExtendWith(MockitoExtension.class)
class WorkoutMediaServiceTest {
    @Mock WorkoutMediaRepository mediaRepository;
    @Mock WorkoutRepository workoutRepository;
    @Mock UserRepository userRepository;
    @Mock WorkoutMediaStorage storage;
    WorkoutMediaService service;
    UUID userId;
    UUID workoutId;

    @BeforeEach void setUp() { service = new WorkoutMediaService(mediaRepository, workoutRepository, userRepository, storage); userId = UUID.randomUUID(); workoutId = UUID.randomUUID(); }

    @Test void rejectsFileWithInvalidSignature() {
        var file = new MockMultipartFile("file", "fake.jpg", "image/jpeg", "not-an-image".getBytes());
        assertThatThrownBy(() -> service.upload(userId, workoutId, file, null)).hasMessage("A assinatura da imagem é inválida");
        verifyNoInteractions(workoutRepository, storage);
    }

    @Test void replacesExistingMomentAfterValidUpload() throws Exception {
        var workout = Workout.builder().id(workoutId).build();
        when(workoutRepository.findByIdAndUserId(workoutId, userId)).thenReturn(Optional.of(workout));
        when(mediaRepository.findByWorkoutIdAndUserId(workoutId, userId)).thenReturn(Optional.empty());
        when(storage.store(any(), eq(".jpg"))).thenReturn("random.jpg");
        when(mediaRepository.save(any(WorkoutMedia.class))).thenAnswer(invocation -> { var m = invocation.getArgument(0, WorkoutMedia.class); m.setId(UUID.randomUUID()); return m; });
        var imagem = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(imagem, "jpg", bytes);
        var file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", bytes.toByteArray());
        var response = service.upload(userId, workoutId, file, "  dia bom  ");
        verify(storage).store(any(), eq(".jpg"));
        org.assertj.core.api.Assertions.assertThat(response.status()).isEqualTo("READY");
        org.assertj.core.api.Assertions.assertThat(response.caption()).isEqualTo("dia bom");
    }
}
