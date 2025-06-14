package com.dcmc.apps.taskmanager.service.mapper;

import static com.dcmc.apps.taskmanager.domain.PriorityAsserts.*;
import static com.dcmc.apps.taskmanager.domain.PriorityTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PriorityMapperTest {

    private PriorityMapper priorityMapper;

    @BeforeEach
    void setUp() {
        priorityMapper = new PriorityMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getPrioritySample1();
        var actual = priorityMapper.toEntity(priorityMapper.toDto(expected));
        assertPriorityAllPropertiesEquals(expected, actual);
    }
}
