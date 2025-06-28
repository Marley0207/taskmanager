// src/main/java/com/dcmc/apps/taskmanager/service/dto/UserGroupRoleDTO.java
package com.dcmc.apps.taskmanager.service.dto;

import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;

public class UserGroupRoleDTO {
    private UserDTO user;
    private GroupRole role;

    public UserGroupRoleDTO(UserDTO user, GroupRole role) {
        this.user = user;
        this.role = role;
    }

    public UserDTO getUser() { return user; }
    public void setUser(UserDTO user) { this.user = user; }

    public GroupRole getRole() { return role; }
    public void setRole(GroupRole role) { this.role = role; }
}
