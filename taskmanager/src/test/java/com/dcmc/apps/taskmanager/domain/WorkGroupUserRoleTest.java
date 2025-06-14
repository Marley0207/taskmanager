package com.dcmc.apps.taskmanager.domain;

import static com.dcmc.apps.taskmanager.domain.WorkGroupTestSamples.*;
import static com.dcmc.apps.taskmanager.domain.WorkGroupUserRoleTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.dcmc.apps.taskmanager.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class WorkGroupUserRoleTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(WorkGroupUserRole.class);
        WorkGroupUserRole workGroupUserRole1 = getWorkGroupUserRoleSample1();
        WorkGroupUserRole workGroupUserRole2 = new WorkGroupUserRole();
        assertThat(workGroupUserRole1).isNotEqualTo(workGroupUserRole2);

        workGroupUserRole2.setId(workGroupUserRole1.getId());
        assertThat(workGroupUserRole1).isEqualTo(workGroupUserRole2);

        workGroupUserRole2 = getWorkGroupUserRoleSample2();
        assertThat(workGroupUserRole1).isNotEqualTo(workGroupUserRole2);
    }

    @Test
    void groupTest() {
        WorkGroupUserRole workGroupUserRole = getWorkGroupUserRoleRandomSampleGenerator();
        WorkGroup workGroupBack = getWorkGroupRandomSampleGenerator();

        workGroupUserRole.setGroup(workGroupBack);
        assertThat(workGroupUserRole.getGroup()).isEqualTo(workGroupBack);

        workGroupUserRole.group(null);
        assertThat(workGroupUserRole.getGroup()).isNull();
    }
}
