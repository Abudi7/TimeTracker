import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { motion, AnimatePresence } from "framer-motion";

// --- Helpers ---
function formatSeconds(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec
    .toString()
    .padStart(2, "0")}`;
}
function prettyDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    weekday: "short",
  });
}

type DayTotal = { day: string; total_seconds: number };
const WORKDAY_SECONDS = 8 * 3600; // 8h target

export default function TimeTracker() {
  const [totalToday, setTotalToday] = useState(0);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const [tick, setTick] = useState(0);
  const displayTotalToday = useMemo(
    () => totalToday + (running ? tick : 0),
    [totalToday, running, tick]
  );

  const progress = Math.min(
    100,
    Math.round((displayTotalToday / WORKDAY_SECONDS) * 100)
  );

  const [history, setHistory] = useState<DayTotal[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadToday = async () => {
    const res = await api.get("/time/today");
    setTotalToday(res.data.total_seconds ?? 0);
    setRunning(res.data.running ?? false);
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get("/time/history?days=60");
      setHistory(res.data.history ?? []);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    Promise.all([loadToday(), loadHistory()]);
  }, []);

  useEffect(() => {
    if (!running) {
      setTick(0);
      return;
    }
    setTick(0);
    const int = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(int);
  }, [running]);

  const start = async () => {
    try {
      setLoading(true);
      await api.post("/time/start");
      await Promise.all([loadToday(), loadHistory()]);
    } finally {
      setLoading(false);
    }
  };

  const stop = async () => {
    try {
      setLoading(true);
      await api.post("/time/end");
      await Promise.all([loadToday(), loadHistory()]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-xxl-10">
        {/* HEADER / TITLE */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="display-5 fw-bold gradient-text-3d mb-2">
            Time Tracking Dashboard
          </h2>
          <p className="text-muted mb-0">
            Stay focused. Track your work beautifully.
          </p>
        </motion.div>

        {/* TODAY CARD */}
        <motion.div
          className="card border-0 shadow-lg rounded-4 overflow-hidden glassy-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="card-body p-5 text-center">
            <div className="text-muted mb-2">Today's Time</div>

            <motion.div
              className="display-3 fw-bold gradient-number"
              key={displayTotalToday}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              style={{ textShadow: "3px 3px 10px rgba(0,0,0,.25)" }}
            >
              {formatSeconds(displayTotalToday)}
            </motion.div>

            {/* Progress */}
            <div className="mt-4">
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>0h</span>
                <span>{Math.floor(WORKDAY_SECONDS / 3600)}h target</span>
              </div>
              <div className="progress progress-animated rounded-pill" style={{ height: 14 }}>
                <div
                  className="progress-bar gradient-bar"
                  role="progressbar"
                  style={{ width: `${progress}%` }}
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <div className="small text-muted mt-2">{progress}% of daily goal</div>
            </div>

            {/* ACTIONS */}
            <div className="mt-4 d-flex gap-3 justify-content-center flex-wrap">
              {!running ? (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ y: -1 }}
                  className="btn btn-lg px-4 rounded-pill btn-gradient"
                  onClick={start}
                  disabled={loading}
                >
                  <i className="bi bi-play-fill me-2" /> Start
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ y: -1 }}
                  className="btn btn-lg px-4 rounded-pill btn-gradient-danger"
                  onClick={stop}
                  disabled={loading}
                >
                  <i className="bi bi-stop-fill me-2" /> Stop
                </motion.button>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ y: -1 }}
                className="btn rounded-pill btn-soft"
                onClick={() => Promise.all([loadToday(), loadHistory()])}
                disabled={loading}
              >
                <i className="bi bi-arrow-repeat me-2" /> Refresh
              </motion.button>
            </div>

            <div className="small text-muted mt-3">
              Status:{" "}
              {running ? (
                <span className="text-success">Active</span>
              ) : (
                <span className="text-secondary">Stopped</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* HISTORY */}
        <motion.div
          className="mt-4 card border-0 shadow-sm rounded-4 glassy-card-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0">History (Daily Totals)</h5>
              <small className="text-muted">Last 60 days</small>
            </div>

            {loadingHistory && (
              <div className="py-3">
                <div className="placeholder-wave">
                  <div className="placeholder shimmer col-12 mb-2" style={{ height: 14 }} />
                  <div className="placeholder shimmer col-10 mb-2" style={{ height: 14 }} />
                  <div className="placeholder shimmer col-8 mb-2" style={{ height: 14 }} />
                </div>
              </div>
            )}

            {!loadingHistory && history.length > 0 && (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr className="text-muted">
                      <th style={{ width: 140 }}>Date</th>
                      <th>Pretty</th>
                      <th className="text-end" style={{ width: 160 }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <AnimatePresence initial={false}>
                    <tbody>
                      {history.map((d) => (
                        <motion.tr
                          key={d.day}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2 }}
                          className="border-top"
                        >
                          <td className="text-muted">{d.day}</td>
                          <td>{prettyDate(d.day)}</td>
                          <td className="text-end fw-semibold">{formatSeconds(d.total_seconds)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </AnimatePresence>
                </table>
              </div>
            )}

            {!loadingHistory && history.length === 0 && (
              <div className="text-center text-muted py-3">No history yet.</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Styles */}
      <style>{`
        /* 3D Gradient title */
        .gradient-text-3d {
          background: linear-gradient(45deg, #ff6ec4, #7873f5, #4facfe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 2px 2px 0 rgba(0,0,0,.08), 6px 8px 18px rgba(0,0,0,.18);
        }

        /* Big gradient number */
        .gradient-number {
          background: linear-gradient(90deg, #00d4ff, #7a5cff, #ff6ec4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Glassy cards */
        .glassy-card {
          background: linear-gradient(135deg, rgba(13,110,253,0.08) 0%, rgba(25,135,84,0.08) 100%);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.35);
        }
        .glassy-card-2 {
          background: linear-gradient(135deg, rgba(120,115,245,0.06) 0%, rgba(79,172,254,0.06) 100%);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.3);
        }

        /* Gradient buttons */
        .btn-gradient {
          background: linear-gradient(135deg, #00d4ff, #7a5cff);
          color: #fff;
          border: none;
          box-shadow: 0 6px 18px rgba(122,92,255,0.35);
        }
        .btn-gradient:hover {
          filter: brightness(1.05);
          box-shadow: 0 10px 28px rgba(122,92,255,0.45);
        }

        .btn-gradient-danger {
          background: linear-gradient(135deg, #ff6a88, #ff99ac);
          color: #fff;
          border: none;
          box-shadow: 0 6px 18px rgba(255,106,136,0.35);
        }
        .btn-gradient-danger:hover {
          filter: brightness(1.05);
          box-shadow: 0 10px 28px rgba(255,106,136,0.45);
        }

        .btn-soft {
          background: linear-gradient(135deg, rgba(0,0,0,.02), rgba(0,0,0,.06));
          border: 1px solid rgba(0,0,0,.06);
          color: #333;
        }

        /* Animated progress bar */
        .progress-animated {
          background: rgba(0,0,0,.06);
          overflow: hidden;
          position: relative;
        }
        .gradient-bar {
          background: linear-gradient(90deg, #00d4ff, #7a5cff, #ff6ec4);
          background-size: 200% 100%;
          animation: slide 2.5s linear infinite;
          border-radius: 999px;
        }
        @keyframes slide {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        /* Shimmer placeholders */
        .shimmer {
          position: relative;
          overflow: hidden;
        }
        .shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
          animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
