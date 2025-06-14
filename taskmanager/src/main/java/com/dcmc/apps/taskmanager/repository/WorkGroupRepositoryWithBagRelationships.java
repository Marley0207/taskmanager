package com.dcmc.apps.taskmanager.repository;

import com.dcmc.apps.taskmanager.domain.WorkGroup;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;

public interface WorkGroupRepositoryWithBagRelationships {
    Optional<WorkGroup> fetchBagRelationships(Optional<WorkGroup> workGroup);

    List<WorkGroup> fetchBagRelationships(List<WorkGroup> workGroups);

    Page<WorkGroup> fetchBagRelationships(Page<WorkGroup> workGroups);
}
