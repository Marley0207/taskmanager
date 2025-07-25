package com.dcmc.apps.taskmanager.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class WorkGroupTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static WorkGroup getWorkGroupSample1() {
        return new WorkGroup().id(1L).name("name1").description("description1");
    }

    public static WorkGroup getWorkGroupSample2() {
        return new WorkGroup().id(2L).name("name2").description("description2");
    }

    public static WorkGroup getWorkGroupRandomSampleGenerator() {
        return new WorkGroup().id(longCount.incrementAndGet()).name(UUID.randomUUID().toString()).description(UUID.randomUUID().toString());
    }
}
