package com.dcmc.apps.taskmanager.web.rest;

import com.dcmc.apps.taskmanager.repository.TaskRepository;
import com.dcmc.apps.taskmanager.service.TaskService;
import com.dcmc.apps.taskmanager.service.dto.TaskDTO;
import com.dcmc.apps.taskmanager.service.dto.UserDTO;
import com.dcmc.apps.taskmanager.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.Principal;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.PaginationUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.dcmc.apps.taskmanager.domain.Task}.
 */
@RestController
@RequestMapping("/api/tasks")
public class TaskResource {

    private static final Logger LOG = LoggerFactory.getLogger(TaskResource.class);

    private static final String ENTITY_NAME = "taskmanagerTask";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final TaskService taskService;

    private final TaskRepository taskRepository;

    public TaskResource(TaskService taskService, TaskRepository taskRepository) {
        this.taskService = taskService;
        this.taskRepository = taskRepository;
    }

    @PostMapping("")
    public ResponseEntity<TaskDTO> createTask(@Valid @RequestBody TaskDTO taskDTO) throws URISyntaxException {
        LOG.debug("REST request to save Task : {}", taskDTO);
        if (taskDTO.getId() != null) {
            throw new BadRequestAlertException("A new task cannot already have an ID", ENTITY_NAME, "idexists");
        }
        taskDTO = taskService.save(taskDTO);
        return ResponseEntity.created(new URI("/api/tasks/" + taskDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, false, ENTITY_NAME, taskDTO.getId().toString()))
            .body(taskDTO);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDTO> updateTask(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody TaskDTO taskDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Task : {}, {}", id, taskDTO);
        if (taskDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, taskDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!taskRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        taskDTO = taskService.update(taskDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, taskDTO.getId().toString()))
            .body(taskDTO);
    }

    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<TaskDTO> partialUpdateTask(
        @PathVariable(value = "id") final Long id,
        @NotNull @RequestBody TaskDTO taskDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Task partially : {}, {}", id, taskDTO);

        if (!taskRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        taskDTO.setId(id);
        Optional<TaskDTO> result = taskService.partialUpdate(taskDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, id.toString())
        );
    }

    @GetMapping("")
    public ResponseEntity<List<TaskDTO>> getAllTasks(
        @org.springdoc.core.annotations.ParameterObject Pageable pageable,
        @RequestParam(name = "eagerload", required = false, defaultValue = "true") boolean eagerload
    ) {
        LOG.debug("REST request to get a page of Tasks");
        Page<TaskDTO> page;
        if (eagerload) {
            page = taskService.findAllWithEagerRelationships(pageable);
        } else {
            page = taskService.findAll(pageable);
        }
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO> getTask(@PathVariable("id") Long id) {
        LOG.debug("REST request to get Task : {}", id);
        Optional<TaskDTO> taskDTO = taskService.findOne(id);
        return ResponseUtil.wrapOrNotFound(taskDTO);
    }

    @DeleteMapping("/projects/{projectId}/tasks/{taskId}")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<Void> deleteTask(
        @PathVariable("projectId") Long projectId,
        @PathVariable("taskId") Long taskId,
        Principal principal
    ) {
        LOG.debug("REST request to delete Task : {} del Proyecto {}", taskId, projectId);
        taskService.delete(taskId, projectId, principal.getName());
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, false, ENTITY_NAME, taskId.toString()))
            .build();
    }



    @GetMapping("/{id}/view-assigned-users")
    public ResponseEntity<List<UserDTO>> getAssignedUsers(@PathVariable Long id) {
        List<UserDTO> users = taskService.getAssignedUsers(id);
        return ResponseEntity.ok(users);
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<TaskDTO> archiveTask(@PathVariable Long id) {
        TaskDTO result = taskService.archiveTask(id);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/archived")
    public ResponseEntity<List<TaskDTO>> getArchivedTasks() {
        List<TaskDTO> tasks = taskService.findArchivedTasksForCurrentUser();
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/archived/project/{projectId}")
    public ResponseEntity<List<TaskDTO>> getArchivedTasksByProject(@PathVariable Long projectId) {
        List<TaskDTO> result = taskService.findArchivedTasksByProject(projectId);
        return ResponseEntity.ok().body(result);
    }

    @DeleteMapping("/{taskId}/archived")
    public ResponseEntity<Void> deleteArchivedTask(@PathVariable Long taskId) {
        taskService.deleteArchivedTask(taskId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("{taskId}/assign-user/{userLogin}")
    public ResponseEntity<TaskDTO> assignUserToTask(
        @PathVariable Long taskId,
        @PathVariable String userLogin
    ) {
        TaskDTO result = taskService.assignUserToTask(taskId, userLogin);
        return ResponseEntity.ok().body(result);
    }

    @GetMapping("/projects/{projectId}/tasks")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<List<TaskDTO>> getTasksByProject(@PathVariable Long projectId, Principal principal) {
        LOG.debug("REST request to get Tasks by Project ID : {}", projectId);
        List<TaskDTO> tasks = taskService.findTasksByProjectIdForUser(projectId, principal.getName());
        return ResponseEntity.ok(tasks);
    }

    @DeleteMapping("/projects/{projectId}/tasks/{taskId}/members/{username}")
    @PreAuthorize("hasAuthority('ROLE_USER')")
    public ResponseEntity<Void> removeUserFromTask(
        @PathVariable Long projectId,
        @PathVariable Long taskId,
        @PathVariable String username,
        Principal principal
    ) {
        taskService.removeUserFromTask(projectId, taskId, username, principal.getName());
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createAlert(applicationName, "Usuario removido de la tarea", username))
            .build();
    }

    @GetMapping("/projects/{projectId}/archived-tasks")
    public ResponseEntity<List<TaskDTO>> getArchivedTasksByProject(@PathVariable Long projectId, Principal principal) {
        LOG.debug("REST request to get archived tasks for project {}", projectId);
        List<TaskDTO> archivedTasks = taskService.findArchivedTasksByProject(projectId, principal.getName());
        return ResponseEntity.ok(archivedTasks);
    }

    @GetMapping("/archived/{taskId}/members")
    public ResponseEntity<Set<UserDTO>> getMembersOfArchivedTask(@PathVariable Long taskId) {
        Set<UserDTO> members = taskService.findMembersOfArchivedTask(taskId);
        return ResponseEntity.ok(members);
    }

    @GetMapping("/{parentTaskId}/subtasks")
    public ResponseEntity<List<TaskDTO>> getSubtasks(@PathVariable Long parentTaskId) {
        List<TaskDTO> result = taskService.getSubtasks(parentTaskId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{parentTaskId}/subtasks")
    public ResponseEntity<TaskDTO> createSubTask(
        @PathVariable Long parentTaskId,
        @RequestBody TaskDTO subTaskDTO
    ) throws URISyntaxException {
        TaskDTO result = taskService.createSubTask(parentTaskId, subTaskDTO);
        return ResponseEntity
            .created(new URI("/api/tasks/" + result.getId()))
            .body(result);
    }

    @GetMapping("/tasks/{taskId}/parent")
    public ResponseEntity<TaskDTO> getParentTask(@PathVariable Long taskId) {
        Optional<TaskDTO> result = taskService.findParentTask(taskId);
        return result.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

}
