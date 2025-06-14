package com.dcmc.apps.taskmanager.service.mapper;

import static com.dcmc.apps.taskmanager.domain.WorkGroupUserRoleAsserts.*;
import static com.dcmc.apps.taskmanager.domain.WorkGroupUserRoleTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class WorkGroupUserRoleMapperTest {

    private WorkGroupUserRoleMapper workGroupUserRoleMapper;

    @BeforeEach
    void setUp() {
        workGroupUserRoleMapper = new WorkGroupUserRoleMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getWorkGroupUserRoleSample1();
        var actual = workGroupUserRoleMapper.toEntity(workGroupUserRoleMapper.toDto(expected));
        assertWorkGroupUserRoleAllPropertiesEquals(expected, actual);
    }
}
