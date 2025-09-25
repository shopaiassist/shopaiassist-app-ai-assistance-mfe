import { useEffect, useCallback } from 'react';

type EventListenerCallback<T> = (detail: T) => void;

export interface CustomEventData {
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
}

/**
 * Hook to handle communication between micro frontends.
 * The communication is done via custom events.
 *
 * 1. **Event Dispatching:**
 *    - MFEs can dispatch custom events to the `window` object. These events can carry data payloads, allowing MFEs to send information to each other. The `useMFECommunication` hook simplifies dispatching these events by providing a `sendEvent` function.
 *
 * 2. **Event Listening:**
 *    - MFEs can listen for custom events dispatched by other MFEs. When an MFE dispatches an event, any other MFE that has registered a listener for that specific event type can receive and process the data payload.
 *
 * 3. **Decoupling MFEs:**
 *    - This approach keeps MFEs decoupled, as they do not need to know about each other's internal implementations. They only need to agree on the event names and the structure of the data being exchanged.
 *
 * @param eventName
 * @param onEventReceived
 */
const useMFECommunication = (
  eventName: string = 'mfe_communication',
  onEventReceived?: EventListenerCallback<CustomEventData>
) => {
  // Function to send a custom event
  const sendEvent = useCallback(
    (detail: CustomEventData) => {
      const event = new CustomEvent<CustomEventData>(eventName, { detail });
      window.dispatchEvent(event);
    },
    [eventName]
  );

  useEffect(() => {
    // Handler for receiving custom events
    const eventHandler = (event: CustomEvent<CustomEventData>) => {
      if (onEventReceived) {
        onEventReceived(event.detail);
      }
    };

    // Add event listener
    window.addEventListener(eventName, eventHandler as EventListener);

    // Clean up
    return () => {
      window.removeEventListener(eventName, eventHandler as EventListener);
    };
  }, [eventName, onEventReceived]);

  return [sendEvent];
};

export default useMFECommunication;
