package com.dcmc.apps.taskmanager.service.mapper;

import com.dcmc.apps.taskmanager.domain.User;
import com.dcmc.apps.taskmanager.domain.WorkGroup;
import com.dcmc.apps.taskmanager.service.dto.UserDTO;
import com.dcmc.apps.taskmanager.service.dto.WorkGroupDTO;
import java.util.Set;
import java.util.stream.Collectors;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link WorkGroup} and its DTO {@link WorkGroupDTO}.
 */
@Mapper(componentModel = "spring")
public interface WorkGroupMapper extends EntityMapper<WorkGroupDTO, WorkGroup> {
    @Mapping(target = "users", source = "users", qualifiedByName = "userLoginSet")
    WorkGroupDTO toDto(WorkGroup s);

    @Mapping(target = "removeUsers", ignore = true)
    WorkGroup toEntity(WorkGroupDTO workGroupDTO);

    @Named("userLogin")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "login", source = "login")
    UserDTO toDtoUserLogin(User user);

    @Named("userLoginSet")
    default Set<UserDTO> toDtoUserLoginSet(Set<User> user) {
        return user.stream().map(this::toDtoUserLogin).collect(Collectors.toSet());
    }
}
