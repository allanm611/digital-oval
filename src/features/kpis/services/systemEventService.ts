import { SystemEvent, SYSTEM_EVENTS } from "../types/systemEvent";

export const systemEventService = {
  // Get all events (using dummy data for now - backend doesn't have system events yet)
  getAllEvents: async (): Promise<SystemEvent[]> => {
    try {
      return SYSTEM_EVENTS;
    } catch (err) {
      console.error("Failed to fetch system events:", err);
      return [];
    }
  },

  // Get a single event by ID
  getEventById: async (id: number): Promise<SystemEvent | null> => {
    const events = await systemEventService.getAllEvents();
    return events.find((e) => e.id === id) || null;
  },
};
