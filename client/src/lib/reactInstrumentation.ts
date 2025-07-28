// React Component Instrumentation
// Automatic logging for React component lifecycle and state changes

import { useEffect, useRef } from 'react';
import { globalLogger, logComponent, logState } from './globalLogger';

// Hook to automatically log component lifecycle
export const useComponentLogging = (componentName: string, props?: any) => {
  const mountedRef = useRef(false);
  const renderCountRef = useRef(0);
  const lastPropsRef = useRef(props);

  // Track render cycles
  renderCountRef.current++;
  
  useEffect(() => {
    if (!mountedRef.current) {
      // Component mounting
      mountedRef.current = true;
      logComponent(componentName, 'mount', { 
        props: typeof props === 'object' ? Object.keys(props || {}) : props 
      });
    } else {
      // Component updating
      logComponent(componentName, 'update', {
        renderCount: renderCountRef.current,
        propsChanged: JSON.stringify(lastPropsRef.current) !== JSON.stringify(props)
      });
    }

    // Log props changes
    if (lastPropsRef.current !== props) {
      logState(componentName, 'props', lastPropsRef.current, props);
      lastPropsRef.current = props;
    }

    return () => {
      // Component unmounting (cleanup)
      logComponent(componentName, 'unmount', {
        totalRenders: renderCountRef.current
      });
    };
  }, [componentName, props]);

  // Log every render
  useEffect(() => {
    logComponent(componentName, 'render', {
      renderCount: renderCountRef.current
    });
  });
};

// Hook to log state changes in components
export const useStateLogging = (componentName: string, stateName: string, stateValue: any) => {
  const previousValueRef = useRef(stateValue);

  useEffect(() => {
    if (previousValueRef.current !== stateValue) {
      logState(componentName, stateName, previousValueRef.current, stateValue);
      previousValueRef.current = stateValue;
    }
  }, [componentName, stateName, stateValue]);
};

// Hook to log effect dependencies
export const useEffectLogging = (componentName: string, effectName: string, dependencies: any[]) => {
  const previousDepsRef = useRef(dependencies);

  useEffect(() => {
    const depsChanged = dependencies.some((dep, index) => dep !== previousDepsRef.current[index]);
    
    globalLogger.log('data-flow', 'react-effect', effectName, {
      component: componentName,
      depsChanged,
      dependencies: dependencies.map(dep => typeof dep),
      previousDeps: previousDepsRef.current?.map(dep => typeof dep)
    });

    previousDepsRef.current = dependencies;
  }, dependencies);
};

// Wrapper for React Query operations
export const logReactQuery = (queryKey: any, queryFn: any, componentName?: string) => {
  const keyString = Array.isArray(queryKey) ? queryKey.join(':') : queryKey;
  
  globalLogger.log('data-flow', 'react-query', 'query-created', {
    queryKey: keyString,
    component: componentName,
    hasQueryFn: !!queryFn
  });

  return {
    queryKey,
    queryFn: async (...args: any[]) => {
      const start = Date.now();
      try {
        globalLogger.log('data-flow', 'react-query', 'query-started', {
          queryKey: keyString,
          component: componentName
        });

        const result = await queryFn(...args);

        globalLogger.log('data-flow', 'react-query', 'query-success', {
          queryKey: keyString,
          component: componentName,
          duration: Date.now() - start,
          resultType: typeof result,
          resultSize: Array.isArray(result) ? result.length : 
                      result && typeof result === 'object' ? Object.keys(result).length : 0
        });

        return result;
      } catch (error) {
        globalLogger.logError(error, 'react-query', {
          queryKey: keyString,
          component: componentName,
          duration: Date.now() - start
        });
        throw error;
      }
    }
  };
};

// Zustand store instrumentation
export const createInstrumentedStore = (storeName: string, createStore: any) => {
  const originalStore = createStore((set: any, get: any) => {
    const originalSet = set;
    
    // Wrap the set function to log state changes
    const instrumentedSet = (newState: any) => {
      const oldState = get();
      
      if (typeof newState === 'function') {
        const computedState = newState(oldState);
        logState(storeName, 'store-update', oldState, computedState, {
          updateType: 'function'
        });
        return originalSet(computedState);
      } else {
        logState(storeName, 'store-update', oldState, { ...oldState, ...newState }, {
          updateType: 'object',
          changedKeys: Object.keys(newState)
        });
        return originalSet(newState);
      }
    };

    return createStore(instrumentedSet, get);
  });

  // Log store creation
  globalLogger.log('state-change', 'zustand', 'store-created', {
    storeName,
    initialState: typeof originalStore.getState() === 'object' ? 
      Object.keys(originalStore.getState()) : 'non-object'
  });

  return originalStore;
};

// Component wrapper for automatic logging
export const withLogging = <P extends {}>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const WrappedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'UnknownComponent';
    useComponentLogging(name, props);
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withLogging(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Performance measurement for React components
export const usePerformanceLogging = (componentName: string, operation: string) => {
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
  });

  useEffect(() => {
    const duration = Date.now() - startTimeRef.current;
    globalLogger.logPerformance(`${componentName}:${operation}`, duration, {
      component: componentName
    });
  });
};

// IndexedDB operation logging
export const logIndexedDBOperation = (storeName: string, operation: string, key?: any, data?: any) => {
  globalLogger.log('filesystem', 'indexeddb', operation, {
    storeName,
    key: typeof key === 'string' ? key : typeof key,
    dataType: typeof data,
    dataSize: data && typeof data === 'object' ? Object.keys(data).length : 0
  });
};