package com.lumina.infrastructure.media;

import java.io.IOException;
import java.nio.file.Path;

public interface WorkoutMediaStorage {
    String store(byte[] bytes, String extension) throws IOException;
    void delete(String key) throws IOException;
    Path path(String key);
    byte[] read(String key) throws IOException;
}
