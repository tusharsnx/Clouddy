type FailFastFunc = (e: unknown) => boolean;
type TaskExecutorOptions = {
  /**
   * Delay between retries in seconds.
   * If set to "exponential", the delay will increase exponentially.
   */
  delay?: number | "exponential";
  /**
   * Maximum number of retries.
   */
  maxRetries?: number;
  /**
   * A function that determines whether a task should be retried given
   * the error. Returns true if retry should not be attempted,
   * false otherwise.
   */
  failFast?: FailFastFunc;
};

type CoreResult<T> =
  | {
      success: true;
      result: T;
      error?: undefined;
    }
  | {
      success: false;
      result?: undefined;
      error: unknown;
    };

/**
 * A task executor that retries failed tasks with a fixed
 * or an exponential delay for a given number of retries.
 */
export class TaskExecutor {
  delay: number | "exponential";
  maxRetries: number;
  failFast?: FailFastFunc;

  constructor({
    delay: TaskDelay = "exponential",
    maxRetries: number = 2,
    failFast,
  }: TaskExecutorOptions = {}) {
    this.delay = TaskDelay;
    this.maxRetries = number;
    this.failFast = failFast;
  }

  async execute<T>(task: () => PromiseLike<T>): Promise<T> {
    const result = await this.#core(task, 0);
    if (!result.success) {
      throw result.error;
    }
    return result.result;
  }

  async executeSafe<T>(task: () => PromiseLike<T>): Promise<CoreResult<T>> {
    return await this.#core(task, 0);
  }

  async #core<T>(
    task: () => PromiseLike<T>,
    retryCount: number,
  ): Promise<CoreResult<T>> {
    try {
      const result = await task();
      return { success: true, result };
    } catch (e) {
      // Do not retry if this is a fail fast error or retry limit
      // is reached
      if (this.failFast?.(e) || retryCount > this.maxRetries) {
        return { success: false, error: e };
      }

      const d = this.delay === "exponential" ? 2 ** retryCount : this.delay;
      await new Promise((resolve) => setTimeout(resolve, d * 1000));
      return await this.#core(task, retryCount + 1);
    }
  }
}
