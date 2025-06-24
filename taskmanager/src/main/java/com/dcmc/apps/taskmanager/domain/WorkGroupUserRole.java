package com.dcmc.apps.taskmanager.domain;

import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;

/**
 * A WorkGroupUserRole.
 */
@Entity
@Table(name = "work_group_user_role")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class WorkGroupUserRole implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private GroupRole role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    @JsonIgnoreProperties(value = { "projects", "tasks", "users" }, allowSetters = true)
    private WorkGroup group;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public WorkGroupUserRole id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public GroupRole getRole() {
        return this.role;
    }

    public WorkGroupUserRole role(GroupRole role) {
        this.setRole(role);
        return this;
    }

    public void setRole(GroupRole role) {
        this.role = role;
    }

    public User getUser() {
        return this.user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public WorkGroupUserRole user(User user) {
        this.setUser(user);
        return this;
    }

    public WorkGroup getGroup() {
        return this.group;
    }

    public void setGroup(WorkGroup workGroup) {
        this.group = workGroup;
    }

    public WorkGroupUserRole group(WorkGroup workGroup) {
        this.setGroup(workGroup);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof WorkGroupUserRole)) {
            return false;
        }
        return getId() != null && getId().equals(((WorkGroupUserRole) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "WorkGroupUserRole{" +
            "id=" + getId() +
            ", role='" + getRole() + "'" +
            "}";
    }
}
