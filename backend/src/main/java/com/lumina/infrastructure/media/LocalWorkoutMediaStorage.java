package com.lumina.infrastructure.media;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Profile;

@Service @Profile("!s3")
public class LocalWorkoutMediaStorage implements WorkoutMediaStorage {
    private final Path root;
    public LocalWorkoutMediaStorage(@Value("${lumina.media.storage-dir:./data/media}") String storageDir) { this.root = Path.of(storageDir); }
    @Override public String store(byte[] bytes, String extension) throws IOException {
        Files.createDirectories(root);
        String key = UUID.randomUUID() + extension;
        Path temp = Files.createTempFile(root, "upload-", ".tmp");
        try { Files.write(temp, bytes, StandardOpenOption.TRUNCATE_EXISTING); Files.move(temp, root.resolve(key), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING); return key; }
        finally { Files.deleteIfExists(temp); }
    }
    @Override public void delete(String key) throws IOException { Files.deleteIfExists(path(key)); }
    @Override public Path path(String key) { return root.resolve(key).normalize(); }
    @Override public byte[] read(String key) throws IOException { return Files.readAllBytes(path(key)); }
}
