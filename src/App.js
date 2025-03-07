import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from "@react-oauth/google";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";

const clientId = "781966425935-57n7rvokjfam5k14eq72qaigmk9adefl.apps.googleusercontent.com"; // Replace with your Google OAuth Client ID

const App = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [events, setEvents] = useState([]);

  const handleLoginSuccess = async (response) => {
    console.log("Login Success:", response);

    // Exchange JWT credential for an OAuth access token
    try {
      const res = await axios.post("https://oauth2.googleapis.com/token", {
        client_id: clientId,
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: response.credential,
      });

      setAccessToken(res.data.access_token);
      fetchEvents(res.data.access_token);
    } catch (error) {
      console.error("Error exchanging token:", error);
    }
  };

  const handleLoginFailure = (error) => {
    console.error("Login Failed:", error);
  };

  const fetchEvents = async (token) => {
    try {
      const res = await axios.get(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const formattedEvents = res.data.items.map((event) => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end?.dateTime || event.end?.date || event.start.dateTime,
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleAddEvent = async () => {
    if (!accessToken) {
      alert("Please log in first.");
      return;
    }

    const eventTitle = prompt("Enter Event Title:");
    if (!eventTitle) return;

    const eventDate = prompt("Enter Event Date (YYYY-MM-DD):");
    if (!eventDate) return;

    const startTime = prompt("Enter Start Time (HH:MM, 24-hour format):");
    if (!startTime) return;

    const endTime = prompt("Enter End Time (HH:MM, 24-hour format):");
    if (!endTime) return;

    const startDateTime = dayjs(`${eventDate}T${startTime}:00`).toISOString();
    const endDateTime = dayjs(`${eventDate}T${endTime}:00`).toISOString();

    const eventData = {
      summary: eventTitle,
      start: { dateTime: startDateTime, timeZone: "America/Los_Angeles" },
      end: { dateTime: endDateTime, timeZone: "America/Los_Angeles" },
    };

    try {
      const response = await axios.post(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        eventData,
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
      );

      const newEvent = {
        id: response.data.id,
        title: eventTitle,
        start: startDateTime,
        end: endDateTime,
      };

      console.log("New Event:", newEvent);
      console.log("Updated Events:", [...events, newEvent]);

      // Update the events state
      setEvents((prevEvents) => [...prevEvents, newEvent]);
      alert("Event added!");
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const handleLogout = () => {
    googleLogout();
    setAccessToken(null);
    setEvents([]); // Clear events on logout
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="App">
        <h1>Google Calendar</h1>
        {!accessToken ? (
          <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginFailure} />
        ) : (
          <div>
            <button onClick={handleLogout}>Logout</button>
            <button onClick={handleAddEvent}>➕ Add Event</button>
            <FullCalendar
              key={events.length} // Force re-render when events change
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
            />
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;