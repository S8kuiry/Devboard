package com.devboard.taskservice.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.devboard.taskservice.client.AuthClient;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final AuthClient authClient;
    private final JavaMailSender mailSender;

    // Updated fallback to match your Gmail SMTP account
    @Value("${app.mail.from-email:subharthykuiry12345@gmail.com}")
    private String fromEmail;

    @Value("${app.frontend.url:https://devboard-swart.vercel.app}")
    private String frontendUrl;

    public EmailService(AuthClient authClient, JavaMailSender mailSender) {
        this.authClient = authClient;
        this.mailSender = mailSender;
    }

    private void processTaskAssignments(List<String> targetEmails, String taskTitle) {
        if (targetEmails == null || targetEmails.isEmpty()) {
            return;
        }
        for (String email : targetEmails) {
            Boolean exists = false;
            try {
                exists = authClient.checkUserExists(email);
            } catch (Exception e) {
                log.error("Failed to verify user existence for {} via AuthClient: {}", email, e.getMessage());
                exists = false;
            }

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);

            if (Boolean.TRUE.equals(exists)) {
                message.setSubject("📌 New Task Assigned: " + taskTitle);
                message.setText(String.format(
                        "Greetings!\n\n" +
                                "You have been assigned a new task on DevBoard: '%s'.\n\n" +
                                "Log in to your workspace to view and manage this task:\n" +
                                "%s/assigned\n\n" +
                                "Best regards,\n" +
                                "DevBoard Team",
                        taskTitle,
                        frontendUrl));
            } else {
                message.setSubject("🎉 You've Been Assigned a Task on DevBoard!");
                message.setText(String.format(
                        "Greetings!\n\n" +
                                "You have been assigned the task '%s' on DevBoard.\n\n" +
                                "Please register using this email address to access and track your task:\n" +
                                "%s/register\n\n" +
                                "Best regards,\n" +
                                "DevBoard Team",
                        taskTitle,
                        frontendUrl));
            }

            try {
                mailSender.send(message);
                log.info("Task assignment email successfully sent to {}", email);
            } catch (Exception e) {
                log.error("Failed to send task assignment email to {}: {}", email, e.getMessage());
            }
        }
    }

    @Async
    public void sendTaskAssignments(List<String> assignedEmails, String taskTitle) {
        processTaskAssignments(assignedEmails, taskTitle);
    }

    @Async
    public void sendTaskAssignmentsOnUpdate(List<String> oldEmails, List<String> newEmails, String taskTitle) {
        if (newEmails == null || newEmails.isEmpty()) {
            return;
        }
        List<String> newlyAddedEmails = new ArrayList<>(newEmails);
        if (oldEmails != null) {
            newlyAddedEmails.removeAll(oldEmails);
        }
        processTaskAssignments(newlyAddedEmails, taskTitle);
    }

    @Async
    public void sendTaskCompletionNotifications(String ownerEmail, List<String> assignedEmails, String taskTitle) {
        Set<String> recipients = new HashSet<>();

        if (ownerEmail != null && !ownerEmail.isBlank()) {
            recipients.add(ownerEmail);
        }

        if (assignedEmails != null) {
            recipients.addAll(assignedEmails);
        }

        String emailText = String.format(
                "Greetings! A task in your workspace has been marked as DONE.\n\n" +
                        "📌 Task Details:\n" +
                        "• Title: %s\n" +
                        "• Created By: %s\n" +
                        "• Status: DONE ✅\n\n" +
                        "Log in to your DevBoard workspace to view updated task details:\n" +
                        "%s/assigned-tasks\n\n" +
                        "Best regards,\n" +
                        "DevBoard Team",
                taskTitle,
                (ownerEmail != null && !ownerEmail.isBlank()) ? ownerEmail : "N/A",
                frontendUrl);

        for (String email : recipients) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(email);
                message.setSubject("🎉 Task Completed: " + taskTitle);
                message.setText(emailText);

                mailSender.send(message);
                log.info("Task completion email successfully sent to {}", email);
            } catch (Exception e) {
                log.error("Failed to send task completion email to {}: {}", email, e.getMessage());
            }
        }
    }

    @Async
    public void sendTaskRemovalNotificationsOnUpdate(List<String> oldEmails, List<String> newEmails, String taskTitle) {
        if (oldEmails == null || oldEmails.isEmpty()) {
            return;
        }

        List<String> removedEmails = new ArrayList<>(oldEmails);
        if (newEmails != null) {
            removedEmails.removeAll(newEmails);
        }

        if (removedEmails.isEmpty()) {
            return;
        }

        String emailText = String.format(
                "Greetings!\n\n" +
                        "You have been removed from the task '%s' on DevBoard.\n\n" +
                        "If you believe this was done in error, please reach out to the task owner.\n\n" +
                        "Best regards,\n" +
                        "DevBoard Team",
                taskTitle);

        for (String email : removedEmails) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(email);
                message.setSubject("ℹ️ Removed from Task: " + taskTitle);
                message.setText(emailText);

                mailSender.send(message);
                log.info("Task removal email successfully sent to {}", email);
            } catch (Exception e) {
                log.error("Failed to send task removal email to {}: {}", email, e.getMessage());
            }
        }
    }
}