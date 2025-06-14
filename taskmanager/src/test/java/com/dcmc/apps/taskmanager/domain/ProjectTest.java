package com.dcmc.apps.taskmanager.domain;

import static com.dcmc.apps.taskmanager.domain.ProjectTestSamples.*;
import static com.dcmc.apps.taskmanager.domain.TaskTestSamples.*;
import static com.dcmc.apps.taskmanager.domain.WorkGroupTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.dcmc.apps.taskmanager.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ProjectTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Project.class);
        Project project1 = getProjectSample1();
        Project project2 = new Project();
        assertThat(project1).isNotEqualTo(project2);

        project2.setId(project1.getId());
        assertThat(project1).isEqualTo(project2);

        project2 = getProjectSample2();
        assertThat(project1).isNotEqualTo(project2);
    }

    @Test
    void subTasksTest() {
        Project project = getProjectRandomSampleGenerator();
        Task taskBack = getTaskRandomSampleGenerator();

        project.addSubTasks(taskBack);
        assertThat(project.getSubTasks()).containsOnly(taskBack);
        assertThat(taskBack.getProject()).isEqualTo(project);

        project.removeSubTasks(taskBack);
        assertThat(project.getSubTasks()).doesNotContain(taskBack);
        assertThat(taskBack.getProject()).isNull();

        project.subTasks(new HashSet<>(Set.of(taskBack)));
        assertThat(project.getSubTasks()).containsOnly(taskBack);
        assertThat(taskBack.getProject()).isEqualTo(project);

        project.setSubTasks(new HashSet<>());
        assertThat(project.getSubTasks()).doesNotContain(taskBack);
        assertThat(taskBack.getProject()).isNull();
    }

    @Test
    void workGroupTest() {
        Project project = getProjectRandomSampleGenerator();
        WorkGroup workGroupBack = getWorkGroupRandomSampleGenerator();

        project.setWorkGroup(workGroupBack);
        assertThat(project.getWorkGroup()).isEqualTo(workGroupBack);

        project.workGroup(null);
        assertThat(project.getWorkGroup()).isNull();
    }
}
