package com.dcmc.apps.taskmanager.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;

/**
 * A Priority.
 */
@Entity
@Table(name = "priority")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Priority implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @NotNull
    @Column(name = "name", nullable = false)
    private String name;

    @NotNull
    @Column(name = "hidden", nullable = false)
    private Boolean hidden = false;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public Priority id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return this.name;
    }

    public Priority name(String name) {
        this.setName(name);
        return this;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Boolean getHidden() {
        return this.hidden;
    }

    public Priority hidden(Boolean hidden) {
        this.setHidden(hidden);
        return this;
    }

    public void setHidden(Boolean hidden) {
        this.hidden = hidden;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Priority)) {
            return false;
        }
        return getId() != null && getId().equals(((Priority) o).getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Priority{" +
            "id=" + getId() +
            ", name='" + getName() + "'" +
            ", hidden='" + getHidden() + "'" +
            "}";
    }
}
