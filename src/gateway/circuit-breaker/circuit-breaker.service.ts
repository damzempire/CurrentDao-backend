import { Injectable, Logger } from '@nestjs/common';

enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly states = new Map<string, CircuitState>();
  private readonly failureCounts = new Map<string, number>();
  private readonly lastFailureTimes = new Map<string, number>();

  private readonly failureThreshold = 5;
  private readonly resetTimeout = 30000; // 30 seconds

  async execute<T>(serviceName: string, action: () => Promise<T>): Promise<T> {
    const state = this.getState(serviceName);

    if (state === CircuitState.OPEN) {
      if (this.shouldAttemptReset(serviceName)) {
        this.setState(serviceName, CircuitState.HALF_OPEN);
      } else {
        throw new Error(`Circuit breaker is OPEN for service: ${serviceName}`);
      }
    }

    try {
      const result = await action();
      this.handleSuccess(serviceName);
      return result;
    } catch (error) {
      this.handleFailure(serviceName);
      throw error;
    }
  }

  private getState(serviceName: string): CircuitState {
    return this.states.get(serviceName) || CircuitState.CLOSED;
  }

  private setState(serviceName: string, state: CircuitState) {
    this.logger.log(`Circuit breaker for ${serviceName} changed to ${CircuitState[state]}`);
    this.states.set(serviceName, state);
  }

  private shouldAttemptReset(serviceName: string): boolean {
    const lastFailureTime = this.lastFailureTimes.get(serviceName) || 0;
    return Date.now() - lastFailureTime > this.resetTimeout;
  }

  private handleSuccess(serviceName: string) {
    this.failureCounts.set(serviceName, 0);
    if (this.getState(serviceName) === CircuitState.HALF_OPEN) {
      this.setState(serviceName, CircuitState.CLOSED);
    }
  }

  private handleFailure(serviceName: string) {
    const count = (this.failureCounts.get(serviceName) || 0) + 1;
    this.failureCounts.set(serviceName, count);
    this.lastFailureTimes.set(serviceName, Date.now());

    if (count >= this.failureThreshold) {
      this.setState(serviceName, CircuitState.OPEN);
    }
  }
}
