import { useNavigate } from 'react-router-dom';
import Logo from '../../assets/logo_lrg.svg';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-[#1e1b4b] text-white relative overflow-hidden">
      <div className="absolute top-4 right-6 flex space-x-2 rtl:space-x-reverse items-center z-10">
        <button
          onClick={() => navigate('/register')}
          className="px-4 py-1.5 bg-[#7B7EF4] text-white rounded-lg hover:bg-[#6B6EE4] transition-colors text-xs font-medium shadow-lg shadow-[#7B7EF4]/20"
        >
          Sign up
        </button>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs font-medium border border-[#7B7EF4]/20"
        >
          Sign in
        </button>
      </div>

      <div className="flex flex-col items-center justify-center h-full px-4 pt-20 max-w-[1280px] mx-auto">
        <div className="absolute top-14 left-0 right-0 h-[0.3px] bg-indigo-300/20 z-10" />
        <div className="flex flex-col items-center">
          <img src={Logo} alt="Visual.AI Logo" className="w-32 h-32 mb-4" />
          <h1
            style={{ fontFamily: 'Poppins, sans-serif' }}
            className="text-6xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[rgba(8,2,238,1)] to-[rgba(149,3,255,1)]"
          >
            Visual.AI
          </h1>
        </div>
        <div className="flex flex-col items-center space-y-8">
          <p className="text-xl text-gray-300 text-center max-w-xl">
            Manage your organization's resources with artificial intelligence
          </p>

          <div className="flex gap-5">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-[#6342FD] hover:bg-[#5332ED] text-white rounded-xl transition-colors shadow-lg shadow-[#6342FD]/20"
            >
              Get Started
            </button>
            <button
              onClick={() => {}}
              className="px-8 py-3 border-2 border-white text-white hover:border-[#6342FD] hover:bg-white hover:text-[#6342FD] rounded-xl transition-all duration-300"
            >
              Watch Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
