package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.WorkGroupUserRole;
import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;
import com.dcmc.apps.taskmanager.repository.WorkGroupUserRoleRepository;
import com.dcmc.apps.taskmanager.security.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class GroupSecurityService {

    private final WorkGroupUserRoleRepository workGroupUserRoleRepository;

    public GroupSecurityService(WorkGroupUserRoleRepository workGroupRepository) {
        this.workGroupUserRoleRepository = workGroupRepository;
    }

    public GroupRole getUserRoleInGroup(Long groupId) {
        String login = SecurityUtils.getCurrentUserLogin().orElse(null);
        if (login == null) {
            throw new AccessDeniedException("Usuario no autenticado.");
        }
        return workGroupUserRoleRepository
            .findByUser_LoginAndGroup_Id(login, groupId)
            .map(WorkGroupUserRole::getRole)
            .orElseThrow(() -> new AccessDeniedException("El usuario no tiene rol en este grupo."));
    }

    public boolean isOwner(Long groupId) {
        return getUserRoleInGroup(groupId) == GroupRole.OWNER;
    }

    public boolean isModeratorOrOwner(Long groupId) {
        GroupRole role = getUserRoleInGroup(groupId);
        return role == GroupRole.MODERADOR || role == GroupRole.OWNER;
    }

    public void checkOwner(Long groupId) {
        if (!isOwner(groupId)) {
            throw new AccessDeniedException("Acceso restringido a propietarios del grupo.");
        }
    }

    public void checkModerator(Long groupId) {
        if (!isModeratorOrOwner(groupId)) {
            throw new AccessDeniedException("Acceso restringido a moderadores o propietarios del grupo.");
        }
    }

    public GroupRole getUserRoleOf(String userLogin, Long groupId) {
        return workGroupUserRoleRepository
            .findByUser_LoginAndGroup_Id(userLogin, groupId)
            .map(WorkGroupUserRole::getRole)
            .orElse(null);
    }
}
