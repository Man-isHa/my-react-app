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
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  onValue,
  set,
  get,
  remove,
} from "firebase/database";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function App() {
  const [scans, setScans] = useState([]);
  const [name, setName] = useState("");
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const scansRef = ref(db, "scans");
    onValue(scansRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const scanList = Object.values(data);
        setScans(scanList);
      } else {
        setScans([]);
      }
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !guess || isNaN(guess) || guess < 1 || guess > 100) return;
    const newScan = {
      name,
      guess: Number(guess),
      timestamp: new Date().toISOString(),
    };
    const newScanRef = push(ref(db, "scans"));
    set(newScanRef, newScan);
    setName("");
    setGuess("");
  };

  const handleComplete = () => {
    if (scans.length === 0) return;

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

  const currentUrl = window.location.href;

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

      {!isComplete && (
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
      )}

      {!isComplete && (
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "36px" }}>Scan to Submit</h2>
          <QRCode value={currentUrl} size={256} />
        </div>
      )}

      {!isComplete && (
        <button
          onClick={handleComplete}
          style={{ fontSize: "32px", padding: "12px 24px", marginBottom: "40px" }}
        >
          Complete Game
        </button>
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
