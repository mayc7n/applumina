package com.lumina.infrastructure.media;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Path;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

@Service @Profile("s3")
public class S3WorkoutMediaStorage implements WorkoutMediaStorage {
    private final S3Client client;
    private final String bucket;
    public S3WorkoutMediaStorage(@Value("${lumina.media.s3.endpoint}") String endpoint, @Value("${lumina.media.s3.region:us-east-1}") String region, @Value("${lumina.media.s3.access-key}") String accessKey, @Value("${lumina.media.s3.secret-key}") String secretKey, @Value("${lumina.media.s3.bucket:lumina-media}") String bucket) {
        this.bucket = bucket;
        this.client = S3Client.builder().endpointOverride(URI.create(endpoint)).region(Region.of(region)).forcePathStyle(true).credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey))).build();
    }
    @Override public String store(byte[] bytes, String extension) throws IOException { String key = UUID.randomUUID() + extension; try { client.putObject(PutObjectRequest.builder().bucket(bucket).key(key).contentType("image/jpeg").build(), RequestBody.fromBytes(bytes)); return key; } catch (RuntimeException e) { throw new IOException(e); } }
    @Override public void delete(String key) throws IOException { try { client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build()); } catch (RuntimeException e) { throw new IOException(e); } }
    @Override public Path path(String key) { throw new UnsupportedOperationException("S3 não expõe caminho local"); }
    @Override public byte[] read(String key) throws IOException { try { ResponseBytes<GetObjectResponse> response = client.getObjectAsBytes(GetObjectRequest.builder().bucket(bucket).key(key).build()); return response.asByteArray(); } catch (RuntimeException e) { throw new IOException(e); } }
}
