package com.dcmc.apps.taskmanager.service.mapper;

import com.dcmc.apps.taskmanager.domain.Comment;
import com.dcmc.apps.taskmanager.domain.Task;
import com.dcmc.apps.taskmanager.domain.User;
import com.dcmc.apps.taskmanager.service.dto.CommentDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Comment} and its DTO {@link CommentDTO}.
 */
@Mapper(componentModel = "spring")
public interface CommentMapper extends EntityMapper<CommentDTO, Comment> {

    @Mapping(target = "author", source = "author", qualifiedByName = "toUserDtoLogin")
    @Mapping(target = "taskId", source = "task.id") // ⚠️ taskId, no task
    CommentDTO toDto(Comment comment);

    @Mapping(target = "task", source = "taskId", qualifiedByName = "toTaskFromId")
    @Mapping(target = "author", ignore = true) // Se setea en el servicio
    @Mapping(target = "createdAt", ignore = true) // Se setea en el servicio
    Comment toEntity(CommentDTO commentDTO);

    @Named("toUserDtoLogin")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "login", source = "login")
    com.dcmc.apps.taskmanager.service.dto.UserDTO toUserDtoLogin(User user);

    @Named("toTaskFromId")
    default Task toTaskFromId(Long id) {
        if (id == null) {
            return null;
        }
        Task task = new Task();
        task.setId(id);
        return task;
    }
}
