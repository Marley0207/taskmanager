package com.dcmc.apps.taskmanager.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.Objects;

/**
 * A DTO for the {@link com.dcmc.apps.taskmanager.domain.Priority} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class PriorityDTO implements Serializable {

    private Long id;

    @NotNull
    private String name;

    private Boolean hidden; // ✅ Nuevo campo

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Boolean getHidden() {
        return hidden;
    }

    public void setHidden(Boolean hidden) {
        this.hidden = hidden;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof PriorityDTO)) {
            return false;
        }

        PriorityDTO priorityDTO = (PriorityDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, priorityDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PriorityDTO{" +
            "id=" + getId() +
            ", name='" + getName() + "'" +
            ", hidden=" + getHidden() +
            "}";
    }
}
