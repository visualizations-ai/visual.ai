import { useNavigate } from 'react-router-dom';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden">
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

      <div className="absolute top-14 left-0 right-0 h-[0.3px] bg-indigo-300/20 z-10" />

   
      <div className="flex flex-col items-center justify-center h-full px-4 pt-20 max-w-[1280px] mx-auto">
        <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-purple-400">
          Visual.AI
        </h1>
        <p className="text-xl text-indigo-200/90 max-w-2xl text-center mb-8">
          Manage your organization's resources with artificial intelligence
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/register')}
            className="px-6 py-2 bg-[#7B7EF4] text-white rounded-lg hover:bg-[#6B6EE4] transition-colors text-sm font-medium shadow-lg shadow-[#7B7EF4]/20"
          >
            Get Started
          </button>
          <button
            className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium border border-[#7B7EF4]/20"
          >
            Watch Demo
          </button>
        </div>
      </div>
    </div>
  );
};
