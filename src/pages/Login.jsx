
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/Api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");
  const [setupStatus, setSetupStatus] = useState("checking");
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/auth/setup-status")
      .then(res => {
        if (active) {
          setMode(res.data?.setupComplete ? "login" : "register");
          setSetupStatus("ready");
        }
      })
      .catch(requestError => {
        if (active) {
          setStatusError(requestError.response?.data?.message || "Unable to reach the server. Check the backend connection and try again.");
          setSetupStatus("error");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function checkSetupStatus() {
    setSetupStatus("checking");
    setStatusError("");
    try {
      const res = await api.get("/auth/setup-status");
      setMode(res.data?.setupComplete ? "login" : "register");
      setSetupStatus("ready");
    } catch (requestError) {
      setStatusError(requestError.response?.data?.message || "Unable to reach the server. Check the backend connection and try again.");
      setSetupStatus("error");
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const setupAvailable = mode === "register";

    try {
      const res = setupAvailable
        ? await api.post("/auth/register", { email, password, displayName })
        : await api.post("/auth/login", { email, password });

      const token = res.data?.token;
      if (typeof token !== "string" || !token.trim()) {
        throw new Error("The login response did not include a token.");
      }

      localStorage.setItem("token", token);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.message || (
        setupAvailable ? "Unable to create the creator account." : "Invalid email or password."
      ));
    } finally {
      setLoading(false);
    }
  }

  const setupAvailable = mode === "register";

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-box">
        <div className="login-mode-switch" role="group" aria-label="Creator account action">
          <button
            type="button"
            className={!setupAvailable ? "selected" : ""}
            aria-label="Switch to login mode"
            aria-pressed={!setupAvailable}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={setupAvailable ? "selected" : ""}
            aria-label="Switch to create account mode"
            aria-pressed={setupAvailable}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Create account
          </button>
        </div>
        <h1>{setupAvailable ? "Create creator account" : "Creator Login"}</h1>
        <p>
          {setupAvailable
            ? "Create your own creator account. Each account has a private content workspace."
            : "Sign in to view and manage content belonging to your creator account."}
        </p>

        {setupStatus === "checking" && <p role="status">Checking creator account status...</p>}
        {setupStatus === "error" && (
          <div>
            <p className="error" role="alert">{statusError}</p>
            <button type="button" onClick={checkSetupStatus} disabled={loading}>Retry connection</button>
          </div>
        )}

        {setupAvailable && (
          <input
            type="text"
            placeholder="Creator name"
            autoComplete="name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            maxLength={100}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email address"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          autoComplete={setupAvailable ? "new-password" : "current-password"}
          value={password}
          onChange={e => setPassword(e.target.value)}
          minLength={setupAvailable ? 12 : undefined}
          required
        />

        {setupAvailable && <p>Use a unique email address. Passwords must be at least 12 characters.</p>}
        {error && <p className="error" role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : setupAvailable ? "Create account" : "Login"}
        </button>
      </form>
    </div>
  );
}
