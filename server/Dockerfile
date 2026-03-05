FROM eclipse-temurin:25-jdk-noble AS builder
WORKDIR /build
COPY . .
RUN ./gradlew build -x test --no-daemon

FROM eclipse-temurin:25-jre-noble
WORKDIR /app
COPY --from=builder /build/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
