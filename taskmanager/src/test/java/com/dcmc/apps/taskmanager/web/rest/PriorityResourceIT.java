package com.dcmc.apps.taskmanager.web.rest;

import static com.dcmc.apps.taskmanager.domain.PriorityAsserts.*;
import static com.dcmc.apps.taskmanager.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.dcmc.apps.taskmanager.IntegrationTest;
import com.dcmc.apps.taskmanager.domain.Priority;
import com.dcmc.apps.taskmanager.repository.PriorityRepository;
import com.dcmc.apps.taskmanager.service.dto.PriorityDTO;
import com.dcmc.apps.taskmanager.service.mapper.PriorityMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link PriorityResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class PriorityResourceIT {

    private static final String DEFAULT_NAME = "AAAAAAAAAA";
    private static final String UPDATED_NAME = "BBBBBBBBBB";

    private static final String ENTITY_API_URL = "/api/priorities";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private PriorityRepository priorityRepository;

    @Autowired
    private PriorityMapper priorityMapper;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restPriorityMockMvc;

    private Priority priority;

    private Priority insertedPriority;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Priority createEntity() {
        return new Priority().name(DEFAULT_NAME);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Priority createUpdatedEntity() {
        return new Priority().name(UPDATED_NAME);
    }

    @BeforeEach
    void initTest() {
        priority = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedPriority != null) {
            priorityRepository.delete(insertedPriority);
            insertedPriority = null;
        }
    }

    @Test
    @Transactional
    void createPriority() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Priority
        PriorityDTO priorityDTO = priorityMapper.toDto(priority);
        var returnedPriorityDTO = om.readValue(
            restPriorityMockMvc
                .perform(
                    post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(priorityDTO))
                )
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            PriorityDTO.class
        );

        // Validate the Priority in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedPriority = priorityMapper.toEntity(returnedPriorityDTO);
        assertPriorityUpdatableFieldsEquals(returnedPriority, getPersistedPriority(returnedPriority));

        insertedPriority = returnedPriority;
    }

    @Test
    @Transactional
    void createPriorityWithExistingId() throws Exception {
        // Create the Priority with an existing ID
        priority.setId(1L);
        PriorityDTO priorityDTO = priorityMapper.toDto(priority);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restPriorityMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(priorityDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Priority in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkNameIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        priority.setName(null);

        // Create the Priority, which fails.
        PriorityDTO priorityDTO = priorityMapper.toDto(priority);

        restPriorityMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(priorityDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllPriorities() throws Exception {
        // Initialize the database
        insertedPriority = priorityRepository.saveAndFlush(priority);

        // Get all the priorityList
        restPriorityMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(priority.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME)));
    }

    @Test
    @Transactional
    void getPriority() throws Exception {
        // Initialize the database
        insertedPriority = priorityRepository.saveAndFlush(priority);

        // Get the priority
        restPriorityMockMvc
            .perform(get(ENTITY_API_URL_ID, priority.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(priority.getId().intValue()))
            .andExpect(jsonPath("$.name").value(DEFAULT_NAME));
    }

    @Test
    @Transactional
    void getNonExistingPriority() throws Exception {
        // Get the priority
        restPriorityMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingPriority() throws Exception {
        // Initialize the database
        insertedPriority = priorityRepository.saveAndFlush(priority);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the priority
        Priority updatedPriority = priorityRepository.findById(priority.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedPriority are not directly saved in db
        em.detach(updatedPriority);
        updatedPriority.name(UPDATED_NAME);
        PriorityDTO priorityDTO = priorityMapper.toDto(updatedPriority);

        restPriorityMockMvc
            .perform(
                put(ENTITY_API_URL_ID, priorityDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(priorityDTO))
            )
            .andExpect(status().isOk());

        // Validate the Priority in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedPriorityToMatchAllProperties(updatedPriority);
    }

    @Test
    @Transactional
    void putNonExistingPriority() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        priority.setId(longCount.incrementAndGet());

        // Create the Priority
        PriorityDTO priorityDTO = priorityMapper.toDto(priority);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPriorityMockMvc
            .perform(
                put(ENTITY_API_URL_ID, priorityDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(priorityDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Priority in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchPriority() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        priority.setId(longCount.incrementAndGet());

        // Create the Priority
        PriorityDTO priorityDTO = priorityMapper.toDto(priority);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPriorityMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(priorityDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Priority in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamPriority() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        priority.setId(longCount.incrementAndGet());

        // Create the Priority
        PriorityDTO priorityDTO = priorityMapper.toDto(priority);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPriorityMockMvc
            .perform(put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(priorityDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Priority in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdatePriorityWithPatch() throws Exception {
        // Initialize the database
        insertedPriority = priorityRepository.saveAndFlush(priority);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the priority using partial update
        Priority partialUpdatedPriority = new Priority();
        partialUpdatedPriority.setId(priority.getId());

        partialUpdatedPriority.name(UPDATED_NAME);

        restPriorityMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedPriority.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedPriority))
            )
            .andExpect(status().isOk());

        // Validate the Priority in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPriorityUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedPriority, priority), getPersistedPriority(priority));
    }

    @Test
    @Transactional
    void fullUpdatePriorityWithPatch() throws Exception {
        // Initialize the database
        insertedPriority = priorityRepository.saveAndFlush(priority);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the priority using partial update
        Priority partialUpdatedPriority = new Priority();
        partialUpdatedPriority.setId(priority.getId());

        partialUpdatedPriority.name(UPDATED_NAME);

        restPriorityMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedPriority.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedPriority))
            )
            .andExpect(status().isOk());

        // Validate the Priority in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPriorityUpdatableFieldsEquals(partialUpdatedPriority, getPersistedPriority(partialUpdatedPriority));
    }

    @Test
    @Transactional
    void patchNonExistingPriority() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        priority.setId(longCount.incrementAndGet());

        // Create the Priority
        PriorityDTO priorityDTO = priorityMapper.toDto(priority);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPriorityMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, priorityDTO.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(priorityDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Priority in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchPriority() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        priority.setId(longCount.incrementAndGet());

        // Create the Priority
        PriorityDTO priorityDTO = priorityMapper.toDto(priority);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPriorityMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(priorityDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Priority in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamPriority() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        priority.setId(longCount.incrementAndGet());

        // Create the Priority
        PriorityDTO priorityDTO = priorityMapper.toDto(priority);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPriorityMockMvc
            .perform(
                patch(ENTITY_API_URL).with(csrf()).contentType("application/merge-patch+json").content(om.writeValueAsBytes(priorityDTO))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the Priority in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deletePriority() throws Exception {
        // Initialize the database
        insertedPriority = priorityRepository.saveAndFlush(priority);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the priority
        restPriorityMockMvc
            .perform(delete(ENTITY_API_URL_ID, priority.getId()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return priorityRepository.count();
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

    protected Priority getPersistedPriority(Priority priority) {
        return priorityRepository.findById(priority.getId()).orElseThrow();
    }

    protected void assertPersistedPriorityToMatchAllProperties(Priority expectedPriority) {
        assertPriorityAllPropertiesEquals(expectedPriority, getPersistedPriority(expectedPriority));
    }

    protected void assertPersistedPriorityToMatchUpdatableProperties(Priority expectedPriority) {
        assertPriorityAllUpdatablePropertiesEquals(expectedPriority, getPersistedPriority(expectedPriority));
    }
}
