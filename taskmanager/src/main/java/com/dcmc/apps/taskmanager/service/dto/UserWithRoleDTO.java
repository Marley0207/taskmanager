package com.dcmc.apps.taskmanager.service.dto;

public class UserWithRoleDTO {

    private String id;

    private String login;

    private String role; // OWNER, MODERADOR, MIEMBRO

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    @Override
    public String toString() {
        return "UserWithRoleDTO{" +
            "id='" + id + '\'' +
            ", login='" + login + '\'' +
            ", role='" + role + '\'' +
            '}';
    }
}
