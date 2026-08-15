import { EventEmitter } from 'node:events';

export type AppEventType =
  | 'agent_run_update'
  | 'task_status_change'
  | 'funnel_decay_tick'
  | 'comms_new_message'
  | 'connector_status_change';

export type AppEventPayload<T extends AppEventType = AppEventType> = {
  type: T;
  data: unknown;
  timestamp: string;
};

class AppEvents extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  publish<T extends AppEventType>(type: T, data: unknown): void {
    const payload: AppEventPayload<T> = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    this.emit(type, payload);
    this.emit('*', payload);
  }

  subscribe<T extends AppEventType>(
    type: T | '*',
    listener: (payload: AppEventPayload<T>) => void,
  ): () => void {
    this.on(type, listener);
    return () => this.off(type, listener);
  }
}

export const appEvents = new AppEvents();
