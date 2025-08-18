import { useEffect, useMemo, useState } from "react";
import { api } from "../api"; // Importing API helper
import { motion } from "framer-motion"; // Importing animation library

// Helper function to format seconds into HH:MM:SS
function formatSeconds(s: number) {
  const h = Math.floor(s / 3600); // Calculate hours
  const m = Math.floor((s % 3600) / 60); // Calculate minutes
  const sec = s % 60; // Calculate seconds
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export default function TimeTracker() {
  const [total, setTotal] = useState(0); // Total time in seconds
  const [running, setRunning] = useState(false); // Whether the timer is running
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [tick, setTick] = useState(0); // Local tick counter for visual updates
  const [history, setHistory] = useState<{ day: string; date: string; time: string }[]>([]); // History of time tracking

  // Calculate the total time to display, including the local tick if running
  const displayTotal = useMemo(() => total + (running ? tick : 0), [total, running, tick]);

  // Function to load today's time data from the API
  const load = async () => {
    const res = await api.get("/time/today");
    setTotal(res.data.total_seconds ?? 0); // Set total time
    setRunning(res.data.running ?? false); // Set running state
  };

  // Load data when the component mounts
  useEffect(() => {
    load();
  }, []);

  // Visual timer that increments the tick counter locally when the timer is running
  useEffect(() => {
    if (!running) {
      setTick(0);
      return;
    }
    setTick(0);
    const int = setInterval(() => setTick((t) => t + 1), 1000); // Increment tick every second
    return () => clearInterval(int); // Clear interval when the timer stops
  }, [running]);

  // Function to start the timer
  const start = async () => {
    try {
      setLoading(true); // Set loading state
      await api.post("/time/start"); // Start the timer via API
      await load(); // Reload data
    } finally {
      setLoading(false); // Clear loading state
    }
  };

  // Function to stop the timer
  const stop = async () => {
    try {
      setLoading(true); // Set loading state
      await api.post("/time/end"); // Stop the timer via API
      await load(); // Reload data

      // Add the current day, date, and total time to the history
      const today = new Date();
      const day = today.toLocaleDateString("en-US", { weekday: "long" }); // Get today's day name
      const date = today.toLocaleDateString("en-US"); // Get today's date
      setHistory((prev) => [...prev, { day, date, time: formatSeconds(displayTotal) }]);
    } finally {
      setLoading(false); // Clear loading state
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8">
        <motion.div
          className="card border-0 shadow-lg rounded-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="card-body p-5 text-center">
            <div className="text-muted mb-2">Today's Time</div>
            <motion.div
              className="display-3 fw-bold"
              key={displayTotal}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {formatSeconds(displayTotal)}
            </motion.div>

            <div className="mt-4 d-flex gap-3 justify-content-center">
              {/* Start button */}
              {!running ? (
                <button
                  className="btn btn-lg btn-primary px-4 rounded-pill"
                  onClick={start}
                  disabled={loading}
                >
                  Start Time
                </button>
              ) : (
                // Stop button
                <button
                  className="btn btn-lg btn-danger px-4 rounded-pill"
                  onClick={stop}
                  disabled={loading}
                >
                  Stop Time
                </button>
              )}

              {/* Refresh button */}
              <button className="btn btn-outline-secondary rounded-pill" onClick={load} disabled={loading}>
                Refresh
              </button>
            </div>

            <div className="small text-muted mt-3">
              Status: {running ? <span className="text-success">Active</span> : <span className="text-secondary">Stopped</span>}
            </div>
          </div>
        </motion.div>

        {/* Display history table */}
        {history.length > 0 && (
          <div className="mt-4">
            <h5 className="text-center">Time Tracking History</h5>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Date</th>
                  <th>Total Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.day}</td>
                    <td>{entry.date}</td>
                    <td>{entry.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}