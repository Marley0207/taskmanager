package com.dcmc.apps.taskmanager.web.rest;

import com.dcmc.apps.taskmanager.repository.StatusRepository;
import com.dcmc.apps.taskmanager.service.StatusService;
import com.dcmc.apps.taskmanager.service.dto.StatusDTO;
import com.dcmc.apps.taskmanager.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.dcmc.apps.taskmanager.domain.Status}.
 */
@RestController
@RequestMapping("/api/statuses")
public class StatusResource {

    private static final Logger LOG = LoggerFactory.getLogger(StatusResource.class);
    private static final String ENTITY_NAME = "taskmanagerStatus";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final StatusService statusService;
    private final StatusRepository statusRepository;

    public StatusResource(StatusService statusService, StatusRepository statusRepository) {
        this.statusService = statusService;
        this.statusRepository = statusRepository;
    }

    @PostMapping("")
    public ResponseEntity<StatusDTO> createStatus(
        @Valid @RequestBody StatusDTO statusDTO,
        @RequestParam Long taskId
    ) throws URISyntaxException {
        LOG.debug("REST request to save Status : {}", statusDTO);
        if (statusDTO.getId() != null) {
            throw new BadRequestAlertException("A new status cannot already have an ID", ENTITY_NAME, "idexists");
        }
        statusDTO = statusService.save(statusDTO, taskId);
        return ResponseEntity.created(new URI("/api/statuses/" + statusDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, false, ENTITY_NAME, statusDTO.getId().toString()))
            .body(statusDTO);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StatusDTO> updateStatus(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody StatusDTO statusDTO,
        @RequestParam Long taskId
    ) throws URISyntaxException {
        LOG.debug("REST request to update Status : {}, {}", id, statusDTO);
        if (statusDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, statusDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }
        if (!statusRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }
        statusDTO = statusService.update(statusDTO, taskId);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, statusDTO.getId().toString()))
            .body(statusDTO);
    }

    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<StatusDTO> partialUpdateStatus(
        @PathVariable(value = "id", required = false) final Long id,
        @RequestBody StatusDTO statusDTO,
        @RequestParam Long taskId
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Status : {}, {}", id, statusDTO);
        if (statusDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, statusDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }
        if (!statusRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }
        Optional<StatusDTO> result = statusService.partialUpdate(statusDTO, taskId);
        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, statusDTO.getId().toString())
        );
    }

    @GetMapping("")
    public List<StatusDTO> getAllStatuses() {
        LOG.debug("REST request to get all Statuses");
        return statusService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<StatusDTO> getStatus(@PathVariable("id") Long id) {
        LOG.debug("REST request to get Status : {}", id);
        Optional<StatusDTO> statusDTO = statusService.findOne(id);
        return ResponseUtil.wrapOrNotFound(statusDTO);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStatus(
        @PathVariable("id") Long id,
        @RequestParam Long taskId
    ) {
        statusService.delete(id, taskId);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, false, ENTITY_NAME, id.toString()))
            .build();
    }
}

