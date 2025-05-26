import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch } from "../../hooks/redux-hooks";
import { setUser } from "../../store/auth-slice";
import { useMutation } from "@apollo/client";
import { LOGIN_MUTATION } from "../../graphql/auth";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // השימוש ב-Apollo useMutation hook
  const [loginUser, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      // כשה-mutation מצליח
      const userData = {
        id: data.loginUser.user.id,
        email: data.loginUser.user.email,
        role: "user" // אם צריך role, אפשר להוסיף לסכמה בשרת
      };
      
      dispatch(setUser(userData));
      navigate("/home");
    },
    onError: (error) => {
      // כשיש שגיאה
      setError(error.message || "Login failed");
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }
    
    // קריאה ל-GraphQL mutation
    try {
      await loginUser({
        variables: {
          email: formData.email,
          password: formData.password
        }
      });
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const inputClass = "mt-1 w-full p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-[#7B7EF4] focus:border-transparent autofill:bg-slate-900/50 autofill:text-white autofill:shadow-[inset_0_0_0px_1000px_rgba(15,23,42,0.5)]";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl shadow-indigo-500/10 w-full max-w-md border border-indigo-400/20">
        <h1 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-purple-400">Login to Visual.AI</h1>
        
        {error && (
          <div className="bg-red-900/50 border border-red-400/20 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-indigo-200">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              required
              style={{
                WebkitBoxShadow: "0 0 0 1000px rgba(15, 23, 42, 0.5) inset", 
                WebkitTextFillColor: "white"
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-indigo-200">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={inputClass}
                required
                style={{
                  WebkitBoxShadow: "0 0 0 1000px rgba(15, 23, 42, 0.5) inset", 
                  WebkitTextFillColor: "white"
                }}
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-300" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white py-2 rounded-lg transition ${
              loading ? "bg-[#7B7EF4]/50" : "bg-[#7B7EF4] hover:bg-[#6B6EE4]"
            } shadow-lg shadow-[#7B7EF4]/20`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-indigo-200/80">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;