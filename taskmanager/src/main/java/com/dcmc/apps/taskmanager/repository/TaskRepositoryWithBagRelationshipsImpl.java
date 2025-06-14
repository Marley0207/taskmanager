package com.dcmc.apps.taskmanager.repository;

import com.dcmc.apps.taskmanager.domain.Task;
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
public class TaskRepositoryWithBagRelationshipsImpl implements TaskRepositoryWithBagRelationships {

    private static final String ID_PARAMETER = "id";
    private static final String TASKS_PARAMETER = "tasks";

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Optional<Task> fetchBagRelationships(Optional<Task> task) {
        return task.map(this::fetchAssignedTos);
    }

    @Override
    public Page<Task> fetchBagRelationships(Page<Task> tasks) {
        return new PageImpl<>(fetchBagRelationships(tasks.getContent()), tasks.getPageable(), tasks.getTotalElements());
    }

    @Override
    public List<Task> fetchBagRelationships(List<Task> tasks) {
        return Optional.of(tasks).map(this::fetchAssignedTos).orElse(Collections.emptyList());
    }

    Task fetchAssignedTos(Task result) {
        return entityManager
            .createQuery("select task from Task task left join fetch task.assignedTos where task.id = :id", Task.class)
            .setParameter(ID_PARAMETER, result.getId())
            .getSingleResult();
    }

    List<Task> fetchAssignedTos(List<Task> tasks) {
        HashMap<Object, Integer> order = new HashMap<>();
        IntStream.range(0, tasks.size()).forEach(index -> order.put(tasks.get(index).getId(), index));
        List<Task> result = entityManager
            .createQuery("select task from Task task left join fetch task.assignedTos where task in :tasks", Task.class)
            .setParameter(TASKS_PARAMETER, tasks)
            .getResultList();
        Collections.sort(result, (o1, o2) -> Integer.compare(order.get(o1.getId()), order.get(o2.getId())));
        return result;
    }
}
