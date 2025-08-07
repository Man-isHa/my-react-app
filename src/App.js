import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  setDoc,
  doc,
  onSnapshot,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

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

const App = () => {
  const [name, setName] = useState("");
  const [guess, setGuess] = useState("");
  const [responses, setResponses] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [clientId] = useState(() => uuidv4());

  const currentUrl = "https://man-isha.github.io/my-react-app";

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "responses"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log("Live Firestore responses:", data);
        setResponses(data);
      },
      (error) => {
        console.error("Error listening to Firestore:", error);
      }
    );
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Name cannot be empty");
      return;
    }

    const parsedGuess = parseFloat(guess);
    if (isNaN(parsedGuess) || parsedGuess < 1 || parsedGuess > 100) {
      alert("Guess must be a number between 1 and 100");
      return;
    }

    try {
      await setDoc(doc(db, "responses", clientId), {
        name: name.trim(),
        guess: parsedGuess,
        timestamp: new Date(),
      });
      console.log("Successfully submitted:", name, parsedGuess);
      setSubmitted(true);
      setGuess("");
    } catch (error) {
      console.error("Error writing to Firestore:", error);
      alert("Failed to submit. Please try again.");
    }
  };

  const handleComplete = () => {
    if (responses.length === 0) return;
    const guesses = responses.map((r) => r.guess);
    const avg = guesses.reduce((a, b) => a + b, 0) / guesses.length;
    const target = (2 / 3) * avg;
    let winner = responses[0];
    let minDiff = Math.abs(responses[0].guess - target);
    for (let i = 1; i < responses.length; i++) {
      const diff = Math.abs(responses[i].guess - target);
      if (diff < minDiff) {
        minDiff = diff;
        winner = responses[i];
      }
    }
    alert(`Average: ${avg.toFixed(2)} | 2/3 Avg: ${target.toFixed(2)} | Winner: ${winner.name} with guess ${winner.guess}`);
  };

  const handleResetResponses = async () => {
    const querySnapshot = await getDocs(collection(db, "responses"));
    const deletions = querySnapshot.docs.map((docSnap) => deleteDoc(doc(db, "responses", docSnap.id)));
    await Promise.all(deletions);
    alert("All responses have been reset.");
  };

  return (
    <div style={{ padding: 40, fontSize: "1.5rem" }}>
      <h1>Guessing Game</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name: </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ fontSize: "1.2rem", marginRight: 10 }}
          />
        </div>
        <div>
          <label>Guess (1 - 100): </label>
          <input
            type="number"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            style={{ fontSize: "1.2rem", marginRight: 10 }}
          />
        </div>
        <button
          type="submit"
          disabled={submitted}
          style={{ fontSize: "1.2rem", marginTop: 20 }}
        >
          Submit
        </button>
      </form>

      <h2 style={{ marginTop: 40 }}>Scan to Submit</h2>
      <QRCode value={currentUrl} size={256} />

      <h2 style={{ marginTop: 40 }}>Live Responses</h2>
      <ul>
        {responses.map((res) => (
          <li key={res.id}>{res.name}: {res.guess}</li>
        ))}
      </ul>

      <button onClick={handleComplete} style={{ fontSize: "1.2rem", marginTop: 20 }}>
        Complete and Show Winner
      </button>

      <button onClick={handleResetResponses} style={{ fontSize: "1.2rem", marginTop: 20, marginLeft: 10 }}>
        Reset Responses
      </button>
    </div>
  );
};

export default App;
