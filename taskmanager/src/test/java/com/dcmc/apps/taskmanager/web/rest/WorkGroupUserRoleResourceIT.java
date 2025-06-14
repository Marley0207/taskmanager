package com.dcmc.apps.taskmanager.web.rest;

import static com.dcmc.apps.taskmanager.domain.WorkGroupUserRoleAsserts.*;
import static com.dcmc.apps.taskmanager.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.dcmc.apps.taskmanager.IntegrationTest;
import com.dcmc.apps.taskmanager.domain.WorkGroupUserRole;
import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;
import com.dcmc.apps.taskmanager.repository.UserRepository;
import com.dcmc.apps.taskmanager.repository.WorkGroupUserRoleRepository;
import com.dcmc.apps.taskmanager.service.WorkGroupUserRoleService;
import com.dcmc.apps.taskmanager.service.dto.WorkGroupUserRoleDTO;
import com.dcmc.apps.taskmanager.service.mapper.WorkGroupUserRoleMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import java.util.ArrayList;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link WorkGroupUserRoleResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class WorkGroupUserRoleResourceIT {

    private static final GroupRole DEFAULT_ROLE = GroupRole.OWNER;
    private static final GroupRole UPDATED_ROLE = GroupRole.MODERADOR;

    private static final String ENTITY_API_URL = "/api/work-group-user-roles";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private WorkGroupUserRoleRepository workGroupUserRoleRepository;

    @Autowired
    private UserRepository userRepository;

    @Mock
    private WorkGroupUserRoleRepository workGroupUserRoleRepositoryMock;

    @Autowired
    private WorkGroupUserRoleMapper workGroupUserRoleMapper;

    @Mock
    private WorkGroupUserRoleService workGroupUserRoleServiceMock;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restWorkGroupUserRoleMockMvc;

    private WorkGroupUserRole workGroupUserRole;

    private WorkGroupUserRole insertedWorkGroupUserRole;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static WorkGroupUserRole createEntity() {
        return new WorkGroupUserRole().role(DEFAULT_ROLE);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static WorkGroupUserRole createUpdatedEntity() {
        return new WorkGroupUserRole().role(UPDATED_ROLE);
    }

    @BeforeEach
    void initTest() {
        workGroupUserRole = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedWorkGroupUserRole != null) {
            workGroupUserRoleRepository.delete(insertedWorkGroupUserRole);
            insertedWorkGroupUserRole = null;
        }
        userRepository.deleteAll();
    }

    @Test
    @Transactional
    void createWorkGroupUserRole() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the WorkGroupUserRole
        WorkGroupUserRoleDTO workGroupUserRoleDTO = workGroupUserRoleMapper.toDto(workGroupUserRole);
        var returnedWorkGroupUserRoleDTO = om.readValue(
            restWorkGroupUserRoleMockMvc
                .perform(
                    post(ENTITY_API_URL)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsBytes(workGroupUserRoleDTO))
                )
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            WorkGroupUserRoleDTO.class
        );

        // Validate the WorkGroupUserRole in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedWorkGroupUserRole = workGroupUserRoleMapper.toEntity(returnedWorkGroupUserRoleDTO);
        assertWorkGroupUserRoleUpdatableFieldsEquals(returnedWorkGroupUserRole, getPersistedWorkGroupUserRole(returnedWorkGroupUserRole));

        insertedWorkGroupUserRole = returnedWorkGroupUserRole;
    }

    @Test
    @Transactional
    void createWorkGroupUserRoleWithExistingId() throws Exception {
        // Create the WorkGroupUserRole with an existing ID
        workGroupUserRole.setId(1L);
        WorkGroupUserRoleDTO workGroupUserRoleDTO = workGroupUserRoleMapper.toDto(workGroupUserRole);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restWorkGroupUserRoleMockMvc
            .perform(
                post(ENTITY_API_URL)
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(workGroupUserRoleDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the WorkGroupUserRole in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkRoleIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        workGroupUserRole.setRole(null);

        // Create the WorkGroupUserRole, which fails.
        WorkGroupUserRoleDTO workGroupUserRoleDTO = workGroupUserRoleMapper.toDto(workGroupUserRole);

        restWorkGroupUserRoleMockMvc
            .perform(
                post(ENTITY_API_URL)
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(workGroupUserRoleDTO))
            )
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllWorkGroupUserRoles() throws Exception {
        // Initialize the database
        insertedWorkGroupUserRole = workGroupUserRoleRepository.saveAndFlush(workGroupUserRole);

        // Get all the workGroupUserRoleList
        restWorkGroupUserRoleMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(workGroupUserRole.getId().intValue())))
            .andExpect(jsonPath("$.[*].role").value(hasItem(DEFAULT_ROLE.toString())));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllWorkGroupUserRolesWithEagerRelationshipsIsEnabled() throws Exception {
        when(workGroupUserRoleServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restWorkGroupUserRoleMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(workGroupUserRoleServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllWorkGroupUserRolesWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(workGroupUserRoleServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restWorkGroupUserRoleMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(workGroupUserRoleRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getWorkGroupUserRole() throws Exception {
        // Initialize the database
        insertedWorkGroupUserRole = workGroupUserRoleRepository.saveAndFlush(workGroupUserRole);

        // Get the workGroupUserRole
        restWorkGroupUserRoleMockMvc
            .perform(get(ENTITY_API_URL_ID, workGroupUserRole.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(workGroupUserRole.getId().intValue()))
            .andExpect(jsonPath("$.role").value(DEFAULT_ROLE.toString()));
    }

    @Test
    @Transactional
    void getNonExistingWorkGroupUserRole() throws Exception {
        // Get the workGroupUserRole
        restWorkGroupUserRoleMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingWorkGroupUserRole() throws Exception {
        // Initialize the database
        insertedWorkGroupUserRole = workGroupUserRoleRepository.saveAndFlush(workGroupUserRole);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the workGroupUserRole
        WorkGroupUserRole updatedWorkGroupUserRole = workGroupUserRoleRepository.findById(workGroupUserRole.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedWorkGroupUserRole are not directly saved in db
        em.detach(updatedWorkGroupUserRole);
        updatedWorkGroupUserRole.role(UPDATED_ROLE);
        WorkGroupUserRoleDTO workGroupUserRoleDTO = workGroupUserRoleMapper.toDto(updatedWorkGroupUserRole);

        restWorkGroupUserRoleMockMvc
            .perform(
                put(ENTITY_API_URL_ID, workGroupUserRoleDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(workGroupUserRoleDTO))
            )
            .andExpect(status().isOk());

        // Validate the WorkGroupUserRole in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedWorkGroupUserRoleToMatchAllProperties(updatedWorkGroupUserRole);
    }

    @Test
    @Transactional
    void putNonExistingWorkGroupUserRole() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        workGroupUserRole.setId(longCount.incrementAndGet());

        // Create the WorkGroupUserRole
        WorkGroupUserRoleDTO workGroupUserRoleDTO = workGroupUserRoleMapper.toDto(workGroupUserRole);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restWorkGroupUserRoleMockMvc
            .perform(
                put(ENTITY_API_URL_ID, workGroupUserRoleDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(workGroupUserRoleDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the WorkGroupUserRole in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchWorkGroupUserRole() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        workGroupUserRole.setId(longCount.incrementAndGet());

        // Create the WorkGroupUserRole
        WorkGroupUserRoleDTO workGroupUserRoleDTO = workGroupUserRoleMapper.toDto(workGroupUserRole);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restWorkGroupUserRoleMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(workGroupUserRoleDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the WorkGroupUserRole in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamWorkGroupUserRole() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        workGroupUserRole.setId(longCount.incrementAndGet());

        // Create the WorkGroupUserRole
        WorkGroupUserRoleDTO workGroupUserRoleDTO = workGroupUserRoleMapper.toDto(workGroupUserRole);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restWorkGroupUserRoleMockMvc
            .perform(
                put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(workGroupUserRoleDTO))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the WorkGroupUserRole in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateWorkGroupUserRoleWithPatch() throws Exception {
        // Initialize the database
        insertedWorkGroupUserRole = workGroupUserRoleRepository.saveAndFlush(workGroupUserRole);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the workGroupUserRole using partial update
        WorkGroupUserRole partialUpdatedWorkGroupUserRole = new WorkGroupUserRole();
        partialUpdatedWorkGroupUserRole.setId(workGroupUserRole.getId());

        restWorkGroupUserRoleMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedWorkGroupUserRole.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedWorkGroupUserRole))
            )
            .andExpect(status().isOk());

        // Validate the WorkGroupUserRole in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertWorkGroupUserRoleUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedWorkGroupUserRole, workGroupUserRole),
            getPersistedWorkGroupUserRole(workGroupUserRole)
        );
    }

    @Test
    @Transactional
    void fullUpdateWorkGroupUserRoleWithPatch() throws Exception {
        // Initialize the database
        insertedWorkGroupUserRole = workGroupUserRoleRepository.saveAndFlush(workGroupUserRole);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the workGroupUserRole using partial update
        WorkGroupUserRole partialUpdatedWorkGroupUserRole = new WorkGroupUserRole();
        partialUpdatedWorkGroupUserRole.setId(workGroupUserRole.getId());

        partialUpdatedWorkGroupUserRole.role(UPDATED_ROLE);

        restWorkGroupUserRoleMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedWorkGroupUserRole.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedWorkGroupUserRole))
            )
            .andExpect(status().isOk());

        // Validate the WorkGroupUserRole in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertWorkGroupUserRoleUpdatableFieldsEquals(
            partialUpdatedWorkGroupUserRole,
            getPersistedWorkGroupUserRole(partialUpdatedWorkGroupUserRole)
        );
    }

    @Test
    @Transactional
    void patchNonExistingWorkGroupUserRole() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        workGroupUserRole.setId(longCount.incrementAndGet());

        // Create the WorkGroupUserRole
        WorkGroupUserRoleDTO workGroupUserRoleDTO = workGroupUserRoleMapper.toDto(workGroupUserRole);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restWorkGroupUserRoleMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, workGroupUserRoleDTO.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(workGroupUserRoleDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the WorkGroupUserRole in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchWorkGroupUserRole() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        workGroupUserRole.setId(longCount.incrementAndGet());

        // Create the WorkGroupUserRole
        WorkGroupUserRoleDTO workGroupUserRoleDTO = workGroupUserRoleMapper.toDto(workGroupUserRole);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restWorkGroupUserRoleMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(workGroupUserRoleDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the WorkGroupUserRole in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamWorkGroupUserRole() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        workGroupUserRole.setId(longCount.incrementAndGet());

        // Create the WorkGroupUserRole
        WorkGroupUserRoleDTO workGroupUserRoleDTO = workGroupUserRoleMapper.toDto(workGroupUserRole);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restWorkGroupUserRoleMockMvc
            .perform(
                patch(ENTITY_API_URL)
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(workGroupUserRoleDTO))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the WorkGroupUserRole in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteWorkGroupUserRole() throws Exception {
        // Initialize the database
        insertedWorkGroupUserRole = workGroupUserRoleRepository.saveAndFlush(workGroupUserRole);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the workGroupUserRole
        restWorkGroupUserRoleMockMvc
            .perform(delete(ENTITY_API_URL_ID, workGroupUserRole.getId()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return workGroupUserRoleRepository.count();
    }

    protected void assertIncrementedRepositoryCount(long countBefore) {
        assertThat(countBefore + 1).isEqualTo(getRepositoryCount());
    }

    protected void assertDecrementedRepositoryCount(long countBefore) {
        assertThat(countBefore - 1).isEqualTo(getRepositoryCount());
    }

    protected void assertSameRepositoryCount(long countBefore) {
        assertThat(countBefore).isEqualTo(getRepositoryCount());
    }

    protected WorkGroupUserRole getPersistedWorkGroupUserRole(WorkGroupUserRole workGroupUserRole) {
        return workGroupUserRoleRepository.findById(workGroupUserRole.getId()).orElseThrow();
    }

    protected void assertPersistedWorkGroupUserRoleToMatchAllProperties(WorkGroupUserRole expectedWorkGroupUserRole) {
        assertWorkGroupUserRoleAllPropertiesEquals(expectedWorkGroupUserRole, getPersistedWorkGroupUserRole(expectedWorkGroupUserRole));
    }

    protected void assertPersistedWorkGroupUserRoleToMatchUpdatableProperties(WorkGroupUserRole expectedWorkGroupUserRole) {
        assertWorkGroupUserRoleAllUpdatablePropertiesEquals(
            expectedWorkGroupUserRole,
            getPersistedWorkGroupUserRole(expectedWorkGroupUserRole)
        );
    }
}
