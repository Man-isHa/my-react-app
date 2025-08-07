// App.js
import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  getDocs,
  doc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_t0Dy1suCtHT-BA6dZWJ3pM2D77h5v7w",
  authDomain: "my-react-app-4ed71.firebaseapp.com",
  projectId: "my-react-app-4ed71",
  storageBucket: "my-react-app-4ed71.appspot.com",
  messagingSenderId: "79329533394",
  appId: "1:79329533394:web:b2e2c869c0a41a4f17fc0b",
  measurementId: "G-8ZW9F9QTEJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [name, setName] = useState("");
  const [guess, setGuess] = useState("");
  const [responses, setResponses] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "responses"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setResponses(data);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || isNaN(guess) || guess < 1 || guess > 100) return;
    await addDoc(collection(db, "responses"), {
      name,
      guess: Number(guess),
      timestamp: new Date(),
    });
    setName("");
    setGuess("");
  };

  const handleComplete = () => {
    if (responses.length === 0) return;

    const averaged = responses.map(({ name, guess }) => ({ name, guess }));

    const totalAvg = averaged.reduce((sum, p) => sum + p.guess, 0) / averaged.length;
    const target = (2 / 3) * totalAvg;

    let winner = null;
    let minDiff = Infinity;
    for (let p of averaged) {
      const diff = Math.abs(p.guess - target);
      if (diff < minDiff) {
        minDiff = diff;
        winner = p;
      }
    }

    setResult({ target: target.toFixed(2), winner });
  };

  const clearResponses = async () => {
    const querySnapshot = await getDocs(collection(db, "responses"));
    for (let docu of querySnapshot.docs) {
      await deleteDoc(doc(db, "responses", docu.id));
    }
    setResult(null);
  };

  const currentUrl = "https://man-isha.github.io/my-react-app";

  return (
    <div style={{ padding: "40px", fontFamily: "Arial", fontSize: "28px" }}>
      <h1>Guess 2/3 of the Average</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ fontSize: "24px", padding: "8px", marginRight: "10px" }}
        />
        <input
          type="number"
          placeholder="Your guess (1-100)"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          style={{ fontSize: "24px", padding: "8px", marginRight: "10px" }}
        />
        <button type="submit" style={{ fontSize: "24px", padding: "8px 16px" }}>
          Submit
        </button>
      </form>

      <div style={{ marginBottom: "30px" }}>
        <h2>Scan to Respond</h2>
        <QRCode value={currentUrl} size={200} />
      </div>

      <button onClick={handleComplete} style={{ fontSize: "24px", padding: "10px 20px", marginRight: "10px" }}>
        Complete and Show Winner
      </button>

      <button onClick={clearResponses} style={{ fontSize: "24px", padding: "10px 20px" }}>
        Reset Responses
      </button>

      <div style={{ marginTop: "30px" }}>
        <h2>Live Responses</h2>
        <ul style={{ fontSize: "24px" }}>
          {responses.map((r) => (
            <li key={r.id}>{r.name}: {r.guess}</li>
          ))}
        </ul>
        {responses.length === 0 && <p style={{ fontSize: "24px" }}>No responses yet</p>}
      </div>

      {result && (
        <div style={{ marginTop: "30px" }}>
          <h2>Results</h2>
          <p>Target (2/3 of avg): {result.target}</p>
          <p>
            Winner: {result.winner.name} (Guess: {result.winner.guess.toFixed(2)})
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
