package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.Comment;
import com.dcmc.apps.taskmanager.domain.Project;
import com.dcmc.apps.taskmanager.domain.Task;
import com.dcmc.apps.taskmanager.domain.User;
import com.dcmc.apps.taskmanager.repository.CommentRepository;
import com.dcmc.apps.taskmanager.repository.TaskRepository;
import com.dcmc.apps.taskmanager.repository.UserRepository;
import com.dcmc.apps.taskmanager.security.SecurityUtils;
import com.dcmc.apps.taskmanager.service.dto.CommentDTO;
import com.dcmc.apps.taskmanager.service.mapper.CommentMapper;

import java.time.Instant;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.dcmc.apps.taskmanager.web.rest.errors.BadRequestAlertException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.dcmc.apps.taskmanager.domain.Comment}.
 */
@Service
@Transactional
public class CommentService {

    private static final Logger LOG = LoggerFactory.getLogger(CommentService.class);

    private final CommentRepository commentRepository;
    private final GroupSecurityService groupSecurityService;
    private final CommentMapper commentMapper;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    public CommentService(CommentRepository commentRepository
        , CommentMapper commentMapper
        ,GroupSecurityService groupSecurityService
        , UserRepository userRepository
        , TaskRepository taskRepository) {
        this.commentRepository = commentRepository;
        this.commentMapper = commentMapper;
        this.groupSecurityService = groupSecurityService;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
    }

    /**
     * Save a comment.
     *
     * @param commentDTO the entity to save.
     * @return the persisted entity.
     */
    public CommentDTO save(CommentDTO commentDTO) {
        LOG.debug("Request to save Comment : {}", commentDTO);

        String currentUserLogin = SecurityUtils.getCurrentUserLogin().orElseThrow();

        Long taskId = commentDTO.getTaskId();
        Long groupId = commentRepository.findGroupIdByTaskId(taskId)
            .orElseThrow(() -> new IllegalArgumentException("No se encontró el grupo para la tarea"));

        if (groupSecurityService.getUserRoleOf(currentUserLogin, groupId) == null) {
            throw new AccessDeniedException("Solo los miembros del grupo pueden comentar.");
        }

        Comment comment = commentMapper.toEntity(commentDTO);

        // Busca el usuario y lo asigna como autor
        User author = userRepository.findOneByLogin(currentUserLogin)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        comment.setAuthor(author);
        comment.setCreatedAt(Instant.now());
        comment = commentRepository.save(comment);
        return commentMapper.toDto(comment);
    }

    /**
     * Update a comment.
     *
     * @param commentDTO the entity to save.
     * @return the persisted entity.
     */
    public CommentDTO update(CommentDTO commentDTO) {
        LOG.debug("Request to update Comment : {}", commentDTO);
        Comment comment = commentMapper.toEntity(commentDTO);
        comment = commentRepository.save(comment);
        return commentMapper.toDto(comment);
    }

    /**
     * Partially update a comment.
     *
     * @param commentDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<CommentDTO> partialUpdate(CommentDTO commentDTO) {
        LOG.debug("Request to partially update Comment : {}", commentDTO);

        return commentRepository
            .findById(commentDTO.getId())
            .map(existingComment -> {
                commentMapper.partialUpdate(existingComment, commentDTO);

                return existingComment;
            })
            .map(commentRepository::save)
            .map(commentMapper::toDto);
    }

    /**
     * Get all the comments.
     *
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public List<CommentDTO> findAll() {
        LOG.debug("Request to get all Comments");
        return commentRepository.findAll().stream().map(commentMapper::toDto).collect(Collectors.toCollection(LinkedList::new));
    }

    /**
     * Get all the comments with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<CommentDTO> findAllWithEagerRelationships(Pageable pageable) {
        return commentRepository.findAllWithEagerRelationships(pageable).map(commentMapper::toDto);
    }

    /**
     * Get one comment by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<CommentDTO> findOne(Long id) {
        LOG.debug("Request to get Comment : {}", id);
        return commentRepository.findOneWithEagerRelationships(id).map(commentMapper::toDto);
    }

    /**
     * Delete the comment by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Comment : {}", id);
        commentRepository.deleteById(id);
    }

    public List<CommentDTO> findByTaskIdAuthorized(Long taskId, String username) {
        Optional<Task> taskOpt = taskRepository.findByIdWithProjectAndMembers(taskId);
        if (taskOpt.isEmpty()) {
            throw new BadRequestAlertException("Tarea no encontrada", "Task", "notfound");
        }

        Task task = taskOpt.get();
        Project project = task.getProject();

        boolean isMember = project.getMembers().stream()
            .anyMatch(user -> user.getLogin().equals(username));

        if (!isMember) {
            throw new AccessDeniedException("El usuario no tiene acceso a esta tarea");
        }

        List<Comment> comments = commentRepository.findByTaskId(taskId);
        return comments.stream().map(commentMapper::toDto).toList();
    }

}
