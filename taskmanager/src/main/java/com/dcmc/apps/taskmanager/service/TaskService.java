package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.Task;
import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;
import com.dcmc.apps.taskmanager.domain.enumeration.TaskStatus;
import com.dcmc.apps.taskmanager.repository.TaskRepository;
import com.dcmc.apps.taskmanager.service.dto.TaskDTO;
import com.dcmc.apps.taskmanager.service.mapper.TaskMapper;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.dcmc.apps.taskmanager.web.rest.errors.BadRequestAlertException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.dcmc.apps.taskmanager.domain.Task}.
 */
@Service
@Transactional
public class TaskService {

    private static final Logger LOG = LoggerFactory.getLogger(TaskService.class);

    private final TaskRepository taskRepository;

    private final TaskMapper taskMapper;

    private final GroupSecurityService  groupSecurityService;

    public TaskService(TaskRepository taskRepository
        , TaskMapper taskMapper
        , GroupSecurityService groupSecurityService) {
        this.taskRepository = taskRepository;
        this.taskMapper = taskMapper;
        this.groupSecurityService = groupSecurityService;
    }

    /**
     * Save a task.
     *
     * @param taskDTO the entity to save.
     * @return the persisted entity.
     */
    public TaskDTO save(TaskDTO taskDTO) {
        LOG.debug("Request to save Task : {}", taskDTO);
        Long groupId = taskDTO.getWorkGroup().getId();

        GroupRole role = groupSecurityService.getUserRoleInGroup((groupId));
        if (role == null) {
            throw new AccessDeniedException("No puedes crear tareas en este grupo.");
        }

        Task task = taskMapper.toEntity(taskDTO);
        task = taskRepository.save(task);
        return taskMapper.toDto(task);
    }

    /**
     * Update a task.
     *
     * @param taskDTO the entity to save.
     * @return the persisted entity.
     */
    public TaskDTO update(TaskDTO taskDTO) {
        LOG.debug("Request to update Task : {}", taskDTO);
        Task task = taskMapper.toEntity(taskDTO);
        task = taskRepository.save(task);
        return taskMapper.toDto(task);
    }

    /**
     * Partially update a task.
     *
     * @param taskDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<TaskDTO> partialUpdate(TaskDTO taskDTO) {
        LOG.debug("Request to partially update Task : {}", taskDTO);

        return taskRepository
            .findById(taskDTO.getId())
            .map(existingTask -> {
                taskMapper.partialUpdate(existingTask, taskDTO);

                return existingTask;
            })
            .map(taskRepository::save)
            .map(taskMapper::toDto);
    }

    /**
     * Get all the tasks.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<TaskDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all Tasks");
        return taskRepository.findAll(pageable).map(taskMapper::toDto);
    }

    /**
     * Get all the tasks with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<TaskDTO> findAllWithEagerRelationships(Pageable pageable) {
        return taskRepository.findAllWithEagerRelationships(pageable).map(taskMapper::toDto);
    }

    /**
     * Get one task by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<TaskDTO> findOne(Long id) {
        LOG.debug("Request to get Task : {}", id);
        return taskRepository.findOneWithEagerRelationships(id).map(taskMapper::toDto);
    }

    /**
     * Delete the task by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Task : {}", id);
        taskRepository.deleteById(id);
    }

    public TaskDTO archiveTask(Long taskId) {
        Task task = taskRepository.findById(taskId).orElseThrow();

        if (task.getStatus() != TaskStatus.DONE) {
            throw new BadRequestAlertException("Solo se pueden archivar tareas DONE", "Task", "invalidstatus");
        }

        if (!groupSecurityService.isModeratorOrOwner(task.getWorkGroup().getId())) {
            throw new AccessDeniedException("Solo OWNER o MODERADOR puede archivar tareas.");
        }

        task.setArchived(true);
        task.setUpdateTime(Instant.now());
        return taskMapper.toDto(taskRepository.save(task));
    }

    @Transactional(readOnly = true)
    public List<TaskDTO> findArchivedTasksByGroup(Long groupId) {
        groupSecurityService.checkModerator(groupId);
        return taskRepository.findByWorkGroup_IdAndArchivedTrue(groupId)
            .stream()
            .map(taskMapper::toDto)
            .toList();
    }

}
