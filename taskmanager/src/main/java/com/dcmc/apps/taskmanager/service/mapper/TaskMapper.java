package com.dcmc.apps.taskmanager.service.mapper;

import com.dcmc.apps.taskmanager.domain.Project;
import com.dcmc.apps.taskmanager.domain.Task;
import com.dcmc.apps.taskmanager.domain.WorkGroup;
import com.dcmc.apps.taskmanager.service.dto.TaskDTO;
import org.mapstruct.*;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", uses = UserMapper.class)
public interface TaskMapper extends EntityMapper<TaskDTO, Task> {

    @Mapping(target = "workGroup", source = "workGroupId")
    @Mapping(target = "project", source = "projectId")
    @Mapping(target = "parentTask", source = "parentTaskId")
    @Mapping(target = "assignedTos", ignore = true)
    Task toEntity(TaskDTO taskDTO);

    @Mapping(source = "workGroup.id", target = "workGroupId")
    @Mapping(source = "project.id", target = "projectId")
    @Mapping(source = "parentTask.id", target = "parentTaskId")
    @Mapping(target = "subTaskIds", expression = "java(mapSubTaskIds(task))")
    TaskDTO toDto(Task task);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void partialUpdate(@MappingTarget Task entity, TaskDTO dto);

    // Convierte lista de subtareas en lista de IDs
    default Set<Long> mapSubTaskIds(Task task) {
        if (task.getSubTasks() == null) {
            return new HashSet<>();
        }
        return task.getSubTasks().stream().map(Task::getId).collect(Collectors.toSet());
    }

    // Utilidades para asignar objetos desde IDs
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

    default Task fromIdTask(Long id) {
        if (id == null) return null;
        Task task = new Task();
        task.setId(id);
        return task;
    }


    // Lógica para establecer subtareas después del mapeo
    @AfterMapping
    default void handleSubTaskIds(@MappingTarget Task task, TaskDTO dto) {
        if (dto.getSubTaskIds() != null) {
            Set<Task> subTasks = dto.getSubTaskIds().stream()
                .map(this::fromIdTask)
                .collect(Collectors.toSet());
            subTasks.forEach(st -> st.setParentTask(task));
            task.setSubTasks(subTasks);
        }
    }
}
