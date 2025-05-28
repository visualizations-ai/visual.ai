import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux-hooks";
import { registerUser, clearError } from "../../store/auth-slice";
import {  Info, CheckCircle2 } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { loading, error, isAuthenticated } = useAppSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

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

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      return;
    }
    
    dispatch(registerUser({
      email: formData.email,
      password: formData.password
    }));
  };

  // Password validation checks
  const hasMinLength = formData.password.length >= 7;
  const hasLowercase = /[a-z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== "";
  const passwordMismatch = formData.confirmPassword !== "" && formData.password !== formData.confirmPassword;

  const inputClass = "mt-1 w-full p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-[#7B7EF4] focus:border-transparent autofill:bg-slate-900/50 autofill:text-white autofill:shadow-[inset_0_0_0px_1000px_rgba(15,23,42,0.5)]";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl shadow-indigo-500/10 w-full max-w-md border border-indigo-400/20">
        <h1 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-purple-400">Register to Visual.AI</h1>
   
        {error && !passwordMismatch && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4 flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
            </div>
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
              disabled={loading}
              style={{
                WebkitBoxShadow: "0 0 0 1000px rgba(15, 23, 42, 0.5) inset", 
                WebkitTextFillColor: "white"
              }}
              dir="ltr"
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
                minLength={7}
                disabled={loading}
                style={{
                  WebkitBoxShadow: "0 0 0 1000px rgba(15, 23, 42, 0.5) inset", 
                  WebkitTextFillColor: "white"
                }}
                dir="ltr"
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={loading}
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
            
            {/* Password requirements - show only unfulfilled requirements */}
            {formData.password && (
              <div className="mt-2 space-y-1">
                {!hasMinLength && (
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <Info size={12} />
                    <span>At least 7 characters</span>
                  </div>
                )}
                {!hasLowercase && (
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <Info size={12} />
                    <span>At least one lowercase letter</span>
                  </div>
                )}
                {!hasNumber && (
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <Info size={12} />
                    <span>At least one number</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-indigo-200">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClass}
                required
                minLength={7}
                disabled={loading}
                style={{
                  WebkitBoxShadow: "0 0 0 1000px rgba(15, 23, 42, 0.5) inset", 
                  WebkitTextFillColor: "white"
                }}
                dir="ltr"
              />
              <button 
                type="button" 
                onClick={toggleConfirmPasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={loading}
              >
                {showConfirmPassword ? (
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
            
            {formData.confirmPassword && (
              <div className={`mt-2 flex items-center gap-2 text-xs ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                {passwordsMatch ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading || !formData.email || !formData.password || !formData.confirmPassword || passwordMismatch}
            className={`w-full text-white py-2 rounded-lg transition ${
              loading || !formData.email || !formData.password || !formData.confirmPassword || passwordMismatch
                ? "bg-[#7B7EF4]/50 cursor-not-allowed" 
                : "bg-[#7B7EF4] hover:bg-[#6B6EE4]"
            } shadow-lg shadow-[#7B7EF4]/20`}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-indigo-200/80">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;