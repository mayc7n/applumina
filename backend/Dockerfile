FROM eclipse-temurin:21-jdk-alpine AS deps
WORKDIR /build
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B --no-transfer-progress

FROM deps AS builder
WORKDIR /build
COPY src ./src
RUN ./mvnw package -DskipTests -B --no-transfer-progress && \
    java -Djarmode=layertools -jar target/*.jar extract --destination target/extracted

FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S lumina && adduser -S lumina -G lumina
RUN apk add --no-cache curl tzdata
ENV TZ=America/Sao_Paulo
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"
WORKDIR /app
COPY --from=builder --chown=lumina:lumina /build/target/extracted/dependencies/ ./
COPY --from=builder --chown=lumina:lumina /build/target/extracted/spring-boot-loader/ ./
COPY --from=builder --chown=lumina:lumina /build/target/extracted/snapshot-dependencies/ ./
COPY --from=builder --chown=lumina:lumina /build/target/extracted/application/ ./
USER lumina
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/api/actuator/health || exit 1
ENTRYPOINT ["sh","-c","java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
