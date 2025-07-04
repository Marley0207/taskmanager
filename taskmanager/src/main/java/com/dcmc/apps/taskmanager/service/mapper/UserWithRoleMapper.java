package com.dcmc.apps.taskmanager.service.mapper;

import com.dcmc.apps.taskmanager.domain.User;
import com.dcmc.apps.taskmanager.domain.WorkGroupUserRole;
import com.dcmc.apps.taskmanager.service.dto.UserWithRoleDTO;

public class UserWithRoleMapper {

    public static UserWithRoleDTO toDto(User user, WorkGroupUserRole userRole) {
        UserWithRoleDTO dto = new UserWithRoleDTO();
        dto.setId(user.getId());
        dto.setLogin(user.getLogin());
        dto.setRole(userRole != null ? userRole.getRole().name() : null);
        return dto;
    }
}
