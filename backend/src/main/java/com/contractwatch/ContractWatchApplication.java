package com.contractwatch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ContractWatchApplication {
    public static void main(String[] args) {
        SpringApplication.run(ContractWatchApplication.class, args);
    }
}
