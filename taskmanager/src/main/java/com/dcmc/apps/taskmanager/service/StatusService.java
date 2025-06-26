package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.Status;
import com.dcmc.apps.taskmanager.domain.Task;
import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;
import com.dcmc.apps.taskmanager.repository.StatusRepository;
import com.dcmc.apps.taskmanager.repository.TaskRepository;
import com.dcmc.apps.taskmanager.service.dto.StatusDTO;
import com.dcmc.apps.taskmanager.service.mapper.StatusMapper;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class StatusService {

    private static final Logger LOG = LoggerFactory.getLogger(StatusService.class);

    private final StatusRepository statusRepository;
    private final TaskRepository taskRepository;
    private final GroupSecurityService groupSecurityService;
    private final StatusMapper statusMapper;

    public StatusService(
        StatusRepository statusRepository,
        TaskRepository taskRepository,
        StatusMapper statusMapper,
        GroupSecurityService groupSecurityService
    ) {
        this.statusRepository = statusRepository;
        this.taskRepository = taskRepository;
        this.statusMapper = statusMapper;
        this.groupSecurityService = groupSecurityService;
    }

    public StatusDTO save(StatusDTO statusDTO, Long taskId) {
        validateUserPermissionForTask(taskId);
        Status status = statusMapper.toEntity(statusDTO);
        status = statusRepository.save(status);
        return statusMapper.toDto(status);
    }

    public StatusDTO update(StatusDTO statusDTO, Long taskId) {
        validateUserPermissionForTask(taskId);
        Status status = statusMapper.toEntity(statusDTO);
        status = statusRepository.save(status);
        return statusMapper.toDto(status);
    }

    public Optional<StatusDTO> partialUpdate(StatusDTO statusDTO, Long taskId) {
        validateUserPermissionForTask(taskId);

        return statusRepository
            .findById(statusDTO.getId())
            .map(existingStatus -> {
                statusMapper.partialUpdate(existingStatus, statusDTO);
                return existingStatus;
            })
            .map(statusRepository::save)
            .map(statusMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<StatusDTO> findAll() {
        LOG.debug("Request to get all Statuses");
        return statusRepository.findAll().stream()
            .map(statusMapper::toDto)
            .collect(Collectors.toCollection(LinkedList::new));
    }

    @Transactional(readOnly = true)
    public Optional<StatusDTO> findOne(Long id) {
        LOG.debug("Request to get Status : {}", id);
        return statusRepository.findById(id).map(statusMapper::toDto);
    }

    public void delete(Long id, Long taskId) {
        validateUserPermissionForTask(taskId);
        statusRepository.deleteById(id);
    }

    // 🔒 Validación centralizada
    private void validateUserPermissionForTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new EntityNotFoundException("Tarea no encontrada"));

        Long groupId = task.getWorkGroup().getId();
        GroupRole role = groupSecurityService.getUserRoleInGroup(groupId);

        if (role == null || !(role.equals(GroupRole.OWNER) || role.equals(GroupRole.MODERADOR))) {
            throw new AccessDeniedException("No tienes permisos para modificar los estados de esta tarea.");
        }
    }
}
