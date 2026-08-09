package com.devboard.taskservice.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Enumerated(EnumType.STRING)
    private Status status = Status.TODO;

    @Enumerated(EnumType.STRING)
    private Priority priority = Priority.MEDIUM;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;


    @Column(nullable = false)
    private String ownerEmail;

    public enum Status { TODO, IN_PROGRESS, DONE }
    public enum Priority { LOW, MEDIUM, HIGH }

    public Task() {}

    // getters and setters — same pattern as User

    public  Long getId(){return id;}
    public void setId(Long id){ this.id = id;}


    public  String getTitle(){return title;}
    public void setTitle(String title){ this.title = title;}


    public  String getDescription(){return description;}
    public void setDescription(String description){ this.description = description;}


    public  String getOwnerEmail(){return ownerEmail;}
    public void setOwnerEmail(String ownerEmail){ this.ownerEmail = ownerEmail;}


    

    public Status getStatus(){return status;}
    public void setStatus(Status status){this.status = status;}

    public Priority getPriority(){return priority;}
    public void setPriority(Priority priority){this.priority = priority;}


    public LocalDate getDueDate(){return dueDate;}
    public void  setDueDate(LocalDate duDate){this.dueDate= duDate;}


    public LocalDate getStartDate(){return startDate;}
    public void  setStartDate(LocalDate startDate){this.startDate= startDate;}







}