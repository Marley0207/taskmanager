package com.dcmc.apps.taskmanager.repository;

import com.dcmc.apps.taskmanager.domain.Task;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Task entity.
 *
 * When extending this class, extend TaskRepositoryWithBagRelationships too.
 * For more information refer to https://github.com/jhipster/generator-jhipster/issues/17990.
 */
@Repository
public interface TaskRepository extends TaskRepositoryWithBagRelationships, JpaRepository<Task, Long> {
    default Optional<Task> findOneWithEagerRelationships(Long id) {
        return this.fetchBagRelationships(this.findById(id));
    }

    default List<Task> findAllWithEagerRelationships() {
        return this.fetchBagRelationships(this.findAll());
    }

    default Page<Task> findAllWithEagerRelationships(Pageable pageable) {
        return this.fetchBagRelationships(this.findAll(pageable));
    }

    @Query("SELECT t FROM Task t JOIN t.workGroup wg JOIN WorkGroupUserRole wgur ON wgur.group = wg " +
        "WHERE t.archived = true AND wgur.user.login = :login")
    List<Task> findArchivedTasksByUserLogin(@Param("login") String login);

    List<Task> findByProjectId(Long projectId);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.project p LEFT JOIN FETCH p.members WHERE t.id = :taskId")
    Optional<Task> findByIdWithProjectAndMembers(@Param("taskId") Long taskId);

    Page<Task> findAllByDeletedFalse(Pageable pageable);

    @EntityGraph(attributePaths = {"assignedTos", "project", "workGroup"})
    Page<Task> findAllWithEagerRelationshipsByDeletedFalse(Pageable pageable);

    // Buscar tareas archivadas (y no eliminadas) de un proyecto
    List<Task> findByProjectIdAndArchivedTrueAndDeletedFalse(Long projectId);

    List<Task> findByProjectIdAndDeletedFalse(Long projectId);

    List<Task> findByParentTask_IdAndDeletedFalse(Long parentTaskId);
}
