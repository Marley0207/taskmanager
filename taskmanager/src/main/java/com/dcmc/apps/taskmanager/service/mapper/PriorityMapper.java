package com.dcmc.apps.taskmanager.service.mapper;

import com.dcmc.apps.taskmanager.domain.Priority;
import com.dcmc.apps.taskmanager.service.dto.PriorityDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Priority} and its DTO {@link PriorityDTO}.
 */
@Mapper(componentModel = "spring")
public interface PriorityMapper extends EntityMapper<PriorityDTO, Priority> {

    @Mapping(target = "hidden", source = "hidden")
    PriorityDTO toDto(Priority priority);

    @Mapping(target = "hidden", source = "hidden")
    Priority toEntity(PriorityDTO priorityDTO);
}
