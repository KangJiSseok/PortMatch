package com.portmatch.domain.chat;

import org.junit.jupiter.api.Test;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;

class ChatOutboxExecutorTest {
    @Test
    void closeRejectsNewTasksAndInterruptsWorkAfterBoundedWait() throws Exception {
        var executor = new ChatOutboxExecutorConfig().chatOutboxExecutor(1, 1, 0);
        var entered = new CountDownLatch(1);
        var interrupted = new CountDownLatch(1);
        executor.execute(() -> {
            entered.countDown();
            try { new CountDownLatch(1).await(); }
            catch (InterruptedException e) { interrupted.countDown(); Thread.currentThread().interrupt(); }
        });
        try {
            assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
            executor.execute(() -> { throw new AssertionError("queued task must be discarded"); });
        } finally { executor.close(); }
        assertThat(interrupted.await(5, TimeUnit.SECONDS)).isTrue();
        assertThatThrownBy(() -> executor.execute(() -> {})).isInstanceOf(RejectedExecutionException.class);
        assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
    }
}
