import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  X,
} from "lucide-react";

function Register() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    setPassword(value);

    const isValid =
      value.length >= 8 &&
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /[0-9]/.test(value) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(value);

    setShowRequirements(!isValid);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordValid) {
      setShowRequirements(true);
      return;
    }

    console.log("Registration submitted");

    // Later connect to:
    // POST /api/auth/register
  };

  const handleGoogleRegister = () => {
    console.log("Google registration clicked");

    // Later connect Google OAuth
  };

  const handleAppleRegister = () => {
    console.log("Apple registration clicked");

    // Later connect Apple OAuth
  };

  return (
    <div className="register-page">

      {/* Background glow */}
      <div className="bg-glow register-glow-one"></div>
      <div className="bg-glow register-glow-two"></div>

      {/* =================================================
          REGISTER CONTAINER
      ================================================= */}

      <div className="register-container">

        <div className="register-content">

          {/* =================================================
              HEADING
          ================================================= */}

          <div className="register-heading">

            <p className="register-welcome">
              GET STARTED
            </p>

            <h1>
              Create your account
            </h1>

            <p className="register-description">
              Join your collaborative workspace and start
              working on 3D projects and annotations.
            </p>

          </div>


          {/* =================================================
              REGISTER FORM
          ================================================= */}

          <form
            className="register-form"
            onSubmit={handleSubmit}
          >

            {/* Username */}

            <div className="register-input-group">

              <label htmlFor="username">
                Username
              </label>

              <div className="register-input-wrapper">

                <User
                  className="register-input-icon"
                  size={18}
                />

                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  required
                />

              </div>

            </div>


            {/* Email */}

            <div className="register-input-group">

              <label htmlFor="register-email">
                Email address
              </label>

              <div className="register-input-wrapper">

                <Mail
                  className="register-input-icon"
                  size={18}
                />

                <input
                  id="register-email"
                  type="email"
                  placeholder="Enter your email"
                  required
                />

              </div>

            </div>


            {/* Password */}

            <div className="register-input-group password-group">

              <label htmlFor="register-password">
                Password
              </label>

              <div className="register-input-wrapper">

                <Lock
                  className="register-input-icon"
                  size={18}
                />

                <input
                  id="register-password"
                  type={
                    showPassword ? "text" : "password"
                  }
                  placeholder="Create a password"
                  value={password}
                  onFocus={() => {
                    if (!passwordValid) {
                      setShowRequirements(true);
                    }
                  }}
                  onChange={handlePasswordChange}
                  required
                />

                <button
                  type="button"
                  className="register-eye-button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>


              {/* Password requirements */}

              {showRequirements &&
                password.length > 0 &&
                !passwordValid && (

                  <div className="register-password-popup">

                    <div className="register-popup-title">
                      Password requirements
                    </div>

                    <RegisterRequirement
                      valid={requirements.length}
                      text="At least 8 characters"
                    />

                    <RegisterRequirement
                      valid={requirements.uppercase}
                      text="One uppercase letter"
                    />

                    <RegisterRequirement
                      valid={requirements.lowercase}
                      text="One lowercase letter"
                    />

                    <RegisterRequirement
                      valid={requirements.number}
                      text="One number"
                    />

                    <RegisterRequirement
                      valid={requirements.special}
                      text="One special character"
                    />

                  </div>

                )}

            </div>


            {/* Confirm Password */}

            <div className="register-input-group">

              <label htmlFor="confirm-password">
                Confirm password
              </label>

              <div className="register-input-wrapper">

                <Lock
                  className="register-input-icon"
                  size={18}
                />

                <input
                  id="confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm your password"
                  required
                />

                <button
                  type="button"
                  className="register-eye-button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>


            {/* Create Account */}

            <button
              type="submit"
              className="register-button"
            >

              <span>
                Create account
              </span>

              <ArrowRight size={19} />

            </button>

          </form>


          {/* =================================================
              DIVIDER
          ================================================= */}

          <div className="register-divider">

            <span></span>

            <p>
              OR CONTINUE WITH
            </p>

            <span></span>

          </div>


          {/* =================================================
              GOOGLE + APPLE
          ================================================= */}

          <div className="register-social-buttons">

            {/* Google */}

            <button
              type="button"
              className="register-social-button"
              onClick={handleGoogleRegister}
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

              <span>Google</span>

            </button>


            {/* Apple */}

            <button
              type="button"
              className="register-social-button"
              onClick={handleAppleRegister}
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

              <span>Apple</span>

            </button>

          </div>


          {/* =================================================
              LOGIN LINK
          ================================================= */}

          <div className="register-login-text">

            <span>
              Already have an account?
            </span>

            <Link to="/login">
              Sign in
            </Link>

          </div>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="register-footer">

            <span>
              © 2026 3D Annotate
            </span>

            <div>
              <span>Privacy</span>
              <span>Support</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   PASSWORD REQUIREMENT COMPONENT
========================================================= */

function RegisterRequirement({
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
          ? "register-requirement valid"
          : "register-requirement invalid"
      }
    >

      {valid ? (
        <Check size={15} />
      ) : (
        <X size={15} />
      )}

      <span>
        {text}
      </span>

    </div>
  );
}

export default Register;