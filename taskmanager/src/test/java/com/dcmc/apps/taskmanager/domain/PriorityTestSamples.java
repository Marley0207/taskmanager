package com.dcmc.apps.taskmanager.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class PriorityTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static Priority getPrioritySample1() {
        return new Priority().id(1L).name("name1");
    }

    public static Priority getPrioritySample2() {
        return new Priority().id(2L).name("name2");
    }

    public static Priority getPriorityRandomSampleGenerator() {
        return new Priority().id(longCount.incrementAndGet()).name(UUID.randomUUID().toString());
    }
}
