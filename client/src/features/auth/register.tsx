import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch } from "../../hooks/redux-hooks";
import { setUser } from "../../store/auth-slice";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
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
    
    // בדיקות בסיסיות לטופס
    if (!formData.email || !formData.password) {
      setError("נא למלא את כל השדות");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    
    setLoading(true);
    
    try {
      setTimeout(() => {
        const newUser = {
          id: Math.random().toString(36).substr(2, 9),
          email: formData.email,
          role: "user",
        };
        localStorage.setItem("user", JSON.stringify(newUser));
        dispatch(setUser(newUser));
        navigate("/home");
      }, 1000);
    } catch (err) {
      setError("אירעה שגיאה בתהליך ההרשמה. נסה שנית.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">הרשמה ל-Visual.AI</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">דואר אלקטרוני</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">סיסמה</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">אימות סיסמה</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white py-2 rounded-lg transition ${
              loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "מבצע רישום..." : "הרשמה"}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            כבר יש לך חשבון?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              התחבר כאן
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;