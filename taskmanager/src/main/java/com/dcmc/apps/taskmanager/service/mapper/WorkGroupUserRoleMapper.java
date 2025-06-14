package com.dcmc.apps.taskmanager.service.mapper;

import com.dcmc.apps.taskmanager.domain.User;
import com.dcmc.apps.taskmanager.domain.WorkGroup;
import com.dcmc.apps.taskmanager.domain.WorkGroupUserRole;
import com.dcmc.apps.taskmanager.service.dto.UserDTO;
import com.dcmc.apps.taskmanager.service.dto.WorkGroupDTO;
import com.dcmc.apps.taskmanager.service.dto.WorkGroupUserRoleDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link WorkGroupUserRole} and its DTO {@link WorkGroupUserRoleDTO}.
 */
@Mapper(componentModel = "spring")
public interface WorkGroupUserRoleMapper extends EntityMapper<WorkGroupUserRoleDTO, WorkGroupUserRole> {
    @Mapping(target = "user", source = "user", qualifiedByName = "userLogin")
    @Mapping(target = "group", source = "group", qualifiedByName = "workGroupName")
    WorkGroupUserRoleDTO toDto(WorkGroupUserRole s);

    @Named("userLogin")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "login", source = "login")
    UserDTO toDtoUserLogin(User user);

    @Named("workGroupName")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    WorkGroupDTO toDtoWorkGroupName(WorkGroup workGroup);
}
