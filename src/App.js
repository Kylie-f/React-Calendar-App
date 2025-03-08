import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from "@react-oauth/google";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import multiMonthPlugin from "@fullcalendar/multimonth";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";
import "./index.css";

const clientId = "781966425935-57n7rvokjfam5k14eq72qaigmk9adefl.apps.googleusercontent.com";

const App = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [events, setEvents] = useState([]);
  const [calendarView, setCalendarView] = useState("dayGridMonth"); // Default view

  const handleLoginSuccess = async (response) => {
    console.log("Login Success:", response);
    setAccessToken(response.credential);
    fetchEvents(response.credential);
  };

  const handleLoginFailure = (error) => {
    console.error("Login Failed:", error);
  };

  const fetchEvents = async (token) => {
    try {
      const res = await axios.get(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        { headers: { Authorization: `Bearer ${token}` } }
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
      <div className={`app-container ${accessToken ? "logged-in" : ""}`}>
        {/* Header Section */}
        <header className="navbar">
          <h1>Google Calendar App</h1>
          {!accessToken ? (
            <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginFailure} />
          ) : (
            <div className="user-controls">
              <button onClick={handleLogout}>Logout</button>
              <button onClick={handleAddEvent}>➕ Add Event</button>
            </div>
          )}
        </header>

        {/* Calendar Controls */}
        {accessToken && (
          <>
            <div className="view-controls">
              <button onClick={() => setCalendarView("timeGridDay")}>Day View</button>
              <button onClick={() => setCalendarView("dayGridMonth")}>Month View</button>
              <button onClick={() => setCalendarView("multiMonthYear")}>Year View</button>
            </div>

            {/* Calendar Display */}
            <div className="calendar-container">
              <FullCalendar
                key={calendarView} // Forces re-render on view change
                plugins={[dayGridPlugin, timeGridPlugin, multiMonthPlugin, interactionPlugin]}
                initialView={calendarView}
                events={events}
              />
            </div>
          </>
        )}
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;
