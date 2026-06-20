FROM maven:3.9-eclipse-temurin-11 AS build

WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:11-jre

WORKDIR /app

COPY --from=build /workspace/target/documed-patient-service-0.0.1-SNAPSHOT.jar app.jar

ENV JAVA_OPTS="-Xms256m -Xmx512m"

EXPOSE 8081

# The image does not require filesystem writes or root privileges at runtime.
USER 10001

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
