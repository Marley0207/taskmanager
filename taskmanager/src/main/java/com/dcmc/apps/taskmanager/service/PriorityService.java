package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.Priority;
import com.dcmc.apps.taskmanager.repository.PriorityRepository;
import com.dcmc.apps.taskmanager.service.dto.PriorityDTO;
import com.dcmc.apps.taskmanager.service.mapper.PriorityMapper;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.dcmc.apps.taskmanager.domain.Priority}.
 */
@Service
@Transactional
public class PriorityService {

    private static final Logger LOG = LoggerFactory.getLogger(PriorityService.class);

    private final PriorityRepository priorityRepository;

    private final PriorityMapper priorityMapper;

    public PriorityService(PriorityRepository priorityRepository, PriorityMapper priorityMapper) {
        this.priorityRepository = priorityRepository;
        this.priorityMapper = priorityMapper;
    }

    /**
     * Save a priority.
     *
     * @param priorityDTO the entity to save.
     * @return the persisted entity.
     */
    public PriorityDTO save(PriorityDTO priorityDTO) {
        LOG.debug("Request to save Priority : {}", priorityDTO);
        Priority priority = priorityMapper.toEntity(priorityDTO);

        // Siempre establecer hidden = false al crear
        priority.setHidden(false);

        priority = priorityRepository.save(priority);
        return priorityMapper.toDto(priority);
    }

    public PriorityDTO update(PriorityDTO priorityDTO) {
        LOG.debug("Request to update Priority : {}", priorityDTO);
        Priority priority = priorityMapper.toEntity(priorityDTO);
        priority = priorityRepository.save(priority);
        return priorityMapper.toDto(priority);
    }

    public Optional<PriorityDTO> partialUpdate(PriorityDTO priorityDTO) {
        LOG.debug("Request to partially update Priority : {}", priorityDTO);

        return priorityRepository
            .findById(priorityDTO.getId())
            .map(existingPriority -> {
                priorityMapper.partialUpdate(existingPriority, priorityDTO);
                return existingPriority;
            })
            .map(priorityRepository::save)
            .map(priorityMapper::toDto);
    }

    /**
     * Get all the priorities that are NOT hidden.
     */
    public List<PriorityDTO> findAll() {
        LOG.debug("Request to get all Priorities (including hidden)");
        return priorityRepository.findAll()
            .stream()
            .map(priorityMapper::toDto)
            .collect(Collectors.toCollection(LinkedList::new));
    }

    @Transactional(readOnly = true)
    public Optional<PriorityDTO> findOne(Long id) {
        LOG.debug("Request to get Priority : {}", id);
        return priorityRepository.findById(id).map(priorityMapper::toDto);
    }

    public void delete(Long id) {
        LOG.debug("Request to delete Priority : {}", id);
        priorityRepository.deleteById(id);
    }

    /**
     * Hide a priority (set hidden=true).
     */
    public Optional<PriorityDTO> hide(Long id) {
        LOG.debug("Request to hide Priority : {}", id);
        return priorityRepository.findById(id).map(priority -> {
            priority.setHidden(true);
            return priorityMapper.toDto(priorityRepository.save(priority));
        });
    }

    /**
     * Unhide a priority (set hidden=false).
     */
    /**
     * Unhide a priority (set hidden=false).
     */
    public Optional<PriorityDTO> unhide(Long id) {
        LOG.debug("Request to unhide Priority : {}", id);
        return priorityRepository.findById(id).map(priority -> {
            priority.setHidden(false);
            return priorityMapper.toDto(priorityRepository.save(priority));
        });
    }

}
