package com.dcmc.apps.taskmanager.domain;

import static com.dcmc.apps.taskmanager.domain.ProjectTestSamples.*;
import static com.dcmc.apps.taskmanager.domain.TaskTestSamples.*;
import static com.dcmc.apps.taskmanager.domain.WorkGroupTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.dcmc.apps.taskmanager.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class WorkGroupTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(WorkGroup.class);
        WorkGroup workGroup1 = getWorkGroupSample1();
        WorkGroup workGroup2 = new WorkGroup();
        assertThat(workGroup1).isNotEqualTo(workGroup2);

        workGroup2.setId(workGroup1.getId());
        assertThat(workGroup1).isEqualTo(workGroup2);

        workGroup2 = getWorkGroupSample2();
        assertThat(workGroup1).isNotEqualTo(workGroup2);
    }

    @Test
    void projectsTest() {
        WorkGroup workGroup = getWorkGroupRandomSampleGenerator();
        Project projectBack = getProjectRandomSampleGenerator();

        workGroup.addProjects(projectBack);
        assertThat(workGroup.getProjects()).containsOnly(projectBack);
        assertThat(projectBack.getWorkGroup()).isEqualTo(workGroup);

        workGroup.removeProjects(projectBack);
        assertThat(workGroup.getProjects()).doesNotContain(projectBack);
        assertThat(projectBack.getWorkGroup()).isNull();

        workGroup.projects(new HashSet<>(Set.of(projectBack)));
        assertThat(workGroup.getProjects()).containsOnly(projectBack);
        assertThat(projectBack.getWorkGroup()).isEqualTo(workGroup);

        workGroup.setProjects(new HashSet<>());
        assertThat(workGroup.getProjects()).doesNotContain(projectBack);
        assertThat(projectBack.getWorkGroup()).isNull();
    }

    @Test
    void tasksTest() {
        WorkGroup workGroup = getWorkGroupRandomSampleGenerator();
        Task taskBack = getTaskRandomSampleGenerator();

        workGroup.addTasks(taskBack);
        assertThat(workGroup.getTasks()).containsOnly(taskBack);
        assertThat(taskBack.getWorkGroup()).isEqualTo(workGroup);

        workGroup.removeTasks(taskBack);
        assertThat(workGroup.getTasks()).doesNotContain(taskBack);
        assertThat(taskBack.getWorkGroup()).isNull();

        workGroup.tasks(new HashSet<>(Set.of(taskBack)));
        assertThat(workGroup.getTasks()).containsOnly(taskBack);
        assertThat(taskBack.getWorkGroup()).isEqualTo(workGroup);

        workGroup.setTasks(new HashSet<>());
        assertThat(workGroup.getTasks()).doesNotContain(taskBack);
        assertThat(taskBack.getWorkGroup()).isNull();
    }
}
