package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.Status;
import com.dcmc.apps.taskmanager.repository.StatusRepository;
import com.dcmc.apps.taskmanager.service.dto.StatusDTO;
import com.dcmc.apps.taskmanager.service.mapper.StatusMapper;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.dcmc.apps.taskmanager.domain.Status}.
 */
@Service
@Transactional
public class StatusService {

    private static final Logger LOG = LoggerFactory.getLogger(StatusService.class);

    private final StatusRepository statusRepository;
    private final GroupSecurityService groupSecurityService;
    private final StatusMapper statusMapper;

    public StatusService(StatusRepository statusRepository
        , StatusMapper statusMapper
        , GroupSecurityService groupSecurityService) {
        this.statusRepository = statusRepository;
        this.statusMapper = statusMapper;
        this.groupSecurityService = groupSecurityService;
    }

    /**
     * Save a status.
     *
     * @param statusDTO the entity to save.
     * @return the persisted entity.
     */
    public StatusDTO save(StatusDTO statusDTO, Long groupId) {
        groupSecurityService.isModeratorOrOwner(groupId);
        LOG.debug("Request to save Status : {}", statusDTO);
        Status status = statusMapper.toEntity(statusDTO);
        status = statusRepository.save(status);
        return statusMapper.toDto(status);
    }

    /**
     * Update a status.
     *
     * @param statusDTO the entity to save.
     * @return the persisted entity.
     */
    public StatusDTO update(StatusDTO statusDTO, Long groupId) {
        groupSecurityService.isModeratorOrOwner(groupId);
        LOG.debug("Request to update Status : {}", statusDTO);
        Status status = statusMapper.toEntity(statusDTO);
        status = statusRepository.save(status);
        return statusMapper.toDto(status);
    }

    /**
     * Partially update a status.
     *
     * @param statusDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<StatusDTO> partialUpdate(StatusDTO statusDTO, Long groupId) {
        groupSecurityService.isModeratorOrOwner(groupId);
        LOG.debug("Request to partially update Status : {}", statusDTO);

        return statusRepository
            .findById(statusDTO.getId())
            .map(existingStatus -> {
                statusMapper.partialUpdate(existingStatus, statusDTO);

                return existingStatus;
            })
            .map(statusRepository::save)
            .map(statusMapper::toDto);
    }

    /**
     * Get all the statuses.
     *
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public List<StatusDTO> findAll() {
        LOG.debug("Request to get all Statuses");
        return statusRepository.findAll().stream().map(statusMapper::toDto).collect(Collectors.toCollection(LinkedList::new));
    }

    /**
     * Get one status by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<StatusDTO> findOne(Long id) {
        LOG.debug("Request to get Status : {}", id);
        return statusRepository.findById(id).map(statusMapper::toDto);
    }

    /**
     * Delete the status by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id, Long groupId) {
        groupSecurityService.isModeratorOrOwner(groupId);
        LOG.debug("Request to delete Status : {}", id);
        statusRepository.deleteById(id);
    }
}
