package com.dcmc.apps.taskmanager.web.rest;

import static com.dcmc.apps.taskmanager.domain.CommentAsserts.*;
import static com.dcmc.apps.taskmanager.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.dcmc.apps.taskmanager.IntegrationTest;
import com.dcmc.apps.taskmanager.domain.Comment;
import com.dcmc.apps.taskmanager.domain.Task;
import com.dcmc.apps.taskmanager.repository.CommentRepository;
import com.dcmc.apps.taskmanager.repository.UserRepository;
import com.dcmc.apps.taskmanager.service.CommentService;
import com.dcmc.apps.taskmanager.service.dto.CommentDTO;
import com.dcmc.apps.taskmanager.service.mapper.CommentMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
 * Integration tests for the {@link CommentResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class CommentResourceIT {

    private static final String DEFAULT_CONTENT = "AAAAAAAAAA";
    private static final String UPDATED_CONTENT = "BBBBBBBBBB";

    private static final Instant DEFAULT_CREATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_CREATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final String ENTITY_API_URL = "/api/comments";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private UserRepository userRepository;

    @Mock
    private CommentRepository commentRepositoryMock;

    @Autowired
    private CommentMapper commentMapper;

    @Mock
    private CommentService commentServiceMock;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restCommentMockMvc;

    private Comment comment;

    private Comment insertedComment;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Comment createEntity(EntityManager em) {
        Comment comment = new Comment().content(DEFAULT_CONTENT).createdAt(DEFAULT_CREATED_AT);
        // Add required entity
        Task task;
        if (TestUtil.findAll(em, Task.class).isEmpty()) {
            task = TaskResourceIT.createEntity(em);
            em.persist(task);
            em.flush();
        } else {
            task = TestUtil.findAll(em, Task.class).get(0);
        }
        comment.setTask(task);
        return comment;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Comment createUpdatedEntity(EntityManager em) {
        Comment updatedComment = new Comment().content(UPDATED_CONTENT).createdAt(UPDATED_CREATED_AT);
        // Add required entity
        Task task;
        if (TestUtil.findAll(em, Task.class).isEmpty()) {
            task = TaskResourceIT.createUpdatedEntity(em);
            em.persist(task);
            em.flush();
        } else {
            task = TestUtil.findAll(em, Task.class).get(0);
        }
        updatedComment.setTask(task);
        return updatedComment;
    }

    @BeforeEach
    void initTest() {
        comment = createEntity(em);
    }

    @AfterEach
    void cleanup() {
        if (insertedComment != null) {
            commentRepository.delete(insertedComment);
            insertedComment = null;
        }
        userRepository.deleteAll();
    }

    @Test
    @Transactional
    void createComment() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Comment
        CommentDTO commentDTO = commentMapper.toDto(comment);
        var returnedCommentDTO = om.readValue(
            restCommentMockMvc
                .perform(
                    post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(commentDTO))
                )
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            CommentDTO.class
        );

        // Validate the Comment in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedComment = commentMapper.toEntity(returnedCommentDTO);
        assertCommentUpdatableFieldsEquals(returnedComment, getPersistedComment(returnedComment));

        insertedComment = returnedComment;
    }

    @Test
    @Transactional
    void createCommentWithExistingId() throws Exception {
        // Create the Comment with an existing ID
        comment.setId(1L);
        CommentDTO commentDTO = commentMapper.toDto(comment);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restCommentMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(commentDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Comment in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkContentIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        comment.setContent(null);

        // Create the Comment, which fails.
        CommentDTO commentDTO = commentMapper.toDto(comment);

        restCommentMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(commentDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCreatedAtIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        comment.setCreatedAt(null);

        // Create the Comment, which fails.
        CommentDTO commentDTO = commentMapper.toDto(comment);

        restCommentMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(commentDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllComments() throws Exception {
        // Initialize the database
        insertedComment = commentRepository.saveAndFlush(comment);

        // Get all the commentList
        restCommentMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(comment.getId().intValue())))
            .andExpect(jsonPath("$.[*].content").value(hasItem(DEFAULT_CONTENT)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllCommentsWithEagerRelationshipsIsEnabled() throws Exception {
        when(commentServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restCommentMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(commentServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllCommentsWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(commentServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restCommentMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(commentRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getComment() throws Exception {
        // Initialize the database
        insertedComment = commentRepository.saveAndFlush(comment);

        // Get the comment
        restCommentMockMvc
            .perform(get(ENTITY_API_URL_ID, comment.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(comment.getId().intValue()))
            .andExpect(jsonPath("$.content").value(DEFAULT_CONTENT))
            .andExpect(jsonPath("$.createdAt").value(DEFAULT_CREATED_AT.toString()));
    }

    @Test
    @Transactional
    void getNonExistingComment() throws Exception {
        // Get the comment
        restCommentMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingComment() throws Exception {
        // Initialize the database
        insertedComment = commentRepository.saveAndFlush(comment);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the comment
        Comment updatedComment = commentRepository.findById(comment.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedComment are not directly saved in db
        em.detach(updatedComment);
        updatedComment.content(UPDATED_CONTENT).createdAt(UPDATED_CREATED_AT);
        CommentDTO commentDTO = commentMapper.toDto(updatedComment);

        restCommentMockMvc
            .perform(
                put(ENTITY_API_URL_ID, commentDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(commentDTO))
            )
            .andExpect(status().isOk());

        // Validate the Comment in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedCommentToMatchAllProperties(updatedComment);
    }

    @Test
    @Transactional
    void putNonExistingComment() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        comment.setId(longCount.incrementAndGet());

        // Create the Comment
        CommentDTO commentDTO = commentMapper.toDto(comment);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restCommentMockMvc
            .perform(
                put(ENTITY_API_URL_ID, commentDTO.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(commentDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Comment in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchComment() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        comment.setId(longCount.incrementAndGet());

        // Create the Comment
        CommentDTO commentDTO = commentMapper.toDto(comment);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restCommentMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(commentDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Comment in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamComment() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        comment.setId(longCount.incrementAndGet());

        // Create the Comment
        CommentDTO commentDTO = commentMapper.toDto(comment);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restCommentMockMvc
            .perform(put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(commentDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Comment in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateCommentWithPatch() throws Exception {
        // Initialize the database
        insertedComment = commentRepository.saveAndFlush(comment);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the comment using partial update
        Comment partialUpdatedComment = new Comment();
        partialUpdatedComment.setId(comment.getId());

        restCommentMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedComment.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedComment))
            )
            .andExpect(status().isOk());

        // Validate the Comment in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertCommentUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedComment, comment), getPersistedComment(comment));
    }

    @Test
    @Transactional
    void fullUpdateCommentWithPatch() throws Exception {
        // Initialize the database
        insertedComment = commentRepository.saveAndFlush(comment);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the comment using partial update
        Comment partialUpdatedComment = new Comment();
        partialUpdatedComment.setId(comment.getId());

        partialUpdatedComment.content(UPDATED_CONTENT).createdAt(UPDATED_CREATED_AT);

        restCommentMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedComment.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedComment))
            )
            .andExpect(status().isOk());

        // Validate the Comment in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertCommentUpdatableFieldsEquals(partialUpdatedComment, getPersistedComment(partialUpdatedComment));
    }

    @Test
    @Transactional
    void patchNonExistingComment() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        comment.setId(longCount.incrementAndGet());

        // Create the Comment
        CommentDTO commentDTO = commentMapper.toDto(comment);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restCommentMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, commentDTO.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(commentDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Comment in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchComment() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        comment.setId(longCount.incrementAndGet());

        // Create the Comment
        CommentDTO commentDTO = commentMapper.toDto(comment);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restCommentMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(commentDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Comment in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamComment() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        comment.setId(longCount.incrementAndGet());

        // Create the Comment
        CommentDTO commentDTO = commentMapper.toDto(comment);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restCommentMockMvc
            .perform(
                patch(ENTITY_API_URL).with(csrf()).contentType("application/merge-patch+json").content(om.writeValueAsBytes(commentDTO))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the Comment in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteComment() throws Exception {
        // Initialize the database
        insertedComment = commentRepository.saveAndFlush(comment);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the comment
        restCommentMockMvc
            .perform(delete(ENTITY_API_URL_ID, comment.getId()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return commentRepository.count();
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

    protected Comment getPersistedComment(Comment comment) {
        return commentRepository.findById(comment.getId()).orElseThrow();
    }

    protected void assertPersistedCommentToMatchAllProperties(Comment expectedComment) {
        assertCommentAllPropertiesEquals(expectedComment, getPersistedComment(expectedComment));
    }

    protected void assertPersistedCommentToMatchUpdatableProperties(Comment expectedComment) {
        assertCommentAllUpdatablePropertiesEquals(expectedComment, getPersistedComment(expectedComment));
    }
}
