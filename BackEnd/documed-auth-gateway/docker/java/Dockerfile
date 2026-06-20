FROM maven:3.9-eclipse-temurin-11 AS build

WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:11-jre

WORKDIR /app

COPY --from=build /workspace/target/documed-auth-gateway-0.0.1-SNAPSHOT.jar app.jar

ENV JAVA_OPTS="-Xms256m -Xmx512m"

EXPOSE 8282

# Numeric non-root user keeps the runtime image independent from host users.
USER 10001

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
