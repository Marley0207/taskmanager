package com.dcmc.apps.taskmanager.service.dto;

import com.dcmc.apps.taskmanager.domain.User;
import java.io.Serializable;
import java.util.List;
import java.util.Objects;

/**
 * A DTO representing a user, with only the public attributes.
 */
public class UserDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;

    private String login;

    private List<SimpleGroupRoleDTO> workGroups;

    public UserDTO() {
        // Empty constructor needed for Jackson.
    }

    public UserDTO(User user) {
        this.id = user.getId();
        this.login = user.getLogin();
        // Nota: workGroups no se mapea automáticamente aquí. Se debe setear manualmente si se necesita.
    }

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

    public List<SimpleGroupRoleDTO> getWorkGroups() {
        return workGroups;
    }

    public void setWorkGroups(List<SimpleGroupRoleDTO> workGroups) {
        this.workGroups = workGroups;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserDTO)) return false;
        UserDTO userDTO = (UserDTO) o;
        return Objects.equals(id, userDTO.id) &&
            Objects.equals(login, userDTO.login);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, login);
    }

    @Override
    public String toString() {
        return "UserDTO{" +
            "id='" + id + '\'' +
            ", login='" + login + '\'' +
            '}';
    }
}
