package com.dcmc.apps.taskmanager.repository;

import com.dcmc.apps.taskmanager.domain.Project;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Project entity.
 *
 * When extending this class, extend ProjectRepositoryWithBagRelationships too.
 * For more information refer to https://github.com/jhipster/generator-jhipster/issues/17990.
 */
@Repository
public interface ProjectRepository extends ProjectRepositoryWithBagRelationships, JpaRepository<Project, Long> {

    // Métodos con carga controlada de relaciones
    default Optional<Project> findOneWithEagerRelationships(Long id) {
        return this.fetchBagRelationships(this.findById(id));
    }

    default List<Project> findAllWithEagerRelationships() {
        return this.fetchBagRelationships(this.findAll());
    }

    default Page<Project> findAllWithEagerRelationships(Pageable pageable) {
        return this.fetchBagRelationships(this.findAll(pageable));
    }

    // ✅ Este método es seguro con paginación y evita el fetch join conflictivo
    Page<Project> findAllByDeletedFalse(Pageable pageable);

    List<Project> findAllByWorkGroup_IdAndDeletedFalse(Long workGroupId);

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.members WHERE p.id = :projectId")
    Optional<Project> findByIdWithMembers(@Param("projectId") Long projectId);

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.members m LEFT JOIN FETCH p.workGroup wg WHERE p.id = :id")
    Optional<Project> findByIdWithMembersAndWorkGroup(@Param("id") Long id);

}

