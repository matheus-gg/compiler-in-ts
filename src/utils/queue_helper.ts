import { GenericEvent, GenericEventQueue } from "../types/events";

const addEventToQueue = (event: GenericEvent, queue: GenericEventQueue): number => queue.push(event);

const getEventFromQueue = (queue: GenericEventQueue): GenericEvent | undefined => queue.shift();

const readEventFromQueue = (queue: GenericEventQueue, index: number): GenericEvent | undefined => queue[index];

export { addEventToQueue, getEventFromQueue, readEventFromQueue };
