package com.dcmc.apps.taskmanager.service.mapper;

import com.dcmc.apps.taskmanager.domain.Project;
import com.dcmc.apps.taskmanager.domain.Task;
import com.dcmc.apps.taskmanager.domain.WorkGroup;
import com.dcmc.apps.taskmanager.service.dto.TaskDTO;
import org.mapstruct.*;

@Mapper(componentModel = "spring", uses = UserMapper.class)
public interface TaskMapper extends EntityMapper<TaskDTO, Task> {

    @Mapping(target = "workGroup", source = "workGroupId")
    @Mapping(target = "project", source = "projectId")
    @Mapping(target = "assignedTos", ignore = true) // sigue ignorando si se maneja en el servicio
    Task toEntity(TaskDTO taskDTO);

    @Mapping(source = "workGroup.id", target = "workGroupId")
    @Mapping(source = "project.id", target = "projectId")
    @Mapping(source = "assignedTos", target = "assignedTos")
    TaskDTO toDto(Task task);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void partialUpdate(@MappingTarget Task entity, TaskDTO dto);

    default WorkGroup fromId(Long id) {
        if (id == null) return null;
        WorkGroup group = new WorkGroup();
        group.setId(id);
        return group;
    }

    default Project fromIdProject(Long id) {
        if (id == null) return null;
        Project project = new Project();
        project.setId(id);
        return project;
    }
}
