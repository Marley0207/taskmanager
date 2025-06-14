package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.WorkGroupUserRole;
import com.dcmc.apps.taskmanager.repository.WorkGroupUserRoleRepository;
import com.dcmc.apps.taskmanager.service.dto.WorkGroupUserRoleDTO;
import com.dcmc.apps.taskmanager.service.mapper.WorkGroupUserRoleMapper;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.dcmc.apps.taskmanager.domain.WorkGroupUserRole}.
 */
@Service
@Transactional
public class WorkGroupUserRoleService {

    private static final Logger LOG = LoggerFactory.getLogger(WorkGroupUserRoleService.class);

    private final WorkGroupUserRoleRepository workGroupUserRoleRepository;
    private final WorkGroupUserRoleMapper workGroupUserRoleMapper;

    public WorkGroupUserRoleService(
        WorkGroupUserRoleRepository workGroupUserRoleRepository,
        WorkGroupUserRoleMapper workGroupUserRoleMapper
    ) {
        this.workGroupUserRoleRepository = workGroupUserRoleRepository;
        this.workGroupUserRoleMapper = workGroupUserRoleMapper;
    }

    /**
     * Save a workGroupUserRole.
     *
     * @param workGroupUserRoleDTO the entity to save.
     * @return the persisted entity.
     */
    public WorkGroupUserRoleDTO save(WorkGroupUserRoleDTO workGroupUserRoleDTO) {
        LOG.debug("Request to save WorkGroupUserRole : {}", workGroupUserRoleDTO);
        WorkGroupUserRole workGroupUserRole = workGroupUserRoleMapper.toEntity(workGroupUserRoleDTO);
        workGroupUserRole = workGroupUserRoleRepository.save(workGroupUserRole);
        return workGroupUserRoleMapper.toDto(workGroupUserRole);
    }

    /**
     * Update a workGroupUserRole.
     *
     * @param workGroupUserRoleDTO the entity to save.
     * @return the persisted entity.
     */
    public WorkGroupUserRoleDTO update(WorkGroupUserRoleDTO workGroupUserRoleDTO) {
        LOG.debug("Request to update WorkGroupUserRole : {}", workGroupUserRoleDTO);
        WorkGroupUserRole workGroupUserRole = workGroupUserRoleMapper.toEntity(workGroupUserRoleDTO);
        workGroupUserRole = workGroupUserRoleRepository.save(workGroupUserRole);
        return workGroupUserRoleMapper.toDto(workGroupUserRole);
    }

    /**
     * Partially update a workGroupUserRole.
     *
     * @param workGroupUserRoleDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<WorkGroupUserRoleDTO> partialUpdate(WorkGroupUserRoleDTO workGroupUserRoleDTO) {
        LOG.debug("Request to partially update WorkGroupUserRole : {}", workGroupUserRoleDTO);

        return workGroupUserRoleRepository
            .findById(workGroupUserRoleDTO.getId())
            .map(existingWorkGroupUserRole -> {
                workGroupUserRoleMapper.partialUpdate(existingWorkGroupUserRole, workGroupUserRoleDTO);

                return existingWorkGroupUserRole;
            })
            .map(workGroupUserRoleRepository::save)
            .map(workGroupUserRoleMapper::toDto);
    }

    /**
     * Get all the workGroupUserRoles.
     *
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public List<WorkGroupUserRoleDTO> findAll() {
        LOG.debug("Request to get all WorkGroupUserRoles");
        return workGroupUserRoleRepository
            .findAll()
            .stream()
            .map(workGroupUserRoleMapper::toDto)
            .collect(Collectors.toCollection(LinkedList::new));
    }

    /**
     * Get all the workGroupUserRoles with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<WorkGroupUserRoleDTO> findAllWithEagerRelationships(Pageable pageable) {
        return workGroupUserRoleRepository.findAllWithEagerRelationships(pageable).map(workGroupUserRoleMapper::toDto);
    }

    /**
     * Get one workGroupUserRole by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<WorkGroupUserRoleDTO> findOne(Long id) {
        LOG.debug("Request to get WorkGroupUserRole : {}", id);
        return workGroupUserRoleRepository.findOneWithEagerRelationships(id).map(workGroupUserRoleMapper::toDto);
    }

    /**
     * Delete the workGroupUserRole by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete WorkGroupUserRole : {}", id);
        workGroupUserRoleRepository.deleteById(id);
    }
}
