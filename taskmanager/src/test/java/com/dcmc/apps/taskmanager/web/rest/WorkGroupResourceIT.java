package com.dcmc.apps.taskmanager.web.rest;

import static com.dcmc.apps.taskmanager.domain.WorkGroupAsserts.*;
import static com.dcmc.apps.taskmanager.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.dcmc.apps.taskmanager.IntegrationTest;
import com.dcmc.apps.taskmanager.domain.WorkGroup;
import com.dcmc.apps.taskmanager.repository.UserRepository;
import com.dcmc.apps.taskmanager.repository.WorkGroupRepository;
import com.dcmc.apps.taskmanager.service.WorkGroupService;
import com.dcmc.apps.taskmanager.service.dto.WorkGroupDTO;
import com.dcmc.apps.taskmanager.service.mapper.WorkGroupMapper;
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
 * Integration tests for the {@link WorkGroupResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class WorkGroupResourceIT {

    private static final String DEFAULT_NAME = "AAAAAAAAAA";
    private static final String UPDATED_NAME = "BBBBBBBBBB";

    private static final String DEFAULT_DESCRIPTION = "AAAAAAAAAA";
    private static final String UPDATED_DESCRIPTION = "BBBBBBBBBB";

    private static final String ENTITY_API_URL = "/api/work-groups";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private WorkGroupRepository workGroupRepository;

    @Autowired
    private UserRepository userRepository;

    @Mock
    private WorkGroupRepository workGroupRepositoryMock;

    @Autowired
    private WorkGroupMapper workGroupMapper;

    @Mock
    private WorkGroupService workGroupServiceMock;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restWorkGroupMockMvc;

    private WorkGroup workGroup;

    private WorkGroup insertedWorkGroup;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static WorkGroup createEntity() {
        return new WorkGroup().name(DEFAULT_NAME).description(DEFAULT_DESCRIPTION);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static WorkGroup createUpdatedEntity() {
        return new WorkGroup().name(UPDATED_NAME).description(UPDATED_DESCRIPTION);
    }

    @BeforeEach
    void initTest() {
        workGroup = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedWorkGroup != null) {
            workGroupRepository.delete(insertedWorkGroup);
            insertedWorkGroup = null;
        }
        userRepository.deleteAll();
    }

    @Test
    @Transactional
    void createWorkGroup() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the WorkGroup
        WorkGroupDTO workGroupDTO = workGroupMapper.toDto(workGroup);
        var returnedWorkGroupDTO = om.readValue(
            restWorkGroupMockMvc
                .perform(
                    post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(workGroupDTO))
                )
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            WorkGroupDTO.class
        );

        // Validate the WorkGroup in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedWorkGroup = workGroupMapper.toEntity(returnedWorkGroupDTO);
        assertWorkGroupUpdatableFieldsEquals(returnedWorkGroup, getPersistedWorkGroup(returnedWorkGroup));

        insertedWorkGroup = returnedWorkGroup;
    }

    @Test
    @Transactional
    void createWorkGroupWithExistingId() throws Exception {
        // Create the WorkGroup with an existing ID
        workGroup.setId(1L);
        WorkGroupDTO workGroupDTO = workGroupMapper.toDto(workGroup);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restWorkGroupMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(workGroupDTO)))
            .andExpect(status().isBadRequest());

        // Validate the WorkGroup in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkNameIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        workGroup.setName(null);

        // Create the WorkGroup, which fails.
        WorkGroupDTO workGroupDTO = workGroupMapper.toDto(workGroup);

        restWorkGroupMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(workGroupDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllWorkGroups() throws Exception {
        // Initialize the database
        insertedWorkGroup = workGroupRepository.saveAndFlush(workGroup);

        // Get all the workGroupList
        restWorkGroupMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(workGroup.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME)))
            .andExpect(jsonPath("$.[*].description").value(hasItem(DEFAULT_DESCRIPTION)));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllWorkGroupsWithEagerRelationshipsIsEnabled() throws Exception {
        when(workGroupServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restWorkGroupMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(workGroupServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllWorkGroupsWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(workGroupServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restWorkGroupMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(workGroupRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getWorkGroup() throws Exception {
        // Initialize the database
        insertedWorkGroup = workGroupRepository.saveAndFlush(workGroup);

        // Get the workGroup
        restWorkGroupMockMvc
            .perform(get(ENTITY_API_URL_ID, workGroup.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(workGroup.getId().intValue()))
            .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
            .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION));
    }

    @Test
    @Transactional
    void getNonExistingWorkGroup() throws Exception {
        // Get the workGroup
        restWorkGroupMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingWorkGroup() throws Exception {
        // Initialize the database
        insertedWorkGroup = workGroupRepository.saveAndFlush(workGroup);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the workGroup
        WorkGroup updatedWorkGroup = workGroupRepository.findById(workGroup.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedWorkGroup are not directly saved in db
        em.detach(updatedWorkGroup);
        updatedWorkGroup.name(UPDATED_NAME).description(UPDATED_DESCRIPTION);
        WorkGroupDTO workGroupDTO = workGroupMapper.toDto(updatedWorkGroup);

        restWorkGroupMockMvc
            .perform(
                put(ENTITY_API_URL_ID, workGroupDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(workGroupDTO))
            )
            .andExpect(status().isOk());

        // Validate the WorkGroup in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedWorkGroupToMatchAllProperties(updatedWorkGroup);
    }

    @Test
    @Transactional
    void putNonExistingWorkGroup() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        workGroup.setId(longCount.incrementAndGet());

        // Create the WorkGroup
        WorkGroupDTO workGroupDTO = workGroupMapper.toDto(workGroup);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restWorkGroupMockMvc
            .perform(
                put(ENTITY_API_URL_ID, workGroupDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(workGroupDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the WorkGroup in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchWorkGroup() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        workGroup.setId(longCount.incrementAndGet());

        // Create the WorkGroup
        WorkGroupDTO workGroupDTO = workGroupMapper.toDto(workGroup);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restWorkGroupMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(workGroupDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the WorkGroup in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamWorkGroup() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        workGroup.setId(longCount.incrementAndGet());

        // Create the WorkGroup
        WorkGroupDTO workGroupDTO = workGroupMapper.toDto(workGroup);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restWorkGroupMockMvc
            .perform(put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(workGroupDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the WorkGroup in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateWorkGroupWithPatch() throws Exception {
        // Initialize the database
        insertedWorkGroup = workGroupRepository.saveAndFlush(workGroup);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the workGroup using partial update
        WorkGroup partialUpdatedWorkGroup = new WorkGroup();
        partialUpdatedWorkGroup.setId(workGroup.getId());

        partialUpdatedWorkGroup.name(UPDATED_NAME).description(UPDATED_DESCRIPTION);

        restWorkGroupMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedWorkGroup.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedWorkGroup))
            )
            .andExpect(status().isOk());

        // Validate the WorkGroup in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertWorkGroupUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedWorkGroup, workGroup),
            getPersistedWorkGroup(workGroup)
        );
    }

    @Test
    @Transactional
    void fullUpdateWorkGroupWithPatch() throws Exception {
        // Initialize the database
        insertedWorkGroup = workGroupRepository.saveAndFlush(workGroup);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the workGroup using partial update
        WorkGroup partialUpdatedWorkGroup = new WorkGroup();
        partialUpdatedWorkGroup.setId(workGroup.getId());

        partialUpdatedWorkGroup.name(UPDATED_NAME).description(UPDATED_DESCRIPTION);

        restWorkGroupMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedWorkGroup.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedWorkGroup))
            )
            .andExpect(status().isOk());

        // Validate the WorkGroup in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertWorkGroupUpdatableFieldsEquals(partialUpdatedWorkGroup, getPersistedWorkGroup(partialUpdatedWorkGroup));
    }

    @Test
    @Transactional
    void patchNonExistingWorkGroup() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        workGroup.setId(longCount.incrementAndGet());

        // Create the WorkGroup
        WorkGroupDTO workGroupDTO = workGroupMapper.toDto(workGroup);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restWorkGroupMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, workGroupDTO.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(workGroupDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the WorkGroup in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchWorkGroup() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        workGroup.setId(longCount.incrementAndGet());

        // Create the WorkGroup
        WorkGroupDTO workGroupDTO = workGroupMapper.toDto(workGroup);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restWorkGroupMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(workGroupDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the WorkGroup in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamWorkGroup() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        workGroup.setId(longCount.incrementAndGet());

        // Create the WorkGroup
        WorkGroupDTO workGroupDTO = workGroupMapper.toDto(workGroup);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restWorkGroupMockMvc
            .perform(
                patch(ENTITY_API_URL).with(csrf()).contentType("application/merge-patch+json").content(om.writeValueAsBytes(workGroupDTO))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the WorkGroup in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteWorkGroup() throws Exception {
        // Initialize the database
        insertedWorkGroup = workGroupRepository.saveAndFlush(workGroup);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the workGroup
        restWorkGroupMockMvc
            .perform(delete(ENTITY_API_URL_ID, workGroup.getId()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return workGroupRepository.count();
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

    protected WorkGroup getPersistedWorkGroup(WorkGroup workGroup) {
        return workGroupRepository.findById(workGroup.getId()).orElseThrow();
    }

    protected void assertPersistedWorkGroupToMatchAllProperties(WorkGroup expectedWorkGroup) {
        assertWorkGroupAllPropertiesEquals(expectedWorkGroup, getPersistedWorkGroup(expectedWorkGroup));
    }

    protected void assertPersistedWorkGroupToMatchUpdatableProperties(WorkGroup expectedWorkGroup) {
        assertWorkGroupAllUpdatablePropertiesEquals(expectedWorkGroup, getPersistedWorkGroup(expectedWorkGroup));
    }
}
