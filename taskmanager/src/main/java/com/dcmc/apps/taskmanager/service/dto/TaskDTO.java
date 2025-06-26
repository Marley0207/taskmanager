package com.dcmc.apps.taskmanager.service.dto;

import com.dcmc.apps.taskmanager.domain.enumeration.TaskPriority;
import com.dcmc.apps.taskmanager.domain.enumeration.TaskStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.Set;

public class TaskDTO implements Serializable {

    private Long id;

    @NotNull
    private String title;

    @NotNull
    private String description;

    @NotNull
    private TaskPriority priority;

    @NotNull
    private TaskStatus status;

    @NotNull
    private Long workGroupId;

    @NotNull
    private Long projectId;

    @JsonIgnore
    private Set<UserDTO> assignedTos;

    // ✅ NUEVOS CAMPOS
    private Long parentTaskId;
    private Set<Long> subTaskIds;

    // Getters & Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public TaskPriority getPriority() {
        return priority;
    }

    public void setPriority(TaskPriority priority) {
        this.priority = priority;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }

    public Long getWorkGroupId() {
        return workGroupId;
    }

    public void setWorkGroupId(Long workGroupId) {
        this.workGroupId = workGroupId;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Set<UserDTO> getAssignedTos() {
        return assignedTos;
    }

    public void setAssignedTos(Set<UserDTO> assignedTos) {
        this.assignedTos = assignedTos;
    }

    public Long getParentTaskId() {
        return parentTaskId;
    }

    public void setParentTaskId(Long parentTaskId) {
        this.parentTaskId = parentTaskId;
    }

    public Set<Long> getSubTaskIds() {
        return subTaskIds;
    }

    public void setSubTaskIds(Set<Long> subTaskIds) {
        this.subTaskIds = subTaskIds;
    }

    @Override
    public String toString() {
        return "TaskDTO{" +
            "id=" + id +
            ", title='" + title + '\'' +
            ", description='" + description + '\'' +
            ", priority=" + priority +
            ", status=" + status +
            ", workGroupId=" + workGroupId +
            ", projectId=" + projectId +
            ", parentTaskId=" + parentTaskId +
            ", subTaskIds=" + subTaskIds +
            ", assignedTos=" + assignedTos +
            '}';
    }
}
