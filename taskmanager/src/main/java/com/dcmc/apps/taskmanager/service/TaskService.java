package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.Task;
import com.dcmc.apps.taskmanager.domain.User;
import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;
import com.dcmc.apps.taskmanager.domain.enumeration.TaskStatus;
import com.dcmc.apps.taskmanager.repository.TaskRepository;
import com.dcmc.apps.taskmanager.repository.UserRepository;
import com.dcmc.apps.taskmanager.repository.WorkGroupUserRoleRepository;
import com.dcmc.apps.taskmanager.security.SecurityUtils;
import com.dcmc.apps.taskmanager.service.dto.TaskDTO;
import com.dcmc.apps.taskmanager.service.mapper.TaskMapper;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.dcmc.apps.taskmanager.web.rest.errors.BadRequestAlertException;
import jakarta.persistence.EntityNotFoundException;
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
    private final UserRepository userRepository;
    private final TaskMapper taskMapper;
    private final GroupSecurityService  groupSecurityService;
    private final WorkGroupUserRoleRepository workGroupUserRoleRepository;

    public TaskService(TaskRepository taskRepository
        , TaskMapper taskMapper
        , GroupSecurityService groupSecurityService
        ,UserRepository userRepository
        , WorkGroupUserRoleRepository workGroupUserRoleRepository) {
        this.taskRepository = taskRepository;
        this.taskMapper = taskMapper;
        this.groupSecurityService = groupSecurityService;
        this.userRepository = userRepository;
        this.workGroupUserRoleRepository = workGroupUserRoleRepository;
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
        Task existingTask = taskRepository.findById(taskDTO.getId())
            .orElseThrow(() -> new EntityNotFoundException("Tarea no encontrada"));

        if (existingTask.getArchived()) {
            throw new BadRequestAlertException("No se puede editar una tarea archivada", "Task", "archived");
        }

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
                if (existingTask.getArchived()) {
                    throw new BadRequestAlertException("No se puede editar una tarea archivada", "Task", "archived");
                }
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

    @Transactional
    public void deleteArchivedTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new EntityNotFoundException("Tarea no encontrada"));

        if (!task.getArchived()) {
            throw new BadRequestAlertException("Solo se pueden eliminar tareas archivadas", "Task", "notarchived");
        }

        // Validar que el usuario actual sea OWNER o MODERADOR del grupo de la tarea
        Long groupId = task.getWorkGroup().getId();
        if (!groupSecurityService.isModeratorOrOwner(groupId)) {
            throw new AccessDeniedException("Solo OWNER o MODERADOR puede eliminar tareas archivadas.");
        }

        taskRepository.delete(task);
    }


    @Transactional(readOnly = true)
    public List<TaskDTO> findArchivedTasksForCurrentUser() {
        String login = SecurityUtils.getCurrentUserLogin().orElseThrow();
        List<Task> archivedTasks = taskRepository.findArchivedTasksByUserLogin(login);
        return taskMapper.toDto(archivedTasks);
    }

    @Transactional
    public TaskDTO assignUserToTask(Long taskId, String userLogin) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new EntityNotFoundException("Tarea no encontrada"));

        if (task.getArchived()) {
            throw new BadRequestAlertException("No se puede modificar una tarea archivada", "Task", "archived");
        }

        if (task.getStatus() == TaskStatus.DONE) {
            throw new BadRequestAlertException("No se puede asignar usuarios a una tarea completada (DONE)", "Task", "invalidstatus");
        }

        // Verificar que el usuario está en el grupo de trabajo de la tarea
        boolean isMember = workGroupUserRoleRepository.existsByUser_LoginAndGroup_Id(userLogin, task.getWorkGroup().getId());
        if (!isMember) {
            throw new BadRequestAlertException("El usuario no pertenece al grupo de trabajo", "Task", "notingroup");
        }

        // Buscar usuario y agregarlo a la lista de asignados
        User user = userRepository.findOneByLogin(userLogin).orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        task.getAssignedTos().add(user);
        task.setUpdateTime(Instant.now());

        return taskMapper.toDto(taskRepository.save(task));
    }



}
