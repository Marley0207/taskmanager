package com.dcmc.apps.taskmanager.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.dcmc.apps.taskmanager.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class WorkGroupUserRoleDTOTest {

    @Test
    void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(WorkGroupUserRoleDTO.class);
        WorkGroupUserRoleDTO workGroupUserRoleDTO1 = new WorkGroupUserRoleDTO();
        workGroupUserRoleDTO1.setId(1L);
        WorkGroupUserRoleDTO workGroupUserRoleDTO2 = new WorkGroupUserRoleDTO();
        assertThat(workGroupUserRoleDTO1).isNotEqualTo(workGroupUserRoleDTO2);
        workGroupUserRoleDTO2.setId(workGroupUserRoleDTO1.getId());
        assertThat(workGroupUserRoleDTO1).isEqualTo(workGroupUserRoleDTO2);
        workGroupUserRoleDTO2.setId(2L);
        assertThat(workGroupUserRoleDTO1).isNotEqualTo(workGroupUserRoleDTO2);
        workGroupUserRoleDTO1.setId(null);
        assertThat(workGroupUserRoleDTO1).isNotEqualTo(workGroupUserRoleDTO2);
    }
}
