package com.dcmc.apps.taskmanager.repository;

import com.dcmc.apps.taskmanager.domain.WorkGroup;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the WorkGroup entity.
 *
 * When extending this class, extend WorkGroupRepositoryWithBagRelationships too.
 * For more information refer to https://github.com/jhipster/generator-jhipster/issues/17990.
 */
@Repository
public interface WorkGroupRepository extends WorkGroupRepositoryWithBagRelationships, JpaRepository<WorkGroup, Long> {
    default Optional<WorkGroup> findOneWithEagerRelationships(Long id) {
        return this.fetchBagRelationships(this.findById(id));
    }

    default List<WorkGroup> findAllWithEagerRelationships() {
        return this.fetchBagRelationships(this.findAll());
    }

    @Query("select wg from WorkGroup wg where wg.deleted = false")
    Page<WorkGroup> findAllByDeletedFalse(Pageable pageable);

}
