package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.WorkGroup;
import com.dcmc.apps.taskmanager.domain.WorkGroupUserRole;
import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;
import com.dcmc.apps.taskmanager.repository.UserRepository;
import com.dcmc.apps.taskmanager.repository.WorkGroupRepository;
import com.dcmc.apps.taskmanager.repository.WorkGroupUserRoleRepository;
import com.dcmc.apps.taskmanager.security.SecurityUtils;
import com.dcmc.apps.taskmanager.service.dto.UserDTO;
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
        // 1. Obtener el login del usuario actual
        String currentUserLogin = SecurityUtils.getCurrentUserLogin().orElseThrow();

        LOG.debug("Request to save WorkGroup : {}", workGroupDTO);

        // 2. Crear la entidad WorkGroup a partir del DTO
        WorkGroup workGroup = workGroupMapper.toEntity(workGroupDTO);

        // 3. Guardar el grupo en la base de datos
        workGroup = workGroupRepository.save(workGroup);

        // 4. Buscar el usuario actual
        var user = userRepository.findOneByLogin(currentUserLogin)
            .orElseThrow(() -> new BadRequestAlertException("Usuario no encontrado", "User", "notfound"));

        // 5. Crear y guardar la relación OWNER entre el usuario y el grupo
        WorkGroupUserRole ownerRole = new WorkGroupUserRole();
        ownerRole.setGroup(workGroup);
        ownerRole.setUser(user);
        ownerRole.setRole(GroupRole.OWNER);
        workGroupUserRoleRepository.save(ownerRole);

        // 6. Retornar el DTO del grupo creado
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
        WorkGroup workGroup = workGroupMapper.toEntity(workGroupDTO);
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
        return workGroupRepository.findAll(pageable).map(workGroupMapper::toDto);
    }

    /**
     * Get all the workGroups with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<WorkGroupDTO> findAllWithEagerRelationships(Pageable pageable) {
        return workGroupRepository.findAllWithEagerRelationships(pageable).map(workGroupMapper::toDto);
    }

    /**
     * Get one workGroup by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<WorkGroupDTO> findOne(Long id) {
        LOG.debug("Request to get WorkGroup : {}", id);
        return workGroupRepository.findOneWithEagerRelationships(id).map(workGroupMapper::toDto);
    }

    /**
     * Delete the workGroup by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete WorkGroup : {}", id);
        workGroupRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsersInGroup(Long groupId) {
        return workGroupUserRoleRepository.findAllByGroup_Id(groupId).stream()
            .map(WorkGroupUserRole::getUser)
            .map(userMapper::userToUserDTO)
            .collect(Collectors.toList());
    }

}
