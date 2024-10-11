class EventEmitter {
    private listeners: { [event: string]: Function[] } = {};
  
    on(event: string, fn: Function) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(fn);
    }
  
    emit(event: string, ...args: any[]) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(fn => fn(...args));
      }
    }
  
    off(event: string, fn: Function) {
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter(listener => listener !== fn);
      }
    }
  }
  
  export const globalEventEmitter = new EventEmitter();