package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.Project;
import com.dcmc.apps.taskmanager.domain.WorkGroupUserRole;
import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;
import com.dcmc.apps.taskmanager.repository.ProjectRepository;
import com.dcmc.apps.taskmanager.repository.WorkGroupRepository;
import com.dcmc.apps.taskmanager.repository.WorkGroupUserRoleRepository;
import com.dcmc.apps.taskmanager.security.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class GroupSecurityService {

    private final WorkGroupUserRoleRepository workGroupUserRoleRepository;
    private final ProjectRepository projectRepository;
    private final WorkGroupUserRoleRepository userRoleRepository;

    public GroupSecurityService(WorkGroupUserRoleRepository workGroupUserRoleRepository
        , ProjectRepository projectRepository
        , WorkGroupUserRoleRepository userRoleRepository){
        this.workGroupUserRoleRepository = workGroupUserRoleRepository;
        this.projectRepository = projectRepository;
        this.userRoleRepository = userRoleRepository;
    }

    public GroupRole getUserRoleInGroup(Long groupId) {
        String login = SecurityUtils.getCurrentUserLogin().orElse(null);
        if (login == null) {
            throw new AccessDeniedException("Usuario no autenticado.");
        }

        // Verificar si el usuario tiene el rol de admin
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication != null &&
            authentication.getAuthorities().stream()
                .anyMatch(auth -> "ROLE_ADMIN".equals(auth.getAuthority()));

        // Si es admin, devolver un rol especial o simular que tiene permisos
        if (isAdmin) {
            return GroupRole.OWNER; // o cualquier rol que represente máximo acceso
        }

        // Si no es admin, buscar su rol real en el grupo
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

    public boolean isMember(Long groupId) {
        return getUserRoleInGroup(groupId) != null;
    }


    public void checkUserInProject(Long projectId) {
        String currentUserLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new AccessDeniedException("Usuario no autenticado"));

        Project project = projectRepository
            .findById(projectId)
            .orElseThrow(() -> new EntityNotFoundException("Proyecto no encontrado"));

        boolean isMember = project.getMembers().stream()
            .anyMatch(user -> currentUserLogin.equals(user.getLogin()));

        if (!isMember) {
            throw new AccessDeniedException("No tienes permiso para acceder a este proyecto");
        }
    }
    public void checkIsOwnerOrModerator(Long groupId) {
        String currentUsername = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new AccessDeniedException("Usuario no autenticado"));

        WorkGroupUserRole userRole = workGroupUserRoleRepository.findByUser_LoginAndGroup_Id(currentUsername, groupId)
            .orElseThrow(() -> new AccessDeniedException("Usuario no pertenece al grupo"));

        GroupRole role = userRole.getRole();
        if (role == GroupRole.OWNER || role == GroupRole.MODERADOR) {
            // El usuario tiene permisos
        } else {
            throw new AccessDeniedException("No tienes permiso para realizar esta acción");
        }
    }

    public boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        return authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(role -> role.equals("ROLE_ADMIN"));
    }
}
