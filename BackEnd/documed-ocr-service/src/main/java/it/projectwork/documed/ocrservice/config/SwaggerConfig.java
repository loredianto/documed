package it.projectwork.documed.ocrservice.config;

import java.util.Collections;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiKey;
import springfox.documentation.service.AuthorizationScope;
import springfox.documentation.service.SecurityReference;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spi.service.contexts.SecurityContext;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

/**
 * Swagger documentation for the internal OCR endpoint.
 */
@Configuration
@EnableSwagger2
public class SwaggerConfig {

    @Bean
    public Docket ocrApi() {
        return new Docket(DocumentationType.SWAGGER_2)
                .select()
                .apis(RequestHandlerSelectors.basePackage("it.projectwork.documed.ocrservice.controller"))
                .paths(PathSelectors.ant("/internal/**"))
                .build()
                .apiInfo(new ApiInfoBuilder()
                        .title("Documed OCR Service API")
                        .description("Internal synchronous Tesseract extraction endpoint")
                        .version("1.0")
                        .build())
                .securitySchemes(Collections.singletonList(
                        new ApiKey("Bearer", "Authorization", "header")))
                .securityContexts(Collections.singletonList(
                        SecurityContext.builder()
                                .securityReferences(Collections.singletonList(
                                        new SecurityReference("Bearer", new AuthorizationScope[0])))
                                .forPaths(PathSelectors.ant("/internal/**"))
                                .build()));
    }
}
