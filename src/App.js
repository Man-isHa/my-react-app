// App.js
import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [scans, setScans] = useState([]);
  const [name, setName] = useState("");
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [timer, setTimer] = useState(60); // Timer duration in seconds
  const [timerRunning, setTimerRunning] = useState(false);

  // Retrieve previous responses from localStorage
  useEffect(() => {
    const storedScans = JSON.parse(localStorage.getItem("scans") || "[]");
    setScans(storedScans);
  }, []);

  // Save updated scans to localStorage
  useEffect(() => {
    localStorage.setItem("scans", JSON.stringify(scans));
  }, [scans]);

  // Shared countdown timer across all clients
  useEffect(() => {
    const storedStartTime = localStorage.getItem("startTime");
    if (storedStartTime && !isComplete) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - parseInt(storedStartTime)) / 1000);
        const remaining = Math.max(0, 60 - elapsed);
        setTimer(remaining);
        if (remaining === 0) {
          clearInterval(interval);
          handleComplete();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isComplete]);

  const startTimer = () => {
    localStorage.setItem("startTime", Date.now().toString());
    setTimerRunning(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !guess || isNaN(guess) || guess < 1 || guess > 100) return;
    const newScan = {
      name,
      guess: Number(guess),
      timestamp: new Date().toISOString(),
    };
    setScans((prev) => [...prev, newScan]);
    setName("");
    setGuess("");
  };

  const handleComplete = () => {
    if (scans.length === 0) return;

    // Combine all guesses per player and compute average
    const playerMap = new Map();
    scans.forEach((scan) => {
      const { name, guess } = scan;
      if (!playerMap.has(name)) {
        playerMap.set(name, []);
      }
      playerMap.get(name).push(guess);
    });

    const averagedPlayers = Array.from(playerMap.entries()).map(([name, guesses]) => {
      const avgGuess = guesses.reduce((a, b) => a + b, 0) / guesses.length;
      return { name, guess: avgGuess };
    });

    const totalAvg =
      averagedPlayers.reduce((acc, p) => acc + p.guess, 0) / averagedPlayers.length;
    const target = (2 / 3) * totalAvg;

    let minDiff = Infinity;
    let winner = null;
    averagedPlayers.forEach((p) => {
      const diff = Math.abs(p.guess - target);
      if (diff < minDiff) {
        minDiff = diff;
        winner = p;
      }
    });

    setResult({ target: target.toFixed(2), winner });
    setIsComplete(true);
  };

  const currentUrl = "https://man-isha.github.io/my-react-app";

  const chartData = {
    labels: Array.from(new Set(scans.map((scan) => scan.name))),
    datasets: [
      {
        label: "Guesses",
        data: Array.from(
          new Map(
            Array.from(
              scans.reduce((acc, scan) => {
                if (!acc.has(scan.name)) acc.set(scan.name, []);
                acc.get(scan.name).push(scan.guess);
                return acc;
              }, new Map())
            ).entries()
          ).values()
        ).map((arr) => arr.reduce((a, b) => a + b, 0) / arr.length),
        backgroundColor: "rgba(75,192,192,0.6)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Distribution of Guesses",
        font: {
          size: 24,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial", fontSize: "32px" }}>
      <h1 style={{ fontSize: "40px" }}>Guess 2/3 of the Average Game</h1>

      {!timerRunning && !isComplete && (
        <button
          onClick={startTimer}
          style={{ fontSize: "32px", padding: "12px 24px", marginBottom: "20px" }}
        >
          Start Timer
        </button>
      )}

      {timerRunning && !isComplete && (
        <div style={{ fontSize: "32px", marginBottom: "20px" }}>
          Time Remaining: {timer} seconds
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: "40px" }}>
        <div style={{ marginBottom: "20px" }}>
          <input
            style={{ fontSize: "32px", padding: "12px", marginRight: "20px" }}
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            style={{ fontSize: "32px", padding: "12px", marginRight: "20px" }}
            type="number"
            placeholder="Your guess (1-100)"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
          />
          <button style={{ fontSize: "32px", padding: "12px 24px" }} type="submit">
            Submit
          </button>
        </div>
      </form>

      {!isComplete && (
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "36px" }}>Scan to Submit</h2>
          <QRCode value={currentUrl} size={256} />
        </div>
      )}

      {result && (
        <div style={{ marginTop: "40px" }}>
          <h2 style={{ fontSize: "36px" }}>Result</h2>
          <p>Target (2/3 of average): {result.target}</p>
          <p>Winner: {result.winner.name} (Guess: {result.winner.guess.toFixed(2)})</p>
        </div>
      )}

      {isComplete && (
        <div style={{ marginTop: "60px" }}>
          <h2 style={{ fontSize: "36px", marginBottom: "20px" }}>Guess Statistics</h2>
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}

export default App;
