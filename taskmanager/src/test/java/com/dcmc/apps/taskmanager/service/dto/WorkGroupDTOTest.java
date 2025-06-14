package com.dcmc.apps.taskmanager.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.dcmc.apps.taskmanager.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class WorkGroupDTOTest {

    @Test
    void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(WorkGroupDTO.class);
        WorkGroupDTO workGroupDTO1 = new WorkGroupDTO();
        workGroupDTO1.setId(1L);
        WorkGroupDTO workGroupDTO2 = new WorkGroupDTO();
        assertThat(workGroupDTO1).isNotEqualTo(workGroupDTO2);
        workGroupDTO2.setId(workGroupDTO1.getId());
        assertThat(workGroupDTO1).isEqualTo(workGroupDTO2);
        workGroupDTO2.setId(2L);
        assertThat(workGroupDTO1).isNotEqualTo(workGroupDTO2);
        workGroupDTO1.setId(null);
        assertThat(workGroupDTO1).isNotEqualTo(workGroupDTO2);
    }
}
