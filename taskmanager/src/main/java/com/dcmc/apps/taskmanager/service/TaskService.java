package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.Priority;
import com.dcmc.apps.taskmanager.domain.Project;
import com.dcmc.apps.taskmanager.domain.Task;
import com.dcmc.apps.taskmanager.domain.User;
import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;
import com.dcmc.apps.taskmanager.domain.enumeration.TaskStatus;
import com.dcmc.apps.taskmanager.repository.*;
import com.dcmc.apps.taskmanager.security.SecurityUtils;
import com.dcmc.apps.taskmanager.service.dto.TaskDTO;
import com.dcmc.apps.taskmanager.service.dto.UserDTO;
import com.dcmc.apps.taskmanager.service.mapper.TaskMapper;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import com.dcmc.apps.taskmanager.service.mapper.UserMapper;
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
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TaskMapper taskMapper;
    private final UserMapper userMapper;
    private final GroupSecurityService  groupSecurityService;
    private final WorkGroupUserRoleRepository workGroupUserRoleRepository;
    private final PriorityRepository priorityRepository;

    public TaskService(TaskRepository taskRepository
        , TaskMapper taskMapper
        , GroupSecurityService groupSecurityService
        ,UserRepository userRepository
        , WorkGroupUserRoleRepository workGroupUserRoleRepository
        , UserMapper userMapper
        , ProjectRepository projectRepository
        , PriorityRepository priorityRepository) {
        this.taskRepository = taskRepository;
        this.taskMapper = taskMapper;
        this.groupSecurityService = groupSecurityService;
        this.userRepository = userRepository;
        this.workGroupUserRoleRepository = workGroupUserRoleRepository;
        this.userMapper = userMapper;
        this.projectRepository = projectRepository;
        this.priorityRepository = priorityRepository;
    }

    /**
     * Save a task.
     *
     * @param taskDTO the entity to save.
     * @return the persisted entity.
     */
    public TaskDTO save(TaskDTO taskDTO) {
        LOG.debug("Request to save Task : {}", taskDTO);
        Long groupId = taskDTO.getWorkGroupId();

        GroupRole role = groupSecurityService.getUserRoleInGroup(groupId);
        if (role == null) {
            throw new AccessDeniedException("No puedes crear tareas en este grupo.");
        }

        String currentUserLogin = SecurityUtils.getCurrentUserLogin().orElseThrow();
        User currentUser = userRepository.findOneByLogin(currentUserLogin)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        Task task = taskMapper.toEntity(taskDTO);
        Instant now = Instant.now();

        // 🔽 Obtener y asignar la prioridad desde el DTO
        if (taskDTO.getPriority() != null && taskDTO.getPriority().getId() != null) {
            Priority priorityEntity = priorityRepository.findById(taskDTO.getPriority().getId())
                .orElseThrow(() -> new EntityNotFoundException("Prioridad no encontrada con id " + taskDTO.getPriority().getId()));
            task.setPriority(priorityEntity);
        } else {
            throw new BadRequestAlertException("La prioridad es requerida", "Task", "prioritymissing");
        }

        task.setCreateTime(now);
        task.setUpdateTime(now);
        task.setArchived(false);
        task.setDeleted(false);
        task.getAssignedTos().add(currentUser);

        task = taskRepository.save(task);

        // Subtareas
        if (taskDTO.getSubTaskIds() != null && !taskDTO.getSubTaskIds().isEmpty()) {
            for (Long subTaskId : taskDTO.getSubTaskIds()) {
                Task subTask = taskRepository.findById(subTaskId)
                    .orElseThrow(() -> new EntityNotFoundException("Subtarea no encontrada con id " + subTaskId));

                if (Objects.equals(subTask.getId(), task.getId())) {
                    throw new BadRequestAlertException("Una tarea no puede ser subtarea de sí misma", "Task", "invalidsubtask");
                }

                subTask.setParentTask(task);
                subTask.setWorkGroup(task.getWorkGroup());
                subTask.setProject(task.getProject());
                subTask.setUpdateTime(now);
                taskRepository.save(subTask);
            }
        }

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

        if (existingTask.getArchived() || Boolean.TRUE.equals(existingTask.getDeleted())) {
            throw new BadRequestAlertException("No se puede editar una tarea archivada o eliminada", "Task", "archived_or_deleted");
        }

        LOG.debug("Request to update Task : {}", taskDTO);
        Task task = taskMapper.toEntity(taskDTO);
        Instant now = Instant.now();
        task.setUpdateTime(now);

        // Asignar prioridad usando la entidad Priority
        if (taskDTO.getPriority() != null && taskDTO.getPriority().getId() != null) {
            Priority priorityEntity = priorityRepository.findById(taskDTO.getPriority().getId())
                .orElseThrow(() -> new EntityNotFoundException("Prioridad no encontrada con id " + taskDTO.getPriority().getId()));
            task.setPriority(priorityEntity);
        } else {
            throw new BadRequestAlertException("La prioridad es requerida", "Task", "prioritymissing");
        }

        task = taskRepository.save(task);

        if (task.getSubTasks() != null && !task.getSubTasks().isEmpty()) {
            for (Task subTask : task.getSubTasks()) {
                if (Boolean.TRUE.equals(subTask.getArchived()) || Boolean.TRUE.equals(subTask.getDeleted())) {
                    throw new BadRequestAlertException("No se puede editar una subtarea archivada o eliminada", "Task", "archived_or_deleted");
                }

                subTask.setParentTask(task);
                subTask.setWorkGroup(task.getWorkGroup());
                subTask.setProject(task.getProject());
                subTask.setUpdateTime(now);
                taskRepository.save(subTask);
            }
        }

        return taskMapper.toDto(task);
    }


    /**
     * Partially update a task.
     *
     * @param taskDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<TaskDTO> partialUpdate(TaskDTO taskDTO) {
        return taskRepository.findById(taskDTO.getId())
            .map(existingTask -> {
                if (Boolean.TRUE.equals(existingTask.getArchived()) || Boolean.TRUE.equals(existingTask.getDeleted())) {
                    throw new BadRequestAlertException("No se puede editar una tarea archivada o eliminada", "Task", "archived_or_deleted");
                }

                taskMapper.partialUpdate(existingTask, taskDTO);

                // Actualizar prioridad si viene en el DTO
                if (taskDTO.getPriority() != null && taskDTO.getPriority().getId() != null) {
                    Priority priorityEntity = priorityRepository.findById(taskDTO.getPriority().getId())
                        .orElseThrow(() -> new EntityNotFoundException("Prioridad no encontrada con id " + taskDTO.getPriority().getId()));
                    existingTask.setPriority(priorityEntity);
                }

                // Actualizar subtareas si vienen en el DTO
                if (taskDTO.getSubTaskIds() != null) {
                    Set<Task> subTaskEntities = taskDTO.getSubTaskIds().stream()
                        .map(taskMapper::fromIdTask)
                        .peek(subTask -> subTask.setParentTask(existingTask))
                        .collect(Collectors.toSet());

                    existingTask.setSubTasks(subTaskEntities);
                }

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
        return taskRepository.findAllByDeletedFalse(pageable).map(taskMapper::toDto);
    }

    /**
     * Get all the tasks with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<TaskDTO> findAllWithEagerRelationships(Pageable pageable) {
        return taskRepository.findAllWithEagerRelationshipsByDeletedFalse(pageable).map(taskMapper::toDto);
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
        return taskRepository.findOneWithEagerRelationships(id)
            .filter(task -> !Boolean.TRUE.equals(task.getDeleted()))
            .map(taskMapper::toDto);
    }

    @Transactional
    public void delete(Long taskId, Long projectId, String username) {
        Optional<Task> taskOpt = taskRepository.findByIdWithProjectAndMembers(taskId);
        if (taskOpt.isEmpty()) {
            throw new BadRequestAlertException("Tarea no encontrada", "Task", "notfound");
        }

        Task task = taskOpt.get();

        if (task.getDeleted()) {
            throw new BadRequestAlertException("La tarea ya fue eliminada", "Task", "alreadydeleted");
        }

        if (task.getProject() == null || !task.getProject().getId().equals(projectId)) {
            throw new BadRequestAlertException("La tarea no pertenece al proyecto especificado", "Task", "projectmismatch");
        }

        boolean isMember = task.getProject().getMembers().stream()
            .anyMatch(member -> member.getLogin().equals(username));
        if (!isMember) {
            throw new AccessDeniedException("No tienes permiso para eliminar esta tarea.");
        }

        task.setDeleted(true);
        task.setUpdateTime(Instant.now());
        taskRepository.save(task);
        LOG.debug("Tarea {} marcada como eliminada por el usuario {}", taskId, username);
    }

    public TaskDTO archiveTask(Long taskId) {
        Task task = taskRepository.findById(taskId).orElseThrow();

        if (task.getStatus() != TaskStatus.DONE) {
            throw new BadRequestAlertException("Solo se pueden archivar tareas DONE", "Task", "invalidstatus");
        }

        if (!groupSecurityService.isModeratorOrOwner(task.getWorkGroup().getId())) {
            throw new AccessDeniedException("Solo OWNER o MODERADOR puede archivar tareas.");
        }

        archiveTaskRecursive(task);

        return taskMapper.toDto(taskRepository.save(task));
    }

    @Transactional(readOnly = true)
    public List<TaskDTO> findArchivedTasksByProject(Long projectId) {
        Project project = projectRepository
            .findById(projectId)
            .orElseThrow(() -> new EntityNotFoundException("El proyecto no existe"));

        groupSecurityService.checkUserInProject(projectId);

        return taskRepository.findByProjectIdAndArchivedTrueAndDeletedFalse(projectId)
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

        if (task.getDeleted()) {
            throw new BadRequestAlertException("La tarea ya fue eliminada", "Task", "alreadydeleted");
        }

        Long groupId = task.getWorkGroup().getId();
        if (!groupSecurityService.isModeratorOrOwner(groupId)) {
            throw new AccessDeniedException("Solo OWNER o MODERADOR puede eliminar tareas archivadas.");
        }

        task.setDeleted(true);
        task.setUpdateTime(Instant.now());
        taskRepository.save(task);
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

        if (Boolean.TRUE.equals(task.getDeleted())) {
            throw new BadRequestAlertException("No se puede modificar una tarea eliminada", "Task", "deleted");
        }

        if (task.getArchived()) {
            throw new BadRequestAlertException("No se puede modificar una tarea archivada", "Task", "archived");
        }

        if (task.getStatus() == TaskStatus.DONE) {
            throw new BadRequestAlertException("No se puede asignar usuarios a una tarea completada (DONE)", "Task", "invalidstatus");
        }

        boolean isMember = workGroupUserRoleRepository.existsByUser_LoginAndGroup_Id(userLogin, task.getWorkGroup().getId());
        if (!isMember) {
            throw new BadRequestAlertException("El usuario no pertenece al grupo de trabajo", "Task", "notingroup");
        }

        User user = userRepository.findOneByLogin(userLogin)
            .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        task.getAssignedTos().add(user);
        task.setUpdateTime(Instant.now());

        return taskMapper.toDto(taskRepository.save(task));
    }


    @Transactional(readOnly = true)
    public List<UserDTO> getAssignedUsers(Long taskId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new EntityNotFoundException("Tarea no encontrada"));

        if (Boolean.TRUE.equals(task.getDeleted())) {
            throw new AccessDeniedException("No puedes acceder a una tarea eliminada");
        }

        Long groupId = task.getWorkGroup().getId();

        String currentUserLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new AccessDeniedException("Usuario no autenticado"));

        boolean belongsToGroup = workGroupUserRoleRepository.existsByUser_LoginAndGroup_Id(currentUserLogin, groupId);
        if (!belongsToGroup) {
            throw new AccessDeniedException("No tienes acceso a los usuarios asignados de esta tarea.");
        }

        return task.getAssignedTos().stream()
            .map(userMapper::toDtoLogin)
            .collect(Collectors.toList());
    }


    private void archiveTaskRecursive(Task task) {
        task.setArchived(true);
        task.setUpdateTime(Instant.now());
        taskRepository.save(task);
        if (task.getSubTasks() != null) {
            for (Task subTask : task.getSubTasks()) {
                archiveTaskRecursive(subTask);
            }
        }
    }

    public List<TaskDTO> findTasksByProjectIdForUser(Long projectId, String username) {
        Optional<Project> projectOpt = projectRepository.findByIdWithMembers(projectId);

        if (projectOpt.isEmpty()) {
            throw new BadRequestAlertException("Proyecto no encontrado", "Project", "notfound");
        }

        Project project = projectOpt.get();

        boolean isMember = project.getMembers().stream()
            .anyMatch(user -> user.getLogin().equals(username));

        if (!isMember) {
            throw new AccessDeniedException("El usuario no pertenece a este proyecto");
        }

        List<Task> tasks = taskRepository.findByProjectIdAndDeletedFalse(projectId);
        return tasks.stream().map(taskMapper::toDto).collect(Collectors.toList());
    }

    @Transactional
    public void removeUserFromTask(Long projectId, Long taskId, String usernameToRemove, String currentUsername) {
        Task task = taskRepository.findByIdWithProjectAndMembers(taskId)
            .orElseThrow(() -> new EntityNotFoundException("Tarea no encontrada"));

        if (Boolean.TRUE.equals(task.getDeleted())) {
            throw new BadRequestAlertException("No se puede modificar una tarea eliminada", "Task", "deleted");
        }

        if (!task.getProject().getId().equals(projectId)) {
            throw new BadRequestAlertException("La tarea no pertenece al proyecto indicado", "Task", "projectmismatch");
        }

        boolean isAuthorized = task.getProject().getMembers().stream()
            .anyMatch(u -> u.getLogin().equals(currentUsername));
        if (!isAuthorized) {
            throw new AccessDeniedException("No tienes permiso para modificar esta tarea");
        }

        Optional<User> userToRemoveOpt = task.getAssignedTos().stream()
            .filter(u -> u.getLogin().equals(usernameToRemove))
            .findFirst();

        if (userToRemoveOpt.isEmpty()) {
            throw new BadRequestAlertException("El usuario no está asignado a esta tarea", "Task", "usernotintask");
        }

        task.getAssignedTos().remove(userToRemoveOpt.get());
        task.setUpdateTime(Instant.now());
        taskRepository.save(task);
    }


    @Transactional(readOnly = true)
    public Set<UserDTO> findMembersOfArchivedTask(Long taskId) {
        Task task = taskRepository
            .findById(taskId)
            .orElseThrow(() -> new EntityNotFoundException("Tarea no encontrada"));

        if (!Boolean.TRUE.equals(task.getArchived())) {
            throw new IllegalStateException("La tarea no está archivada");
        }

        String currentLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new IllegalStateException("Usuario no autenticado"));

        // Verifica si el usuario está asignado a la tarea
        boolean isAssigned = task.getAssignedTos().stream()
            .anyMatch(user -> user.getLogin().equals(currentLogin));

        // Verifica si es miembro del proyecto
        boolean isInProject = task.getProject().getMembers().stream()
            .anyMatch(user -> user.getLogin().equals(currentLogin));

        if (!isAssigned && !isInProject) {
            throw new AccessDeniedException("No tienes permiso para ver los miembros de esta tarea archivada");
        }

        return task.getAssignedTos()
            .stream()
            .map(userMapper::userToUserDTO)
            .collect(Collectors.toSet());
    }

    @Transactional(readOnly = true)
    public List<TaskDTO> getSubtasks(Long parentTaskId) {
        return taskRepository.findByParentTask_IdAndDeletedFalse(parentTaskId).stream()
            .map(taskMapper::toDto)
            .toList();
    }

    @Transactional
    public TaskDTO createSubTask(Long parentTaskId, TaskDTO subTaskDTO) {
        Task parent = taskRepository.findById(parentTaskId)
            .orElseThrow(() -> new EntityNotFoundException("Parent task not found"));

        if (Boolean.TRUE.equals(parent.getDeleted())) {
            throw new BadRequestAlertException("No se pueden crear subtareas para una tarea eliminada", "Task", "deleted");
        }

        Task subTask = taskMapper.toEntity(subTaskDTO);
        subTask.setParentTask(parent);
        subTask.setProject(parent.getProject());
        subTask.setWorkGroup(parent.getWorkGroup());

        subTask.setCreateTime(Instant.now());
        subTask.setUpdateTime(Instant.now());
        subTask.setArchived(false);
        subTask.setDeleted(false);

        Task saved = taskRepository.save(subTask);
        return taskMapper.toDto(saved);
    }


    @Transactional(readOnly = true)
    public Optional<TaskDTO> findParentTask(Long taskId) {
        return taskRepository.findById(taskId)
            .filter(task -> !Boolean.TRUE.equals(task.getDeleted()))
            .map(Task::getParentTask)
            .filter(parent -> !Boolean.TRUE.equals(parent.getDeleted()))
            .map(taskMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<TaskDTO> findArchivedTasksByProject(Long projectId, String login) {
        Optional<Project> optionalProject = projectRepository.findById(projectId);

        if (optionalProject.isEmpty()) {
            throw new EntityNotFoundException("El proyecto no existe");
        }

        Project project = optionalProject.get();

        boolean isMember = project.getMembers().stream()
            .anyMatch(user -> user.getLogin().equals(login));

        if (!isMember) {
            throw new AccessDeniedException("No tiene permisos para ver las tareas archivadas de este proyecto");
        }

        return taskRepository
            .findByProjectIdAndArchivedTrueAndDeletedFalse(projectId) // <- filtro extra
            .stream()
            .map(taskMapper::toDto)
            .toList();
    }

}
