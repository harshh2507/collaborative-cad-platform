import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  X,
} from "lucide-react";

function Login() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passwordValid =
    requirements.length &&
    requirements.uppercase &&
    requirements.lowercase &&
    requirements.number &&
    requirements.special;

  const handleGoogleLogin = () => {
    console.log("Google login clicked");
    // Later connect this to Google OAuth backend.
  };

  const handleAppleLogin = () => {
    console.log("Apple login clicked");
    // Later connect this to Apple OAuth backend.
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordValid) {
      setShowRequirements(true);
      return;
    }

    console.log("Login submitted");
    // Later connect this to:
    // POST /api/auth/login
  };

  return (
    <div className="login-page">

      {/* Background glow */}
      <div className="bg-glow glow-one"></div>
      <div className="bg-glow glow-two"></div>

      <div className="login-container">

        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <section className="project-visual">

          <div className="left-brand">
            <span className="logo-dot"></span>
            <span>3D ANNOTATE</span>
          </div>


          {/* =================================================
              ABSTRACT VISUAL (Replaces CAD)
          ================================================= */}

          <div className="abstract-background">
            <svg className="wave-bg" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Glowing Waves */}
              <path 
                d="M-10,35 C30,35 40,75 110,45" 
                fill="none" 
                stroke="url(#wave-grad-1)" 
                strokeWidth="1" 
                opacity="0.8" 
              />
              <path 
                d="M-10,40 C30,40 45,70 110,50" 
                fill="none" 
                stroke="url(#wave-grad-2)" 
                strokeWidth="0.5" 
                opacity="0.6" 
              />
              <path 
                d="M-10,30 C30,30 35,80 110,40" 
                fill="none" 
                stroke="url(#wave-grad-3)" 
                strokeWidth="0.3" 
                opacity="0.4" 
              />
              <defs>
                <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#472353" stopOpacity="0" />
                  <stop offset="50%" stopColor="#e07aff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#290042" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8700a9" stopOpacity="0" />
                  <stop offset="50%" stopColor="#d455ff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#472353" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="wave-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a500d0" stopOpacity="0" />
                  <stop offset="40%" stopColor="#e07aff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#1b002b" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Floating Orbs */}
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
            <div className="orb orb-4"></div>
          </div>


          {/* =================================================
              LEFT TEXT
          ================================================= */}

          <div className="project-info">

            <h1>
              Visualize.<br />
              Annotate.<br />
              Collaborate.
            </h1>

            <p>
              Explore 3D models, create precise annotations,
              assign engineering tasks and collaborate with
              your team in one workspace.
            </p>

          </div>


          {/* Bottom status */}

          <div className="project-status">

            <span className="status-dot"></span>

            <span>3D WORKSPACE</span>

            <span className="status-line"></span>

            <span>ONLINE</span>

          </div>

        </section>


        {/* =================================================
            RIGHT LOGIN SIDE
        ================================================= */}

        <section className="login-section">

          <div className="login-content">

            {/* =================================================
                WELCOME 
            ================================================= */}

            <div className="login-heading">

              <p className="welcome-text">
                WELCOME BACK!!!
              </p>

              <h2>
                Sign in to your workspace
              </h2>

              <p className="login-description">
                Continue working on your 3D projects and
                annotations.
              </p>

            </div>


            {/* =================================================
                LOGIN FORM
            ================================================= */}

            <form
              className="login-form"
              onSubmit={handleSubmit}
            >

              {/* Email */}

              <div className="input-group">

                <label htmlFor="email">
                  Email address
                </label>

                <div className="input-wrapper">

                  <Mail
                    className="input-icon"
                    size={18}
                  />

                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                  />

                </div>

              </div>


              {/* Password */}

              <div className="input-group password-group">

                <label htmlFor="password">
                  Password
                </label>

                <div className="input-wrapper">

                  <Lock
                    className="input-icon"
                    size={18}
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter your password"
                    value={password}
                    onFocus={() =>
                      setShowRequirements(true)
                    }
                    onChange={(e) => {
                      const value = e.target.value;

                      setPassword(value);

                      const isValid =
                        value.length >= 8 &&
                        /[A-Z]/.test(value) &&
                        /[a-z]/.test(value) &&
                        /[0-9]/.test(value) &&
                        /[!@#$%^&*(),.?":{}|<>]/.test(value);

                      setShowRequirements(!isValid);
                    }}
                    required
                  />

                  <button
                    type="button"
                    className="eye-button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>


                {/* Password popup */}

                {showRequirements && password.length > 0 && !passwordValid && (

                    <div className="password-popup">

                      <div className="popup-title">
                        Password requirements
                      </div>

                      <PasswordRequirement
                        valid={requirements.length}
                        text="At least 8 characters"
                      />

                      <PasswordRequirement
                        valid={requirements.uppercase}
                        text="One uppercase letter"
                      />

                      <PasswordRequirement
                        valid={requirements.lowercase}
                        text="One lowercase letter"
                      />

                      <PasswordRequirement
                        valid={requirements.number}
                        text="One number"
                      />

                      <PasswordRequirement
                        valid={requirements.special}
                        text="One special character"
                      />

                    </div>

                  )}

              </div>


              {/* Remember / Forgot */}

              <div className="login-options">

                <label className="remember">

                  <input type="checkbox" />

                  <span>
                    Remember me
                  </span>

                </label>

                <a
                  href="#"
                  className="forgot"
                >
                  Forgot password?
                </a>

              </div>


              {/* Login button */}

              <button
                type="submit"
                className="login-button"
              >

                <span>
                  Sign in
                </span>

                <ArrowRight size={19} />

              </button>

            </form>


            {/* =================================================
                SOCIAL LOGIN
            ================================================= */}

            <div className="login-divider">

              <span></span>

              <p>
                OR CONTINUE WITH
              </p>

              <span></span>

            </div>


            <div className="social-buttons">

              {/* Google */}

              <button
                type="button"
                className="social-button"
                onClick={handleGoogleLogin}
                aria-label="Continue with Google"
              >

                <svg
                  className="google-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M21.35 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.55 0-4.71-1.72-5.49-4.03H3.26v2.53A9.74 9.74 0 0 0 12 21.5z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.51 13.58A5.85 5.85 0 0 1 6.2 12c0-.55.11-1.09.31-1.58V7.89H3.26A9.5 9.5 0 0 0 2.25 12c0 1.48.35 2.88 1.01 4.11l3.25-2.53z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 6.39c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.44 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.74 5.39l3.25 2.53C7.29 8.11 9.45 6.39 12 6.39z"
                  />
                </svg>

              </button>


              {/* Apple */}

              <button
                type="button"
                className="social-button"
                onClick={handleAppleLogin}
                aria-label="Continue with Apple"
              >

                <svg
                  className="apple-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.79 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.12-.57 1.5-1.31 2.99-2.54 4.11l.01-.01zM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.34 4.5-3.74 4.25z"
                  />
                </svg>

              </button>

            </div>


            {/* =================================================
                CREATE ACCOUNT
            ================================================= */}

            <div className="register-text">

              <span>
                Don't have an account?
              </span>

              <Link to="/register">
                Create account
              </Link>

            </div>


            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="login-footer">

              <span>
                © 2026 3D Annotate
              </span>

              <div>
                <span>Privacy</span>
                <span>Support</span>
              </div>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}


/* =========================================================
   PASSWORD REQUIREMENT
========================================================= */

function PasswordRequirement({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  return (
    <div
      className={
        valid
          ? "requirement valid"
          : "requirement invalid"
      }
    >
      {valid ? (
        <Check size={15} />
      ) : (
        <X size={15} />
      )}
      <span>{text}</span>
    </div>
  );
}

export default Login;