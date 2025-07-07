package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.User;
import com.dcmc.apps.taskmanager.domain.WorkGroup;
import com.dcmc.apps.taskmanager.domain.WorkGroupUserRole;
import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;
import com.dcmc.apps.taskmanager.repository.UserRepository;
import com.dcmc.apps.taskmanager.repository.WorkGroupRepository;
import com.dcmc.apps.taskmanager.repository.WorkGroupUserRoleRepository;
import com.dcmc.apps.taskmanager.security.SecurityUtils;
import com.dcmc.apps.taskmanager.web.rest.errors.BadRequestAlertException;
import jakarta.persistence.EntityNotFoundException;
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
    /**
     * Agrega un usuario a un grupo con un rol específico.
     * Si el rol es null, se asigna MIEMBRO por defecto.
     *
     * @param groupId ID del grupo al que se quiere agregar el usuario.
     * @param userLogin Login del usuario a agregar.
     * @param role Rol a asignar al usuario en el grupo (puede ser null).
     */
    public void addUserToGroup(Long groupId, String userLogin, GroupRole role) {
        // Validar que el usuario exista
        User user = userRepository.findOneByLogin(userLogin)
            .orElseThrow(() -> new BadRequestAlertException("Usuario no encontrado", "User", "notfound"));

        // Si el rol es null, asignar MIEMBRO por defecto
        GroupRole assignedRole = (role != null) ? role : GroupRole.MIEMBRO;

        boolean isAdmin = groupSecurityService.isAdmin(); // 👈 verificar si es admin

        if (!isAdmin) {
            // Solo validar permisos si NO es admin
            checkPermissionToAssignRole(groupId, assignedRole);
        }

        // Buscar grupo activo (deleted == false)
        WorkGroup group = workGroupRepository.findById(groupId)
            .filter(wg -> !Boolean.TRUE.equals(wg.getDeleted()))
            .orElseThrow(() -> new BadRequestAlertException("Grupo no encontrado o eliminado", "WorkGroup", "notfound"));

        // Validar si ya es miembro
        Optional<WorkGroupUserRole> existing = membershipRepository.findByUser_LoginAndGroup_Id(userLogin, groupId);
        if (existing.isPresent()) {
            throw new BadRequestAlertException("El usuario ya es miembro del grupo", "WorkGroup", "alreadyingroup");
        }

        // Crear nueva membresía
        WorkGroupUserRole membership = new WorkGroupUserRole();
        membership.setUser(user);
        membership.setGroup(group);
        membership.setRole(assignedRole);
        membershipRepository.save(membership);
    }



    public void removeUserFromGroup(Long groupId, String targetUserLogin) {
        String currentUserLogin = SecurityUtils.getCurrentUserLogin().orElseThrow();

        // Verificar grupo activo
        WorkGroup group = workGroupRepository.findById(groupId)
            .filter(wg -> !Boolean.TRUE.equals(wg.getDeleted()))
            .orElseThrow(() -> new BadRequestAlertException("Grupo no encontrado o eliminado", "WorkGroup", "notfound"));

        GroupRole actorRole = groupSecurityService.getUserRoleInGroup(groupId); // rol del que llama
        GroupRole targetRole = groupSecurityService.getUserRoleOf(targetUserLogin, groupId); // rol del que será eliminado

        if (actorRole == null) {
            throw new AccessDeniedException("No perteneces al grupo.");
        }

        if (targetRole == null) {
            throw new BadRequestAlertException("El usuario a eliminar no pertenece al grupo", "WorkGroup", "notingroup");
        }

        if (actorRole == GroupRole.MODERADOR) {
            if (targetRole == GroupRole.MODERADOR || targetRole == GroupRole.OWNER) {
                throw new AccessDeniedException("Un MODERADOR no puede eliminar a otros MODERADORES ni al OWNER.");
            }
        }

        if (targetUserLogin.equals(currentUserLogin) && actorRole == GroupRole.OWNER) {
            throw new BadRequestAlertException("No puedes eliminarte a ti mismo siendo OWNER. Usa la función de transferir propiedad o salir del grupo.", "WorkGroup", "owner-self-delete");
        }

        membershipRepository.deleteByUser_LoginAndGroup_Id(targetUserLogin, groupId);
    }


    // Verifica permiso según rol
    private void checkPermissionToAssignRole(Long groupId, GroupRole role) {
        if (role == GroupRole.MODERADOR && !groupSecurityService.isModeratorOrOwner(groupId)) {
            throw new AccessDeniedException("Solo MODERADOR u OWNER puede agregar nuevos moderadores.");
        }

        if (role == GroupRole.MIEMBRO && !groupSecurityService.isModeratorOrOwner(groupId)) {
            throw new AccessDeniedException("Solo MODERADOR u OWNER puede agregar miembros.");
        }
    }

    /**
     * Permite a un usuario abandonar un grupo.
     * Si el usuario es el OWNER, se lanza una excepción.
     *
     * @param groupId ID del grupo del cual se quiere salir.
     */

    public void leaveGroup(Long groupId) {
        String currentLogin = SecurityUtils.getCurrentUserLogin().orElseThrow();

        // Verificar grupo activo
        WorkGroup group = workGroupRepository.findById(groupId)
            .filter(wg -> !Boolean.TRUE.equals(wg.getDeleted()))
            .orElseThrow(() -> new BadRequestAlertException("Grupo no encontrado o eliminado", "WorkGroup", "notfound"));

        GroupRole currentRole = groupSecurityService.getUserRoleInGroup(groupId);

        if (currentRole == null) {
            throw new BadRequestAlertException("No perteneces a este grupo", "WorkGroup", "notmember");
        }

        if (currentRole == GroupRole.OWNER) {
            throw new AccessDeniedException("El OWNER no puede abandonar el grupo. Debe transferir la propiedad primero.");
        }

        membershipRepository.deleteByUser_LoginAndGroup_Id(currentLogin, groupId);
    }

    public void transferOwnership(Long groupId, String newOwnerLogin) {
        // Verificar grupo activo
        WorkGroup group = workGroupRepository.findById(groupId)
            .filter(wg -> !Boolean.TRUE.equals(wg.getDeleted()))
            .orElseThrow(() -> new BadRequestAlertException("Grupo no encontrado o eliminado", "WorkGroup", "notfound"));

        String currentLogin = SecurityUtils.getCurrentUserLogin().orElseThrow();

        if (!groupSecurityService.isOwner(groupId)) {
            throw new AccessDeniedException("Solo el OWNER puede transferir la propiedad.");
        }

        WorkGroupUserRole newOwnerRole = membershipRepository
            .findByUser_LoginAndGroup_Id(newOwnerLogin, groupId)
            .orElseThrow(() -> new BadRequestAlertException("El usuario no pertenece al grupo", "WorkGroup", "notmember"));

        WorkGroupUserRole currentOwnerRole = membershipRepository
            .findByUser_LoginAndGroup_Id(currentLogin, groupId)
            .orElseThrow(() -> new IllegalStateException("No se encontró al OWNER actual"));

        currentOwnerRole.setRole(GroupRole.MODERADOR);
        newOwnerRole.setRole(GroupRole.OWNER);

        membershipRepository.save(currentOwnerRole);
        membershipRepository.save(newOwnerRole);
    }


    @Transactional
    public void promoteUserToModerator(Long groupId, String userLogin) {
        // Verificar grupo activo
        workGroupRepository.findById(groupId)
            .filter(wg -> !Boolean.TRUE.equals(wg.getDeleted()))
            .orElseThrow(() -> new BadRequestAlertException("Grupo no encontrado o eliminado", "WorkGroup", "notfound"));

        if (!groupSecurityService.isOwner(groupId)) {
            throw new AccessDeniedException("Solo el OWNER puede promover a moderadores.");
        }

        WorkGroupUserRole membership = membershipRepository
            .findByUser_LoginAndGroup_Id(userLogin, groupId)
            .orElseThrow(() -> new EntityNotFoundException("El usuario no pertenece al grupo."));

        if (membership.getRole() != GroupRole.MIEMBRO) {
            throw new BadRequestAlertException("Solo se puede promover a miembros (MIEMBRO) a MODERADOR", "WorkGroup", "invalidrole");
        }

        membership.setRole(GroupRole.MODERADOR);
        membershipRepository.save(membership);
    }

    @Transactional
    public void demoteModeratorToMember(Long groupId, String userLogin) {
        // Verificar grupo activo
        workGroupRepository.findById(groupId)
            .filter(wg -> !Boolean.TRUE.equals(wg.getDeleted()))
            .orElseThrow(() -> new BadRequestAlertException("Grupo no encontrado o eliminado", "WorkGroup", "notfound"));

        WorkGroupUserRole membership = membershipRepository
            .findByUser_LoginAndGroup_Id(userLogin, groupId)
            .orElseThrow(() -> new EntityNotFoundException("El usuario no pertenece al grupo."));

        if (!groupSecurityService.isOwner(groupId)) {
            throw new AccessDeniedException("Solo el OWNER puede degradar moderadores.");
        }

        if (membership.getRole() == GroupRole.OWNER) {
            throw new BadRequestAlertException("No puedes degradar al OWNER del grupo", "WorkGroup", "invalidaction");
        }

        if (membership.getRole() != GroupRole.MODERADOR) {
            throw new BadRequestAlertException("Solo puedes degradar a usuarios que son MODERADOR", "WorkGroup", "notmoderator");
        }

        membership.setRole(GroupRole.MIEMBRO);
        membershipRepository.save(membership);
    }


}
