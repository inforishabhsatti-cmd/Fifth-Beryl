import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import "../App.css";

const TickerLabel = ({ position }) => {
  const { api } = useAuth();
  const [tickerText, setTickerText] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickerSettings = async () => {
      try {
        if (!api) return;
        const response = await api.get("/ticker");
        setTickerText(response.data.text);
        setIsActive(response.data.is_active);
      } catch {
        setTickerText("Welcome to Fifth Beryl! Free Shipping on all orders.");
        setIsActive(true);
      } finally {
        setLoading(false);
      }
    };
    fetchTickerSettings();
  }, [api]);

  if (loading || !isActive || !tickerText) return null;

  const isTop = position === "top";

  return (
    <div
      // CHANGED: bg-black text-white to bg-foreground text-background (Brown background, Vanilla text)
      className={`w-full overflow-hidden whitespace-nowrap bg-foreground text-background z-50 ${
        isTop ? "fixed top-0" : ""
      }`}
      style={{ left: 0 }}
    >
      <motion.p
        className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-widest uppercase py-[6px] px-4"
        initial={{ x: "100%" }}
        animate={{ x: "-100%" }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 28, // slow desktop
        }}
        style={{
          whiteSpace: "nowrap",
        }}
      >
        {tickerText}
      </motion.p>
    </div>
  );
};

export default TickerLabel;