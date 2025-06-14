package com.dcmc.apps.taskmanager.repository;

import com.dcmc.apps.taskmanager.domain.WorkGroup;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

/**
 * Utility repository to load bag relationships based on https://vladmihalcea.com/hibernate-multiplebagfetchexception/
 */
public class WorkGroupRepositoryWithBagRelationshipsImpl implements WorkGroupRepositoryWithBagRelationships {

    private static final String ID_PARAMETER = "id";
    private static final String WORKGROUPS_PARAMETER = "workGroups";

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Optional<WorkGroup> fetchBagRelationships(Optional<WorkGroup> workGroup) {
        return workGroup.map(this::fetchUsers);
    }

    @Override
    public Page<WorkGroup> fetchBagRelationships(Page<WorkGroup> workGroups) {
        return new PageImpl<>(fetchBagRelationships(workGroups.getContent()), workGroups.getPageable(), workGroups.getTotalElements());
    }

    @Override
    public List<WorkGroup> fetchBagRelationships(List<WorkGroup> workGroups) {
        return Optional.of(workGroups).map(this::fetchUsers).orElse(Collections.emptyList());
    }

    WorkGroup fetchUsers(WorkGroup result) {
        return entityManager
            .createQuery(
                "select workGroup from WorkGroup workGroup left join fetch workGroup.users where workGroup.id = :id",
                WorkGroup.class
            )
            .setParameter(ID_PARAMETER, result.getId())
            .getSingleResult();
    }

    List<WorkGroup> fetchUsers(List<WorkGroup> workGroups) {
        HashMap<Object, Integer> order = new HashMap<>();
        IntStream.range(0, workGroups.size()).forEach(index -> order.put(workGroups.get(index).getId(), index));
        List<WorkGroup> result = entityManager
            .createQuery(
                "select workGroup from WorkGroup workGroup left join fetch workGroup.users where workGroup in :workGroups",
                WorkGroup.class
            )
            .setParameter(WORKGROUPS_PARAMETER, workGroups)
            .getResultList();
        Collections.sort(result, (o1, o2) -> Integer.compare(order.get(o1.getId()), order.get(o2.getId())));
        return result;
    }
}
