package com.dcmc.apps.taskmanager.service.mapper;

import static com.dcmc.apps.taskmanager.domain.WorkGroupAsserts.*;
import static com.dcmc.apps.taskmanager.domain.WorkGroupTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class WorkGroupMapperTest {

    private WorkGroupMapper workGroupMapper;

    @BeforeEach
    void setUp() {
        workGroupMapper = new WorkGroupMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getWorkGroupSample1();
        var actual = workGroupMapper.toEntity(workGroupMapper.toDto(expected));
        assertWorkGroupAllPropertiesEquals(expected, actual);
    }
}
