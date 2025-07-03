package com.dcmc.apps.taskmanager.service.dto;

import java.io.Serializable;

public class SimpleGroupRoleDTO implements Serializable {
    private Long id; // id del grupo
    private String role; // OWNER, MODERADOR, MIEMBRO

    public SimpleGroupRoleDTO(Long id, String role) {
        this.id = id;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
