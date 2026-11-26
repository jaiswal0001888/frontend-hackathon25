
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    let users;

    try {
      users = JSON.parse(localStorage.getItem("users") || "[]");
    } catch {
      setError("Unable to read account details.");
      return;
    }

    const user = users.find(
      u =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password
    );

    if (!user) {
      setError("Invalid email or password. Please try again.");
      return;
    }

    localStorage.setItem("currentUser", JSON.stringify(user));

    if (remember) {
      localStorage.setItem("rememberUser", "true");
    } else {
      localStorage.removeItem("rememberUser");
    }

    navigate("/dashboard");
  }

  return (
    <div className="login-page">

      <div className="login-container">

        <div className="login-left">

          <div className="login-brand">
            <div className="login-logo">F</div>
            <h2>FileVault <span>Pro</span></h2>
          </div>

          <div className="login-intro">
            <span className="login-tag">YOUR SECURE DIGITAL WORKSPACE</span>

            <h1>All your files.<br />
              One secure place.</h1>

            <p>
              Store, organize and manage your important files
              with a simple and powerful workspace.
            </p>

            <div className="login-features">
              <div>
                <span>✓</span>
                Secure file management
              </div>

              <div>
                <span>✓</span>
                Easy file organization
              </div>

              <div>
                <span>✓</span>
                Quick access to your files
              </div>
            </div>
          </div>

          <div className="login-left-footer">
            © 2026 FileVault Pro. All rights reserved.
          </div>

        </div>

        <div className="login-right">

          <form className="login-form" onSubmit={handleLogin}>

            <div className="login-mobile-brand">
              <div className="login-logo">F</div>
              <h2>FileVault <span>Pro</span></h2>
            </div>

            <div className="login-heading">
              <span>WELCOME BACK</span>
              <h1>Sign in to your account</h1>
              <p>Enter your details to access your workspace.</p>
            </div>

            <label>Email Address</label>

            <div className="login-input">
              <span>✉</span>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <label>Password</label>

            <div className="login-input">
              <span>♙</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="login-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <span className="login-help">Secure login</span>
            </div>

            {error && (
              <div className="login-error">
                ⚠ {error}
              </div>
            )}

            <button type="submit" className="login-submit">
              Sign In <span>→</span>
            </button>

            <div className="login-divider">
              <span>NEW TO FILEVAULT?</span>
            </div>

            <p className="login-signup">
              Don't have an account?
              <Link to="/signup"> Create Account</Link>
            </p>

            <div className="login-security">
              <span>🔒</span>
              Your personal workspace awaits.
            </div>

          </form>

        </div>

      </div>

    </div>
  );
}

export default Login;
