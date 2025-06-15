import { useNavigate } from 'react-router-dom';
import Logo from '../../assets/logo_lrg.svg';

export const LandingPage = () => {
 const navigate = useNavigate();

 return (
   <div className="h-screen bg-[#1e1b4b] text-white relative overflow-hidden">
     <div className="absolute top-2 right-6 flex space-x-2 rtl:space-x-reverse items-center z-10">
       <button
         onClick={() => navigate('/register')}
         className="px-4 py-2 bg-[#6342FD] hover:bg-[#5332ED] text-white rounded-xl transition-colors shadow-lg shadow-[#6342FD]/20 text-sm"
       >
         Sign up
       </button>
       <button
         onClick={() => navigate('/login')}
         className="px-4 py-2 border-2 border-white text-white hover:border-[#6342FD] hover:bg-white hover:text-[#6342FD] rounded-xl transition-all duration-300 text-sm"
       >
         Sign in
       </button>
     </div>

     <div className="flex flex-col items-center justify-center h-full px-4 pt-20 max-w-[1280px] mx-auto">
       <div className="absolute top-14 left-0 right-0 h-[0.3px] bg-indigo-300/20 z-10" />
       <div className="flex flex-col items-center">
         <img src={Logo} alt="Visual.AI Logo" className="w-40 h-40 -mb-2" />
         <h1
           style={{ fontFamily: 'Poppins, sans-serif' }}
           className="text-6xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[rgba(8,2,238,1)] to-[rgba(149,3,255,1)]"
         >
           Visual.AI
         </h1>
       </div>
       <div className="flex flex-col items-center space-y-8 mt-8">
         <p className="text-xl text-center max-w-xl bg-clip-text text-transparent bg-gradient-to-r from-[rgba(8,2,238,1)] to-[rgba(149,3,255,1)]">
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