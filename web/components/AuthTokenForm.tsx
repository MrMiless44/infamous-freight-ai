import { useState } from "react";
import { setAuthToken, clearAuthToken, getAuthToken } from "../lib/apiClient";
import styles from "../styles/dashboardWidgets.module.css";

export function AuthTokenForm() {
  const [token, setToken] = useState(getAuthToken() || "");

  const handleSave = () => {
    setAuthToken(token.trim());
  };

  const handleClear = () => {
    clearAuthToken();
    setToken("");
  };

  return (
    <div className={styles.tipCard}>
      <div className={styles.progressMeta}>
        <span>Auth Token</span>
        <span className={styles.muted}>
          Stored locally for API calls
        </span>
      </div>
      <div className={styles.inputRow}>
        <input
          className={styles.input}
          type="text"
          placeholder="Bearer JWT or demo API key"
          value={token}
          onChange={e => setToken(e.target.value)}
        />
        <button className={styles.buttonSecondary} onClick={handleSave}>
          Save
        </button>
        <button className={styles.buttonSecondary} onClick={handleClear}>
          Clear
        </button>
      </div>
      <p className={styles.muted}>
        Tip: you can also run <code>window.setAuthToken(&apos;&lt;jwt&gt;&apos;)</code> in the console.
      </p>
    </div>
  );
}
