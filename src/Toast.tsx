import { useEffect, useState } from "react";
import HandBox from "./HandBox";

export default function Toast() {
  const [msg, setMsg] = useState<{ text: string; id: number } | null>(null);

  useEffect(() => {
    let t = 0;
    const f = (e: Event) => {
      setMsg({ text: String((e as CustomEvent).detail), id: Date.now() });
      clearTimeout(t);
      t = window.setTimeout(() => setMsg(null), 3600);
    };
    window.addEventListener("archive:toast", f);
    return () => {
      window.removeEventListener("archive:toast", f);
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="toast-host" role="status" aria-live="polite">
      {msg && (
        <div className="toast" key={msg.id}>
          <HandBox seed={"toast" + msg.id} fill />
          {msg.text}
        </div>
      )}
    </div>
  );
}
