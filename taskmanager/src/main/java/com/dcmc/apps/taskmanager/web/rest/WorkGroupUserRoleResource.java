package com.dcmc.apps.taskmanager.web.rest;

import com.dcmc.apps.taskmanager.repository.WorkGroupUserRoleRepository;
import com.dcmc.apps.taskmanager.service.WorkGroupUserRoleService;
import com.dcmc.apps.taskmanager.service.dto.WorkGroupUserRoleDTO;
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
 * REST controller for managing {@link com.dcmc.apps.taskmanager.domain.WorkGroupUserRole}.
 */
@RestController
@RequestMapping("/api/work-group-user-roles")
public class WorkGroupUserRoleResource {

    private static final Logger LOG = LoggerFactory.getLogger(WorkGroupUserRoleResource.class);

    private static final String ENTITY_NAME = "taskmanagerWorkGroupUserRole";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final WorkGroupUserRoleService workGroupUserRoleService;

    private final WorkGroupUserRoleRepository workGroupUserRoleRepository;

    public WorkGroupUserRoleResource(
        WorkGroupUserRoleService workGroupUserRoleService,
        WorkGroupUserRoleRepository workGroupUserRoleRepository
    ) {
        this.workGroupUserRoleService = workGroupUserRoleService;
        this.workGroupUserRoleRepository = workGroupUserRoleRepository;
    }

    /**
     * {@code POST  /work-group-user-roles} : Create a new workGroupUserRole.
     *
     * @param workGroupUserRoleDTO the workGroupUserRoleDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new workGroupUserRoleDTO, or with status {@code 400 (Bad Request)} if the workGroupUserRole has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<WorkGroupUserRoleDTO> createWorkGroupUserRole(@Valid @RequestBody WorkGroupUserRoleDTO workGroupUserRoleDTO)
        throws URISyntaxException {
        LOG.debug("REST request to save WorkGroupUserRole : {}", workGroupUserRoleDTO);
        if (workGroupUserRoleDTO.getId() != null) {
            throw new BadRequestAlertException("A new workGroupUserRole cannot already have an ID", ENTITY_NAME, "idexists");
        }
        workGroupUserRoleDTO = workGroupUserRoleService.save(workGroupUserRoleDTO);
        return ResponseEntity.created(new URI("/api/work-group-user-roles/" + workGroupUserRoleDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, false, ENTITY_NAME, workGroupUserRoleDTO.getId().toString()))
            .body(workGroupUserRoleDTO);
    }

    /**
     * {@code PUT  /work-group-user-roles/:id} : Updates an existing workGroupUserRole.
     *
     * @param id the id of the workGroupUserRoleDTO to save.
     * @param workGroupUserRoleDTO the workGroupUserRoleDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated workGroupUserRoleDTO,
     * or with status {@code 400 (Bad Request)} if the workGroupUserRoleDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the workGroupUserRoleDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<WorkGroupUserRoleDTO> updateWorkGroupUserRole(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody WorkGroupUserRoleDTO workGroupUserRoleDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update WorkGroupUserRole : {}, {}", id, workGroupUserRoleDTO);
        if (workGroupUserRoleDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, workGroupUserRoleDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!workGroupUserRoleRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        workGroupUserRoleDTO = workGroupUserRoleService.update(workGroupUserRoleDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, workGroupUserRoleDTO.getId().toString()))
            .body(workGroupUserRoleDTO);
    }

    /**
     * {@code PATCH  /work-group-user-roles/:id} : Partial updates given fields of an existing workGroupUserRole, field will ignore if it is null
     *
     * @param id the id of the workGroupUserRoleDTO to save.
     * @param workGroupUserRoleDTO the workGroupUserRoleDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated workGroupUserRoleDTO,
     * or with status {@code 400 (Bad Request)} if the workGroupUserRoleDTO is not valid,
     * or with status {@code 404 (Not Found)} if the workGroupUserRoleDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the workGroupUserRoleDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<WorkGroupUserRoleDTO> partialUpdateWorkGroupUserRole(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody WorkGroupUserRoleDTO workGroupUserRoleDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update WorkGroupUserRole partially : {}, {}", id, workGroupUserRoleDTO);
        if (workGroupUserRoleDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, workGroupUserRoleDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!workGroupUserRoleRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<WorkGroupUserRoleDTO> result = workGroupUserRoleService.partialUpdate(workGroupUserRoleDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, workGroupUserRoleDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /work-group-user-roles} : get all the workGroupUserRoles.
     *
     * @param eagerload flag to eager load entities from relationships (This is applicable for many-to-many).
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of workGroupUserRoles in body.
     */
    @GetMapping("")
    public List<WorkGroupUserRoleDTO> getAllWorkGroupUserRoles(
        @RequestParam(name = "eagerload", required = false, defaultValue = "true") boolean eagerload
    ) {
        LOG.debug("REST request to get all WorkGroupUserRoles");
        return workGroupUserRoleService.findAll();
    }

    /**
     * {@code GET  /work-group-user-roles/:id} : get the "id" workGroupUserRole.
     *
     * @param id the id of the workGroupUserRoleDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the workGroupUserRoleDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<WorkGroupUserRoleDTO> getWorkGroupUserRole(@PathVariable("id") Long id) {
        LOG.debug("REST request to get WorkGroupUserRole : {}", id);
        Optional<WorkGroupUserRoleDTO> workGroupUserRoleDTO = workGroupUserRoleService.findOne(id);
        return ResponseUtil.wrapOrNotFound(workGroupUserRoleDTO);
    }

    /**
     * {@code DELETE  /work-group-user-roles/:id} : delete the "id" workGroupUserRole.
     *
     * @param id the id of the workGroupUserRoleDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkGroupUserRole(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete WorkGroupUserRole : {}", id);
        workGroupUserRoleService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, false, ENTITY_NAME, id.toString()))
            .build();
    }
}
