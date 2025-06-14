package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.WorkGroup;
import com.dcmc.apps.taskmanager.domain.WorkGroupUserRole;
import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;
import com.dcmc.apps.taskmanager.repository.WorkGroupRepository;
import com.dcmc.apps.taskmanager.repository.WorkGroupUserRoleRepository;
import com.dcmc.apps.taskmanager.service.dto.WorkGroupDTO;
import com.dcmc.apps.taskmanager.service.mapper.WorkGroupMapper;
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

    public WorkGroupService(
        WorkGroupRepository workGroupRepository,
        WorkGroupMapper workGroupMapper,
        GroupSecurityService groupSecurityService,
        WorkGroupUserRoleRepository workGroupUserRoleRepository
    ) {
        this.workGroupRepository = workGroupRepository;
        this.workGroupMapper = workGroupMapper;
        this.groupSecurityService = groupSecurityService;
        this.workGroupUserRoleRepository = workGroupUserRoleRepository;
    }

    /**
     * Save a workGroup.
     *
     * @param workGroupDTO the entity to save.
     * @return the persisted entity.
     */
    public WorkGroupDTO save(WorkGroupDTO workGroupDTO) {
        LOG.debug("Request to save WorkGroup : {}", workGroupDTO);
        WorkGroup workGroup = workGroupMapper.toEntity(workGroupDTO);
        workGroup = workGroupRepository.save(workGroup);
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

    public void transferOwnership(Long groupId, Long newOwnerUserId) {
        if (!groupSecurityService.isOwner(groupId.toString())) {
            throw new AccessDeniedException("Solo el OWNER puede transferir el grupo.");
        }

        // Buscar el nuevo miembro y cambiar su rol
        WorkGroupUserRole newOwner = workGroupUserRoleRepository
            .findByUserIdAndGroupId(String.valueOf(newOwnerUserId), groupId)
            .orElseThrow(() -> new BadRequestAlertException("El nuevo propietario debe ser miembro del grupo", "Group", "usernotingroup"));

        // Quitar el OWNER actual
        WorkGroupUserRole currentOwner = workGroupUserRoleRepository
            .findByGroupIdAndRole(groupId, GroupRole.OWNER)
            .orElseThrow();

        currentOwner.setRole(GroupRole.MIEMBRO);
        newOwner.setRole(GroupRole.OWNER);

        workGroupUserRoleRepository.save(currentOwner);
        workGroupUserRoleRepository.save(newOwner);
    }
}
