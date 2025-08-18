import { motion } from "framer-motion";

export default function Home({ onGoTrack }: { onGoTrack: () => void }) {
  return (
    <motion.div
      className="text-center py-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
    >
      {/* 🎉 عنوان 3D Gradient */}
      <motion.h1
        className="fw-bold mb-4 display-3 gradient-text"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        🎉 Welcome to <br /> TimeTracker
      </motion.h1>

      {/* ✨ نص ثانوي */}
      <motion.p
        className="lead text-muted mb-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Track your work hours easily and stay productive!
      </motion.p>

      {/* ⏱️ زر متدرج مع أنيميشن */}
      <motion.button
        className="btn btn-lg px-5 py-3 fancy-btn"
        whileHover={{ scale: 1.1, rotate: 2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onGoTrack}
      >
        Go to Time Tracking ⏱️
      </motion.button>

      {/* 🎨 بعض الـ CSS */}
      <style>{`
        .gradient-text {
          background: linear-gradient(45deg, #ff6ec4, #7873f5, #4facfe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 3px 3px 8px rgba(0,0,0,0.3);
        }

        .fancy-btn {
          background: linear-gradient(135deg, #ff6ec4, #7873f5, #4facfe);
          border: none;
          border-radius: 50px;
          color: white;
          font-size: 1.2rem;
          font-weight: bold;
          box-shadow: 0px 4px 15px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }

        .fancy-btn:hover {
          box-shadow: 0px 8px 25px rgba(0,0,0,0.4);
        }
      `}</style>
    </motion.div>
  );
}
