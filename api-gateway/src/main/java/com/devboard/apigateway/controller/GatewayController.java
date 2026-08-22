package com.devboard.apigateway.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

@RestController
@RequestMapping("/gateway")
public class GatewayController {

    @Value("${auth.service.url}")
    private String authServiceUrl;

    @Value("${task.service.url}")
    private String taskServiceUrl;

    private final RestClient restClient = RestClient.create();

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        boolean authReady = checkEndpoint(authServiceUrl + "/auth/ping");
        boolean taskReady = checkEndpoint(taskServiceUrl + "/tasks/ping");

        if (authReady && taskReady) {
            return ResponseEntity.ok("OK");
        }

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("UNAVAILABLE");
    }

    private boolean checkEndpoint(String url) {
        try {
            return restClient.get()
                    .uri(url)
                    .retrieve()
                    .toBodilessEntity()
                    .getStatusCode()
                    .is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }
}