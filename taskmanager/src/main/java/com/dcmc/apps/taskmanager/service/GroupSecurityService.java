package com.dcmc.apps.taskmanager.service;

import com.dcmc.apps.taskmanager.domain.enumeration.GroupRole;
import com.dcmc.apps.taskmanager.repository.UserRepository;
import com.dcmc.apps.taskmanager.repository.WorkGroupUserRoleRepository;
import com.dcmc.apps.taskmanager.security.SecurityUtils;
import org.springframework.stereotype.Service;

@Service
public class GroupSecurityService {

    private final WorkGroupUserRoleRepository workGroupUserRoleRepository;
    private final UserRepository userRepository;

    public GroupSecurityService(WorkGroupUserRoleRepository workGroupRepository, UserRepository userService) {
        this.workGroupUserRoleRepository = workGroupRepository;
        this.userRepository = userService;
    }

    public GroupRole getUserRoleInGroup(String groupId) {
        String login = SecurityUtils.getCurrentUserLogin().orElse(null);
        if (login == null) {
            return null;
        }
        return workGroupUserRoleRepository
            .findByUserIdAndGroupId(login, Long.valueOf(groupId))
            .map(wgur -> wgur.getRole())
            .orElse(null);
    }

    public boolean isOwner(String groupId) {
        return getUserRoleInGroup(groupId) == GroupRole.OWNER;
    }

    public boolean isModerator(String groupId) {
        GroupRole role = getUserRoleInGroup(groupId);
        return role == GroupRole.MODERADOR || role == GroupRole.OWNER;
    }

}
