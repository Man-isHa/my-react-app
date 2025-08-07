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
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "submissions"), (snapshot) => {
      const latestMap = new Map();
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const existing = latestMap.get(data.name);
        if (!existing || existing.timestamp?.seconds < data.timestamp?.seconds) {
          latestMap.set(data.name, {
            name: data.name,
            guess: data.guess,
            timestamp: data.timestamp,
          });
        }
      });
      setPlayers(Array.from(latestMap.values()));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !guess || isNaN(guess) || guess < 1 || guess > 100) return;
    await addDoc(collection(db, "submissions"), {
      name,
      guess: Number(guess),
      timestamp: new Date(),
    });
    setName("");
    setGuess("");
  };

  const handleComplete = () => {
    if (players.length === 0) return;
    const avg = players.reduce((acc, p) => acc + p.guess, 0) / players.length;
    const target = (2 / 3) * avg;
    let minDiff = Infinity;
    let winner = null;

    players.forEach((p) => {
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
    labels: players.map((p) => p.name),
    datasets: [
      {
        label: "Guesses",
        data: players.map((p) => p.guess),
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

      <button
        onClick={handleComplete}
        disabled={players.length === 0 || isComplete}
        style={{ fontSize: "32px", padding: "12px 24px", marginBottom: "30px" }}
      >
        Complete and Show Result
      </button>

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
          <p>Winner: {result.winner.name} (Guess: {result.winner.guess})</p>
        </div>
      )}

      {isComplete && players.length > 0 && (
        <div style={{ marginTop: "60px" }}>
          <h2 style={{ fontSize: "36px", marginBottom: "20px" }}>Guess Statistics</h2>
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}

export default App;


// // App.js
// import React, { useState } from "react";
// import QRCode from "react-qr-code";

// function App() {
//   const [players, setPlayers] = useState([]);
//   const [name, setName] = useState("");
//   const [guess, setGuess] = useState("");
//   const [result, setResult] = useState(null);
//   const [isComplete, setIsComplete] = useState(false);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!name || !guess || isNaN(guess) || guess < 1 || guess > 100) return;
//     setPlayers([...players, { name, guess: Number(guess) }]);
//     setName("");
//     setGuess("");
//   };

//   const handleComplete = () => {
//     if (players.length === 0) return;
//     const avg = players.reduce((acc, p) => acc + p.guess, 0) / players.length;
//     const target = (2 / 3) * avg;
//     let minDiff = Infinity;
//     let winner = null;

//     players.forEach((p) => {
//       const diff = Math.abs(p.guess - target);
//       if (diff < minDiff) {
//         minDiff = diff;
//         winner = p;
//       }
//     });

//     setResult({ target: target.toFixed(2), winner });
//     setIsComplete(true);
//   };

//   const currentUrl = "https://Man-isHa.github.io/my-react-app";

//   return (
//     <div style={{ padding: "40px", fontFamily: "Arial", fontSize: "32px" }}>
//       <h1 style={{ fontSize: "40px" }}>Guess 2/3 of the Average Game</h1>

//       <form onSubmit={handleSubmit} style={{ marginBottom: "40px" }}>
//         <div style={{ marginBottom: "20px" }}>
//           <input
//             style={{ fontSize: "32px", padding: "12px", marginRight: "20px" }}
//             type="text"
//             placeholder="Your name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//           />
//           <input
//             style={{ fontSize: "32px", padding: "12px", marginRight: "20px" }}
//             type="number"
//             placeholder="Your guess (1-100)"
//             value={guess}
//             onChange={(e) => setGuess(e.target.value)}
//           />
//           <button style={{ fontSize: "32px", padding: "12px 24px" }} type="submit">
//             Submit
//           </button>
//         </div>
//       </form>

//       <button
//         onClick={handleComplete}
//         disabled={players.length === 0 || isComplete}
//         style={{ fontSize: "32px", padding: "12px 24px", marginBottom: "30px" }}
//       >
//         Complete and Show Result
//       </button>

//       {!isComplete && (
//         <div style={{ marginBottom: "30px" }}>
//           <h2 style={{ fontSize: "36px" }}>Scan to Submit</h2>
//           <QRCode value={currentUrl} size={256} />
//         </div>
//       )}

//       {result && (
//         <div style={{ marginTop: "40px" }}>
//           <h2 style={{ fontSize: "36px" }}>Result</h2>
//           <p>Target (2/3 of average): {result.target}</p>
//           <p>Winner: {result.winner.name} (Guess: {result.winner.guess})</p>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;
