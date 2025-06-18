package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.User;
import com.dcmc.apps.taskmanager.domain.WorkGroup;
import com.dcmc.apps.taskmanager.domain.WorkGroupUserRole;
import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;
import com.dcmc.apps.taskmanager.repository.UserRepository;
import com.dcmc.apps.taskmanager.repository.WorkGroupRepository;
import com.dcmc.apps.taskmanager.repository.WorkGroupUserRoleRepository;
import com.dcmc.apps.taskmanager.security.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class GroupMembershipService {

    private final WorkGroupUserRoleRepository membershipRepository;
    private final UserRepository userRepository;
    private final WorkGroupRepository workGroupRepository;
    private final GroupSecurityService groupSecurityService;

    public GroupMembershipService(
        WorkGroupUserRoleRepository membershipRepository,
        UserRepository userRepository,
        WorkGroupRepository workGroupRepository,
        GroupSecurityService groupSecurityService
    ) {
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
        this.workGroupRepository = workGroupRepository;
        this.groupSecurityService = groupSecurityService;
    }

    public void addUserToGroup(Long groupId, String userLogin, GroupRole role) {
        checkPermissionToAssignRole(groupId, role);

        WorkGroup group = workGroupRepository.findById(groupId).orElseThrow();
        User user = userRepository.findOneByLogin(userLogin).orElseThrow();

        // Si ya existe, actualizar el rol
        Optional<WorkGroupUserRole> existing = membershipRepository.findByUser_LoginAndGroup_Id(userLogin, groupId);
        if (existing.isPresent()) {
            existing.get().setRole(role);
        } else {
            WorkGroupUserRole membership = new WorkGroupUserRole();
            membership.setUser(user);
            membership.setGroup(group);
            membership.setRole(role);
            membershipRepository.save(membership);
        }
    }

    public void removeUserFromGroup(Long groupId, String userLogin) {
        GroupRole targetRole = groupSecurityService.getUserRoleInGroup(groupId);

        // Reglas: solo OWNER puede quitar moderadores u otros
        if (!groupSecurityService.isOwner(groupId)) {
            throw new AccessDeniedException("No tienes permisos para quitar miembros.");
        }

        if (targetRole == GroupRole.MODERADOR && !groupSecurityService.isOwner(groupId)) {
            throw new AccessDeniedException("Solo el OWNER puede quitar moderadores.");
        }

        membershipRepository.deleteByUser_LoginAndGroup_Id(userLogin, groupId);
    }

    private void checkPermissionToAssignRole(Long groupId, GroupRole role) {
        if (role == GroupRole.MODERADOR && !groupSecurityService.isModeratorOrOwner(groupId)) {
            throw new AccessDeniedException("Solo MODERADOR u OWNER puede agregar nuevos moderadores.");
        }

        if (role == GroupRole.MIEMBRO && !groupSecurityService.isModeratorOrOwner(groupId)) {
            throw new AccessDeniedException("Solo MODERADOR u OWNER puede agregar miembros.");
        }
    }
}
