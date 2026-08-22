package com.devboard.taskservice.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.devboard.taskservice.client.AuthClient;

@Service

public class EmailService {
    private final AuthClient authClient;
    private final JavaMailSender mailSender;

    @Value("${app.frontend.url}")
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
            Boolean exists = authClient.checkUserExists(email);

            SimpleMailMessage message = new SimpleMailMessage();
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

            mailSender.send(message);
        }

    }

    // Method 1: For POST (Sends emails to all assigned users)
    //
    // @Async because the callers are @Transactional: an SMTP round trip per
    // assignee
    // plus a Feign call to auth-service kept the JDBC connection checked out for
    // seconds, starving the pool for every other in-flight request. Both arguments
    // are
    // plain detached lists, so they are safe to read off the request thread.
    @Async
    public void sendTaskAssignments(List<String> assignedEmails, String taskTitle) {

        processTaskAssignments(assignedEmails, taskTitle);

    }

    // Method 2: For PUT (Filters and sends emails ONLY to newly added assignees)
    @Async
    public void sendTaskAssignmentsOnUpdate(List<String> oldEmails, List<String> newEmails, String taskTitle) {
        if (newEmails == null || newEmails.isEmpty()) {
            return;
        }
        // Create a list of new emails and strip out any emails that were already
        // present
        List<String> newlyAddedEmails = new ArrayList<>(newEmails);
        if (oldEmails != null) {
            newlyAddedEmails.removeAll(oldEmails);
        }

        // Send emails only to the newly added assignees
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

        // Build a structured notification message
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
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("🎉 Task Completed: " + taskTitle);
            message.setText(emailText);

            mailSender.send(message);
        }
    }

    @Async
    public void sendTaskRemovalNotificationsOnUpdate(List<String> oldEmails, List<String> newEmails, String taskTitle) {
        if (oldEmails == null || oldEmails.isEmpty()) {
            return;
        }

        // Filter out users who are still assigned in the new list
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
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("ℹ️ Removed from Task: " + taskTitle);
            message.setText(emailText);

            mailSender.send(message);
        }
    }
}
