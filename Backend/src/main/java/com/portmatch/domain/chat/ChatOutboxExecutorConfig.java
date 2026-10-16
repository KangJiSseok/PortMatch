package com.portmatch.domain.chat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.CustomizableThreadFactory;

import java.util.concurrent.*;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "chat.publish-mode", havingValue = "outbox")
class ChatOutboxExecutorConfig {
    @Bean(destroyMethod = "close")
    ThreadPoolExecutor chatOutboxExecutor(
            @Value("${chat.outbox.executor.threads:2}") int threads,
            @Value("${chat.outbox.executor.queue-capacity:100}") int queueCapacity,
            @Value("${chat.outbox.executor.shutdown-wait-seconds:10}") int shutdownWaitSeconds) {
        if (threads < 1 || queueCapacity < 0 || shutdownWaitSeconds < 0)
            throw new IllegalArgumentException("Invalid chat outbox executor limits");
        BlockingQueue<Runnable> queue = queueCapacity == 0
                ? new SynchronousQueue<>() : new ArrayBlockingQueue<>(queueCapacity);
        return new ThreadPoolExecutor(threads, threads, 0, TimeUnit.MILLISECONDS, queue,
                new CustomizableThreadFactory("chat-outbox-"), new ThreadPoolExecutor.AbortPolicy()) {
            @Override public void close() {
                shutdown();
                try {
                    if (!awaitTermination(shutdownWaitSeconds, TimeUnit.SECONDS)) shutdownNow();
                } catch (InterruptedException interrupted) {
                    shutdownNow();
                    Thread.currentThread().interrupt();
                }
            }
        };
    }
}
