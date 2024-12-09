import Logger from "../utils/logger";

interface QueueOperation<T> {
    operation: () => Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
    timestamp: number;
    timeout?: NodeJS.Timeout;
    name?: string; // For better logging
}

export interface QueueOptions {
    maxQueueSize?: number;
    operationTimeout?: number;
    retryCount?: number;
    retryDelay?: number;
}

export class Queue {
    private queue: QueueOperation<any>[] = [];
    private isProcessing: boolean = false;
    private readonly maxQueueSize: number;
    private readonly operationTimeout: number;
    private readonly retryCount: number;
    private readonly retryDelay: number;

    constructor(options: QueueOptions = {}) {
        this.maxQueueSize = options.maxQueueSize || 100;
        this.operationTimeout = options.operationTimeout || 120000; // 2 minutes default
        this.retryCount = options.retryCount || 0;
        this.retryDelay = options.retryDelay || 1000; // 1 second default
    }

    async enqueue<T>(operation: () => Promise<T>, name?: string): Promise<T> {
        if (this.queue.length >= this.maxQueueSize) {
            throw new Error(`Queue capacity exceeded (max ${this.maxQueueSize} operations)`);
        }

        return new Promise<T>((resolve, reject) => {
            const queueOperation: QueueOperation<T> = {
                operation,
                resolve,
                reject,
                timestamp: Date.now(),
                name: name,
                timeout: setTimeout(() => {
                    const index = this.queue.indexOf(queueOperation);
                    if (index > -1) {
                        this.queue.splice(index, 1);
                        const timeoutError = new Error(`Operation ${name || 'unnamed'} timed out after ${this.operationTimeout}ms`);
                        reject(timeoutError);
                        this.processQueue().catch(err => 
                            Logger.error('Error processing queue after timeout:', err)
                        );
                    }
                }, this.operationTimeout)
            };

            this.queue.push(queueOperation);
            Logger.debug(`Operation ${name || 'unnamed'} enqueued. Queue size: ${this.queue.length}`);
            
            if (!this.isProcessing) {
                this.processQueue().catch(err => 
                    Logger.error('Error starting queue processing:', err)
                );
            }
        });
    }

    private async executeWithRetry<T>(operation: () => Promise<T>, name: string | undefined, retries: number = this.retryCount): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            if (retries > 0) {
                Logger.warn(`Operation ${name || 'unnamed'} failed, retrying... (${retries} attempts remaining)`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.executeWithRetry(operation, name, retries - 1);
            }
            throw error;
        }
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        Logger.debug('Started processing queue');

        try {
            while (this.queue.length > 0) {
                const operation = this.queue[0];

                try {
                    if (operation.timeout) {
                        clearTimeout(operation.timeout);
                    }

                    const result = await this.executeWithRetry(operation.operation, operation.name);
                    operation.resolve(result);
                } catch (error) {
                    Logger.error(`Operation ${operation.name || 'unnamed'} failed:`, error);
                    operation.reject(error);
                } finally {
                    this.queue.shift();
                    Logger.debug(`Operation ${operation.name || 'unnamed'} completed. Remaining queue size: ${this.queue.length}`);
                }
            }
        } catch (error) {
            Logger.error('Fatal error processing queue:', error);
            this.queue.forEach(op => {
                if (op.timeout) {
                    clearTimeout(op.timeout);
                }
                op.reject(new Error('Queue processing failed'));
            });
            this.queue = [];
        } finally {
            this.isProcessing = false;
            Logger.debug('Finished processing queue');
        }
    }
}