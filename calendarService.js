
import { useToast } from '@/components/ui/use-toast';

export const fetchCalendarEvents = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch calendar');
    const data = await response.json();
    
    return data.map(event => ({
      id: `cal-${event.id}`,
      title: event.name,
      description: event.description || '',
      start: new Date(event.timestart * 1000).toISOString(),
      end: new Date(event.timeend * 1000).toISOString(),
      type: 'calendar',
      priority: 'high',
      isCalendarEvent: true
    }));
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
};

export const importCalendarFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        const events = parseICSFile(content);
        resolve(events);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

const parseICSFile = (content) => {
  const events = [];
  const lines = content.split('\n');
  let currentEvent = null;

  lines.forEach(line => {
    line = line.trim();
    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = {};
    } else if (line.startsWith('END:VEVENT')) {
      if (currentEvent) events.push(currentEvent);
      currentEvent = null;
    } else if (currentEvent) {
      const [key, value] = line.split(':');
      if (key && value) {
        currentEvent[key] = value;
      }
    }
  });

  return events.map(event => ({
    id: `ics-${Date.now()}-${Math.random()}`,
    title: event.SUMMARY || 'Untitled Event',
    description: event.DESCRIPTION || '',
    start: event.DTSTART,
    end: event.DTEND,
    type: 'calendar',
    priority: 'medium',
    isCalendarEvent: true
  }));
};

export const syncCalendarWithAssignments = async (userId, events) => {
  try {
    const existingAssignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    
    // Filter out old calendar events
    const nonCalendarAssignments = existingAssignments.filter(a => !a.isCalendarEvent);
    
    // Add new calendar events as assignments
    const calendarAssignments = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      deadline: event.end,
      priority: event.priority,
      isCalendarEvent: true,
      studentId: userId,
      completed: false,
      createdAt: new Date().toISOString()
    }));

    // Combine and save
    const updatedAssignments = [...nonCalendarAssignments, ...calendarAssignments];
    localStorage.setItem('assignments', JSON.stringify(updatedAssignments));

    return calendarAssignments;
  } catch (error) {
    console.error('Error syncing calendar:', error);
    return [];
  }
};
