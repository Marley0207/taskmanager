package com.dcmc.apps.taskmanager;

import com.dcmc.apps.taskmanager.config.AsyncSyncConfiguration;
import com.dcmc.apps.taskmanager.config.EmbeddedRedis;
import com.dcmc.apps.taskmanager.config.EmbeddedSQL;
import com.dcmc.apps.taskmanager.config.JacksonConfiguration;
import com.dcmc.apps.taskmanager.config.TestSecurityConfiguration;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Base composite annotation for integration tests.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(
    classes = { TaskmanagerApp.class, JacksonConfiguration.class, AsyncSyncConfiguration.class, TestSecurityConfiguration.class }
)
@EmbeddedRedis
@EmbeddedSQL
public @interface IntegrationTest {
}
