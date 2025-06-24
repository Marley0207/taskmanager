package com.dcmc.apps.taskmanager.repository;

import com.dcmc.apps.taskmanager.domain.WorkGroupUserRole;
import java.util.List;
import java.util.Optional;

import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the WorkGroupUserRole entity.
 */
@Repository
public interface WorkGroupUserRoleRepository extends JpaRepository<WorkGroupUserRole, Long> {

    @Query("select workGroupUserRole from WorkGroupUserRole workGroupUserRole where workGroupUserRole.user.login = ?#{authentication.name}")
    List<WorkGroupUserRole> findByUserIsCurrentUser();

    default Optional<WorkGroupUserRole> findOneWithEagerRelationships(Long id) {
        return this.findOneWithToOneRelationships(id);
    }

    default List<WorkGroupUserRole> findAllWithEagerRelationships() {
        return this.findAllWithToOneRelationships();
    }

    default Page<WorkGroupUserRole> findAllWithEagerRelationships(Pageable pageable) {
        return this.findAllWithToOneRelationships(pageable);
    }

    @Query(
        value = "select workGroupUserRole from WorkGroupUserRole workGroupUserRole left join fetch workGroupUserRole.user left join fetch workGroupUserRole.group",
        countQuery = "select count(workGroupUserRole) from WorkGroupUserRole workGroupUserRole"
    )
    Page<WorkGroupUserRole> findAllWithToOneRelationships(Pageable pageable);

    @Query(
        "select workGroupUserRole from WorkGroupUserRole workGroupUserRole left join fetch workGroupUserRole.user left join fetch workGroupUserRole.group"
    )
    List<WorkGroupUserRole> findAllWithToOneRelationships();

    @Query(
        "select workGroupUserRole from WorkGroupUserRole workGroupUserRole left join fetch workGroupUserRole.user left join fetch workGroupUserRole.group where workGroupUserRole.id =:id"
    )
    Optional<WorkGroupUserRole> findOneWithToOneRelationships(@Param("id") Long id);

    @Query("select w from WorkGroupUserRole w where w.user.id = :userId and w.group.id = :groupId")
    Optional<WorkGroupUserRole> findByUserIdAndGroupId(@Param("userId") String userId, @Param("groupId") Long groupId);

    @Query("select w from WorkGroupUserRole w where w.group.id = :groupId and w.role = :role")
    Optional<WorkGroupUserRole> findByGroupIdAndRole(@Param("groupId") Long groupId, @Param("role") GroupRole role);

    Optional<WorkGroupUserRole> findByUser_LoginAndGroup_Id(String userLogin, Long groupId);

    void deleteByUser_LoginAndGroup_Id(String userLogin, Long groupId);

    boolean existsByUser_LoginAndGroup_Id(String userLogin, Long groupId);

    List<WorkGroupUserRole> findAllByGroup_Id(Long groupId);

}
