package com.example.demo;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class Careerhub1Application {

	public static void main(String[] args) {

		String zone = System.getenv().getOrDefault("APP_TIMEZONE", "Asia/Kolkata");
		TimeZone.setDefault(TimeZone.getTimeZone(zone));
		SpringApplication.run(Careerhub1Application.class, args);
	}
}
