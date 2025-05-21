import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch } from "../../hooks/redux-hooks";
import { setUser } from "../../store/auth-slice";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    
    try {
  
      setTimeout(() => {
       
        const mockUsers = [
          { id: "123", email: "test@example.com", password: "password123", role: "user" },
        ];
        
        const user = mockUsers.find(
          (u) => u.email === formData.email && u.password === formData.password
        );
        
        if (user) {
          const userData = {
            id: user.id,
            email: user.email,
            role: user.role,
          };
          
          localStorage.setItem("user", JSON.stringify(userData));
          
          dispatch(setUser(userData));
          
          navigate("/home");
        } else {
          setError("Incorrect username or password");
        }
      }, 1000);
    } catch (err) {
      setError("An error occurred during the login process. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
              className="mt-1 w-full p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-[#7B7EF4] focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-indigo-200">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full p-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-[#7B7EF4] focus:border-transparent"
              required
            />
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