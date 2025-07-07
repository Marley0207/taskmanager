package com.dcmc.apps.taskmanager.service.mapper;

import com.dcmc.apps.taskmanager.domain.*;
import com.dcmc.apps.taskmanager.service.dto.TaskDTO;
import org.mapstruct.*;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", uses = { UserMapper.class, ProjectMapper.class, PriorityMapper.class })
public interface TaskMapper extends EntityMapper<TaskDTO, Task> {

    // De DTO a entidad
    @Mapping(target = "workGroup", source = "workGroupId")
    @Mapping(target = "project", source = "project")
    @Mapping(target = "parentTask", source = "parentTaskId")
    @Mapping(target = "assignedTos", ignore = true)
    @Mapping(target = "priority", source = "priority") // ✅ mapear PriorityDTO → Priority
    @Mapping(target = "archived", source = "archived")
    @Mapping(target = "deleted", source = "deleted")
    Task toEntity(TaskDTO taskDTO);

    // De entidad a DTO
    @Mapping(source = "workGroup.id", target = "workGroupId")
    @Mapping(source = "project", target = "project")
    @Mapping(source = "parentTask.id", target = "parentTaskId")
    @Mapping(source = "priority", target = "priority") // ✅ mapear Priority → PriorityDTO
    @Mapping(target = "subTaskIds", expression = "java(mapSubTaskIds(task))")
    @Mapping(source = "archived", target = "archived")
    @Mapping(source = "deleted", target = "deleted")
    TaskDTO toDto(Task task);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void partialUpdate(@MappingTarget Task entity, TaskDTO dto);

    default Set<Long> mapSubTaskIds(Task task) {
        if (task.getSubTasks() == null) {
            return new HashSet<>();
        }
        return task.getSubTasks().stream().map(Task::getId).collect(Collectors.toSet());
    }

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

    default Priority fromIdPriority(Long id) {
        if (id == null) return null;
        Priority priority = new Priority();
        priority.setId(id);
        return priority;
    }

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
