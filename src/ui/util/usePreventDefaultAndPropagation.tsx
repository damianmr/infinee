import { MutableRefObject, useEffect } from 'react';

/**
 * A React Hook to void browser's default behavior for a given list of events.
 *
 * It does so by calling event.preventDefault() and event.stopPropagation()
 * and handling the removal of the listeners in the clean up phase of the hook.
 *
 * Usage:
 *
 * const MyComponent = () => {
 *   const elementRef = useRef(null);
 *   usePreventDefaultAndPropagation(['dragenter', dragover', 'dragleave', 'drop'], elementRef);
 *   return <div ref={elementRef}>I won't trigger browser's behavior during drag events</div>;
 * }
 *
 * @param events the event or the events that will be prevented.
 * @param ref the reference returned by the setRef hook. Don't forget to use that
 *  ref as part of an attribute in an HTML element or the hook will throw an exception.
 */
export default function usePreventDefaultAndPropagation(
  events: string | string[],
  ref: MutableRefObject<HTMLElement | null>
): EventListener {
  function preventDefaultAndPropagation(e: Event): void {
    e.preventDefault();
    // e.stopPropagation();
  }

  useEffect(() => {
    let theEvents: string[] = [];

    if (typeof events === 'string') {
      theEvents = [events];
    } else {
      theEvents = events;
    }

    theEvents.forEach((event: string) => {
      if (ref && ref.current) {
        ref.current.addEventListener(event, preventDefaultAndPropagation);
      } else {
        throw new Error(
          [
            `Cannot attach '${event}' event. The DOM reference is null. `,
            `Did you forget to set the 'ref' attribute in the JSX Element?`
          ].join()
        );
      }
    });

    return () => {
      theEvents.forEach((event: string) => {
        if (ref && ref.current) {
          ref.current.removeEventListener(event, preventDefaultAndPropagation);
        } else {
          throw new Error(
            [
              `Cannot attach '${event}' event. The DOM reference is null. `,
              `Did you forget to set the 'ref' attribute in the JSX Element?`
            ].join()
          );
        }
      });
    };
  });

  return preventDefaultAndPropagation;
}
