package com.dcmc.apps.taskmanager.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

/**
 * A WorkGroup.
 */
@Entity
@Table(name = "work_group")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class WorkGroup implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @NotNull
    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "workGroup")
    @JsonIgnoreProperties(value = { "subTasks", "members", "workGroup" }, allowSetters = true)
    private Set<Project> projects = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "workGroup")
    @JsonIgnoreProperties(value = { "comments", "assignedTos", "workGroup", "project" }, allowSetters = true)
    private Set<Task> tasks = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "rel_work_group__users",
        joinColumns = @JoinColumn(name = "work_group_id"),
        inverseJoinColumns = @JoinColumn(name = "users_id")
    )
    private Set<User> users = new HashSet<>();

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public WorkGroup id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return this.name;
    }

    public WorkGroup name(String name) {
        this.setName(name);
        return this;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return this.description;
    }

    public WorkGroup description(String description) {
        this.setDescription(description);
        return this;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Set<Project> getProjects() {
        return this.projects;
    }

    public void setProjects(Set<Project> projects) {
        if (this.projects != null) {
            this.projects.forEach(i -> i.setWorkGroup(null));
        }
        if (projects != null) {
            projects.forEach(i -> i.setWorkGroup(this));
        }
        this.projects = projects;
    }

    public WorkGroup projects(Set<Project> projects) {
        this.setProjects(projects);
        return this;
    }

    public WorkGroup addProjects(Project project) {
        this.projects.add(project);
        project.setWorkGroup(this);
        return this;
    }

    public WorkGroup removeProjects(Project project) {
        this.projects.remove(project);
        project.setWorkGroup(null);
        return this;
    }

    public Set<Task> getTasks() {
        return this.tasks;
    }

    public void setTasks(Set<Task> tasks) {
        if (this.tasks != null) {
            this.tasks.forEach(i -> i.setWorkGroup(null));
        }
        if (tasks != null) {
            tasks.forEach(i -> i.setWorkGroup(this));
        }
        this.tasks = tasks;
    }

    public WorkGroup tasks(Set<Task> tasks) {
        this.setTasks(tasks);
        return this;
    }

    public WorkGroup addTasks(Task task) {
        this.tasks.add(task);
        task.setWorkGroup(this);
        return this;
    }

    public WorkGroup removeTasks(Task task) {
        this.tasks.remove(task);
        task.setWorkGroup(null);
        return this;
    }

    public Set<User> getUsers() {
        return this.users;
    }

    public void setUsers(Set<User> users) {
        this.users = users;
    }

    public WorkGroup users(Set<User> users) {
        this.setUsers(users);
        return this;
    }

    public WorkGroup addUsers(User user) {
        this.users.add(user);
        return this;
    }

    public WorkGroup removeUsers(User user) {
        this.users.remove(user);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof WorkGroup)) {
            return false;
        }
        return getId() != null && getId().equals(((WorkGroup) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "WorkGroup{" +
            "id=" + getId() +
            ", name='" + getName() + "'" +
            ", description='" + getDescription() + "'" +
            "}";
    }
}
