import { useEffect, useState } from "react";
import { faker } from "@faker-js/faker";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// For demo purposes. In a real app, you'd have real user data.
const NAME = getOrSetFakeName();

export default function App() {
  // const messages = [
  //   { _id: "1", user: "Alice", body: "Good morning!" },
  //   { _id: "2", user: NAME, body: "Beautiful sunrise today" },
  // ];
  const messages = useQuery(api.chat.getMessages);

  const sendMessage = useMutation(api.chat.sendMessage);

  const [newMessageText, setNewMessageText] = useState("");

  // biome-ignore lint/correctness/useExhaustiveDependencies: Effect should run when messages change to scroll to bottom
  useEffect(() => {
    // Make sure scrollTo works on button click in Chrome
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 0);
  }, [messages]);

  return (
    <main className="chat">
      <header>
        <h1>Convex Chat2</h1>
        <p>
          Connected as <strong>{NAME}</strong>
        </p>
      </header>
      {messages?.map((message) => (
        <article
          key={message._id}
          className={message.user === NAME ? "message-mine" : ""}
        >
          <div>{message.user}</div>

          <p>{message.body}</p>
        </article>
      ))}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await sendMessage({ user: NAME, body: newMessageText });
          setNewMessageText("");
        }}
      >
        <input
          value={newMessageText}
          onChange={async (e) => {
            const text = e.target.value;
            setNewMessageText(text);
          }}
          placeholder="Write a message…"
        />
        <button type="submit" disabled={!newMessageText}>
          Send
        </button>
      </form>
    </main>
  );
}

export function getOrSetFakeName() {
  const NAME_KEY = "tutorial_name";
  const name = sessionStorage.getItem(NAME_KEY);
  if (!name) {
    const newName = faker.person.firstName();
    sessionStorage.setItem(NAME_KEY, newName);
    return newName;
  }
  return name;
}
