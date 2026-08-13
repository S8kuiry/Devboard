package com.devboard.taskservice.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.devboard.taskservice.client.AuthClient;

@Service

public class EmailService {
    private final AuthClient authClient;
    private final JavaMailSender mailSender;

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
                message.setSubject("New Task Assigned: " + taskTitle);
                message.setText("You have been assigned a new task on DevBoard. Please log in to check your workspace.");
            } else {
                message.setSubject("You've Been Assigned a Task on DevBoard!");
                message.setText("You have been assigned the task '" + taskTitle + "'. Please register using this email to access and track it.");
            }

            mailSender.send(message);
        }

    }

    // Method 1: For POST (Sends emails to all assigned users)
    public void sendTaskAssignments(List<String> assignedEmails, String taskTitle) {
        processTaskAssignments(assignedEmails, taskTitle);

    }

    // Method 2: For PUT (Filters and sends emails ONLY to newly added assignees)
    public void sendTaskAssignmentsOnUpdate(List<String> oldEmails, List<String> newEmails, String taskTitle) {
        if (newEmails == null || newEmails.isEmpty()) {
            return;
        }
        // Create a list of new emails and strip out any emails that were already present
        List<String> newlyAddedEmails = new ArrayList<>(newEmails);
        if (oldEmails != null) {
            newlyAddedEmails.removeAll(oldEmails);
        }

        // Send emails only to the newly added assignees
        processTaskAssignments(newlyAddedEmails, taskTitle);
    }
}
