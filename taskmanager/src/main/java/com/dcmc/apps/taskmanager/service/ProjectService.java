package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.Project;
import com.dcmc.apps.taskmanager.domain.User;
import com.dcmc.apps.taskmanager.domain.WorkGroup;
import com.dcmc.apps.taskmanager.domain.WorkGroupUserRole;
import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;
import com.dcmc.apps.taskmanager.repository.ProjectRepository;
import com.dcmc.apps.taskmanager.repository.UserRepository;
import com.dcmc.apps.taskmanager.repository.WorkGroupUserRoleRepository;
import com.dcmc.apps.taskmanager.security.SecurityUtils;
import com.dcmc.apps.taskmanager.service.dto.ProjectDTO;
import com.dcmc.apps.taskmanager.service.dto.UserDTO;
import com.dcmc.apps.taskmanager.service.mapper.ProjectMapper;

import java.util.List;
import java.util.Optional;
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
 * Service Implementation for managing {@link com.dcmc.apps.taskmanager.domain.Project}.
 */
@Service
@Transactional
public class ProjectService {

    private static final Logger LOG = LoggerFactory.getLogger(ProjectService.class);

    private final ProjectRepository projectRepository;
    private  final UserRepository userRepository;
    private final ProjectMapper projectMapper;
    private final WorkGroupUserRoleRepository workGroupUserRoleRepository;
    private final UserMapper userMapper;

    public ProjectService(ProjectRepository projectRepository
        , ProjectMapper projectMapper
        , UserRepository userRepository
        , WorkGroupUserRoleRepository workGroupUserRoleRepository
        , UserMapper userMapper)
    {
        this.projectRepository = projectRepository;
        this.projectMapper = projectMapper;
        this.userRepository = userRepository;
        this.workGroupUserRoleRepository = workGroupUserRoleRepository;
        this.userMapper = userMapper;
    }

    /**
     * Save a project.
     *
     * @param projectDTO the entity to save.
     * @return the persisted entity.
     */
    public ProjectDTO save(ProjectDTO projectDTO) {
        Project project = projectMapper.toEntity(projectDTO);

        String currentUserLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new AccessDeniedException("Usuario no autenticado"));

        User user = userRepository.findOneByLogin(currentUserLogin)
            .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        WorkGroup workGroup = project.getWorkGroup();
        if (workGroup != null) {
            boolean userInGroup = workGroupUserRoleRepository.existsByUser_LoginAndGroup_Id(user.getLogin(), workGroup.getId());
            if (!userInGroup) {
                // Lanzar excepción si no pertenece al grupo
                throw new AccessDeniedException("El usuario no pertenece al grupo de trabajo del proyecto");
            }
        }

        // Agrega al usuario como miembro del proyecto
        project.getMembers().add(user);

        project = projectRepository.save(project);

        return projectMapper.toDto(project);
    }

    /**
     * Update a project.
     *
     * @param projectDTO the entity to save.
     * @return the persisted entity.
     */
    public ProjectDTO update(ProjectDTO projectDTO) {
        LOG.debug("Request to update Project : {}", projectDTO);
        Project project = projectMapper.toEntity(projectDTO);
        project = projectRepository.save(project);
        return projectMapper.toDto(project);
    }

    /**
     * Partially update a project.
     *
     * @param projectDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<ProjectDTO> partialUpdate(ProjectDTO projectDTO) {
        LOG.debug("Request to partially update Project : {}", projectDTO);

        return projectRepository
            .findById(projectDTO.getId())
            .map(existingProject -> {
                projectMapper.partialUpdate(existingProject, projectDTO);

                return existingProject;
            })
            .map(projectRepository::save)
            .map(projectMapper::toDto);
    }

    /**
     * Get all the projects.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<ProjectDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all Projects");
        return projectRepository.findAll(pageable).map(projectMapper::toDto);
    }

    /**
     * Get all the projects with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<ProjectDTO> findAllWithEagerRelationships(Pageable pageable) {
        return projectRepository.findAllWithEagerRelationships(pageable).map(projectMapper::toDto);
    }

    /**
     * Get one project by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<ProjectDTO> findOne(Long id) {
        LOG.debug("Request to get Project : {}", id);
        return projectRepository.findOneWithEagerRelationships(id).map(projectMapper::toDto);
    }

    /**
     * Delete the project by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Project : {}", id);
        projectRepository.deleteById(id);
    }

    @Transactional
    public ProjectDTO assignUserToProject(Long projectId, String userLogin) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new EntityNotFoundException("Proyecto no encontrado"));

        Long groupId = project.getWorkGroup().getId();

        // 💡 Verificamos si el usuario pertenece al grupo del proyecto
        boolean isUserInGroup = workGroupUserRoleRepository.existsByUser_LoginAndGroup_Id(userLogin, groupId);
        if (!isUserInGroup) {
            throw new AccessDeniedException("El usuario no pertenece al grupo de trabajo del proyecto");
        }

        // 🔎 Obtenemos al usuario por login
        User user = userRepository.findOneByLogin(userLogin)
            .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        // ➕ Lo agregamos como miembro del proyecto si aún no lo es
        if (!project.getMembers().contains(user)) {
            project.getMembers().add(user);
            project = projectRepository.save(project);
        }
        return projectMapper.toDto(project);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> findMembersByProjectId(Long projectId, String currentUserLogin) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new EntityNotFoundException("Proyecto no encontrado"));

        Long groupId = project.getWorkGroup().getId();

        // Validar si el usuario actual pertenece al grupo
        boolean isMember = workGroupUserRoleRepository.existsByUser_LoginAndGroup_Id(currentUserLogin, groupId);
        if (!isMember) {
            throw new AccessDeniedException("El usuario no tiene rol en el grupo asociado al proyecto.");
        }

        // Convertir Set<User> a List<UserDTO>
        return project.getMembers()
            .stream()
            .map(userMapper::userToUserDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectDTO> findByWorkGroupId(Long workGroupId) {
        List<Project> projects = projectRepository.findAllByWorkGroup_Id(workGroupId);
        return projectMapper.toDto(projects);
    }

    @Transactional
    public void removeUserFromProject(Long projectId, String usernameToRemove, String currentUsername) {
        Project project = projectRepository.findByIdWithMembers(projectId)
            .orElseThrow(() -> new EntityNotFoundException("Proyecto no encontrado"));

        // Verificar que currentUser pertenece al proyecto
        boolean isAuthorized = project.getMembers().stream()
            .anyMatch(user -> user.getLogin().equals(currentUsername));
        if (!isAuthorized) {
            throw new AccessDeniedException("No tienes permiso para modificar este proyecto");
        }

        // Verificar que el usuario a eliminar pertenece al proyecto
        Optional<User> userToRemoveOpt = project.getMembers().stream()
            .filter(u -> u.getLogin().equals(usernameToRemove))
            .findFirst();
        if (userToRemoveOpt.isEmpty()) {
            throw new BadRequestAlertException("El usuario no pertenece al proyecto", "Project", "usernotinproject");
        }

        // Eliminar y guardar
        project.getMembers().remove(userToRemoveOpt.get());
        projectRepository.save(project);
    }


}
