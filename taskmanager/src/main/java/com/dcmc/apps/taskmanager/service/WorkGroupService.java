package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.WorkGroup;
import com.dcmc.apps.taskmanager.domain.WorkGroupUserRole;
import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;
import com.dcmc.apps.taskmanager.repository.UserRepository;
import com.dcmc.apps.taskmanager.repository.WorkGroupRepository;
import com.dcmc.apps.taskmanager.repository.WorkGroupUserRoleRepository;
import com.dcmc.apps.taskmanager.security.SecurityUtils;
import com.dcmc.apps.taskmanager.service.dto.UserDTO;
import com.dcmc.apps.taskmanager.service.dto.UserGroupRoleDTO;
import com.dcmc.apps.taskmanager.service.dto.WorkGroupDTO;
import com.dcmc.apps.taskmanager.service.mapper.UserMapper;
import com.dcmc.apps.taskmanager.service.mapper.WorkGroupMapper;

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
 * Service Implementation for managing {@link com.dcmc.apps.taskmanager.domain.WorkGroup}.
 */
@Service
@Transactional
public class WorkGroupService {

    private static final Logger LOG = LoggerFactory.getLogger(WorkGroupService.class);

    private final GroupSecurityService groupSecurityService;
    private final WorkGroupRepository workGroupRepository;
    private final WorkGroupMapper workGroupMapper;
    private final WorkGroupUserRoleRepository workGroupUserRoleRepository;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public WorkGroupService(
        WorkGroupRepository workGroupRepository,
        WorkGroupMapper workGroupMapper,
        GroupSecurityService groupSecurityService,
        WorkGroupUserRoleRepository workGroupUserRoleRepository,
        UserRepository userRepository,
        UserMapper userMapper
    ) {
        this.workGroupRepository = workGroupRepository;
        this.workGroupMapper = workGroupMapper;
        this.groupSecurityService = groupSecurityService;
        this.workGroupUserRoleRepository = workGroupUserRoleRepository;
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    /**
     * Save a workGroup.
     *
     * @param workGroupDTO the entity to save.
     * @return the persisted entity.
     */
    public WorkGroupDTO save(WorkGroupDTO workGroupDTO) {
        String currentUserLogin = SecurityUtils.getCurrentUserLogin().orElseThrow();
        LOG.debug("Request to save WorkGroup : {}", workGroupDTO);

        WorkGroup workGroup = workGroupMapper.toEntity(workGroupDTO);

        // Establecer deleted = false (activo)
        workGroup.setDeleted(false);

        workGroup = workGroupRepository.save(workGroup);

        var user = userRepository.findOneByLogin(currentUserLogin)
            .orElseThrow(() -> new BadRequestAlertException("Usuario no encontrado", "User", "notfound"));

        WorkGroupUserRole ownerRole = new WorkGroupUserRole();
        ownerRole.setGroup(workGroup);
        ownerRole.setUser(user);
        ownerRole.setRole(GroupRole.OWNER);
        workGroupUserRoleRepository.save(ownerRole);

        return workGroupMapper.toDto(workGroup);
    }

    /**
     * Update a workGroup.
     *
     * @param workGroupDTO the entity to save.
     * @return the persisted entity.
     */
    public WorkGroupDTO update(WorkGroupDTO workGroupDTO) {
        LOG.debug("Request to update WorkGroup : {}", workGroupDTO);
        WorkGroup workGroup = workGroupRepository.findById(workGroupDTO.getId())
            .filter(wg -> Boolean.FALSE.equals(wg.getDeleted()))
            .orElseThrow(() -> new BadRequestAlertException("WorkGroup no encontrado o eliminado", "WorkGroup", "notfound"));

        workGroupMapper.partialUpdate(workGroup, workGroupDTO);

        workGroup = workGroupRepository.save(workGroup);
        return workGroupMapper.toDto(workGroup);
    }

    /**
     * Partially update a workGroup.
     *
     * @param workGroupDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<WorkGroupDTO> partialUpdate(WorkGroupDTO workGroupDTO) {
        LOG.debug("Request to partially update WorkGroup : {}", workGroupDTO);

        return workGroupRepository
            .findById(workGroupDTO.getId())
            .filter(wg -> Boolean.FALSE.equals(wg.getDeleted()))
            .map(existingWorkGroup -> {
                workGroupMapper.partialUpdate(existingWorkGroup, workGroupDTO);
                return existingWorkGroup;
            })
            .map(workGroupRepository::save)
            .map(workGroupMapper::toDto);
    }

    /**
     * Get all the workGroups.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<WorkGroupDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all WorkGroups");
        return workGroupRepository.findAllByDeletedFalse(pageable).map(workGroupMapper::toDto);
    }

    public Page<WorkGroupDTO> findAllWithEagerRelationships(Pageable pageable) {
        return workGroupRepository.findAllByDeletedFalse(pageable).map(workGroupMapper::toDto);
    }

    /**
     * Get all the workGroups with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */

    /**
     * Get one workGroup by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<WorkGroupDTO> findOne(Long id) {
        LOG.debug("Request to get WorkGroup : {}", id);
        return workGroupRepository.findOneWithEagerRelationships(id)
            .filter(wg -> Boolean.FALSE.equals(wg.getDeleted()))
            .map(workGroupMapper::toDto);
    }

    /**
     * Delete the workGroup by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete WorkGroup : {}", id);
        WorkGroup workGroup = workGroupRepository.findById(id)
            .orElseThrow(() -> new BadRequestAlertException("WorkGroup no encontrado", "WorkGroup", "notfound"));

        workGroup.setDeleted(true);
        workGroupRepository.save(workGroup);
    }

    @Transactional(readOnly = true)
    public List<UserGroupRoleDTO> getAllUsersInGroup(Long groupId) {
        WorkGroup wg = workGroupRepository.findById(groupId)
            .filter(w -> Boolean.FALSE.equals(w.getDeleted()))
            .orElseThrow(() -> new BadRequestAlertException("WorkGroup no encontrado o eliminado", "WorkGroup", "notfound"));

        return workGroupUserRoleRepository.findAllByGroup_Id(groupId).stream()
            .map(wgur -> new UserGroupRoleDTO(
                userMapper.userToUserDTO(wgur.getUser()),
                wgur.getRole()
            ))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkGroupDTO> findByCurrentUser() {
        String currentUserLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new IllegalStateException("No hay un usuario autenticado"));

        List<WorkGroup> groups = workGroupUserRoleRepository.findAllByUser_Login(currentUserLogin).stream()
            .map(WorkGroupUserRole::getGroup)
            .filter(wg -> Boolean.FALSE.equals(wg.getDeleted()))
            .distinct()
            .toList();

        return workGroupMapper.toDto(groups);
    }

}
