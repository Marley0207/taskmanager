package com.dcmc.apps.taskmanager.domain;

import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;

public class WorkGroupUserRoleTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static WorkGroupUserRole getWorkGroupUserRoleSample1() {
        return new WorkGroupUserRole().id(1L);
    }

    public static WorkGroupUserRole getWorkGroupUserRoleSample2() {
        return new WorkGroupUserRole().id(2L);
    }

    public static WorkGroupUserRole getWorkGroupUserRoleRandomSampleGenerator() {
        return new WorkGroupUserRole().id(longCount.incrementAndGet());
    }
}
