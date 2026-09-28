package com.contractwatch.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI contractWatchOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ContractWatch API")
                        .description("Contract Renewal Reminder Tracker — REST API Documentation\n\n" +
                                "This API powers ContractWatch, an enterprise-grade contract management system " +
                                "that tracks renewal deadlines, automates status updates, and provides AI-powered insights.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("ContractWatch")
                                .email("support@contractwatch.io"))
                        .license(new License()
                                .name("MIT License")));
    }
}
