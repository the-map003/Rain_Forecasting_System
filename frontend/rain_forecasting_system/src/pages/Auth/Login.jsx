import React, { useState, useContext } from 'react';
import { WiRain, WiDaySunny, WiCloudy, WiThunderstorm, WiRaindrops, WiCloudyGusts } from 'react-icons/wi';
import { FaMotorcycle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { IoMail  } from 'react-icons/io5';
import { RiLockPasswordLine } from 'react-icons/ri';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { validateEmail } from '../../utils/helper';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Add missing navigate hook
  const navigate = useNavigate();
  
  // You'll need to either:
  // 1. Import your user context: const { updateUser } = useContext(YourUserContext);
  // 2. Or create a simple updateUser function for now:
  const updateUser = (user) => {
    // Store user data in localStorage or context
    localStorage.setItem("user", JSON.stringify(user));
  };

  // Handle Login Form Submit
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Add loading state

    if(!validateEmail(email)){
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }
    if (!password){
      setError("Please enter the password");
      setIsLoading(false);
      return;
    }
    
    setError(""); // Clear previous errors

    try{
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });
      
      const { token, user } = response.data;

      // Fix the condition check
      if(token && user){
        localStorage.setItem("token", token);
        updateUser(user);
        navigate("/dashboard/admin");
      } else {
        setError("Invalid response from server");
      }
    } catch(error) {
      console.error('Login error:', error); // Add logging for debugging
      
      if(error.response && error.response.data && error.response.data.message){
        setError(error.response.data.message);
      } else if (error.response && error.response.status === 401) {
        setError("Invalid email or password");
      } else if (error.response && error.response.status >= 500) {
        setError("Server error. Please try again later");
      } else if (error.code === 'NETWORK_ERROR') {
        setError("Network error. Please check your connection");
      } else {
        setError("Something went wrong. Please try again");
      }
    } finally {
      setIsLoading(false); // Always reset loading state
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Weather Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Animated rain drops */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 bg-gradient-to-b from-blue-200 to-transparent opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                height: `${Math.random() * 100 + 20}px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 1 + 0.5}s`
              }}
            />
          ))}
        </div>
        
        {/* Floating weather elements */}
        <div className="absolute top-20 left-16 animate-float">
          <WiCloudy className="text-white/20 text-8xl" />
        </div>
        <div className="absolute top-40 right-24 animate-float-delayed">
          <WiRaindrops className="text-blue-300/30 text-6xl" />
        </div>
        <div className="absolute bottom-32 left-1/4 animate-float-slow">
          <WiThunderstorm className="text-purple-300/20 text-7xl" />
        </div>
        <div className="absolute top-1/3 right-1/4 animate-float">
          <WiCloudyGusts className="text-gray-300/15 text-9xl" />
        </div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-full max-w-md shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="flex justify-center items-center mb-6">
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-400 p-5 rounded-2xl shadow-2xl">
                  <div className="flex items-center space-x-2">
                    <WiRain className="text-white text-3xl animate-pulse" />
                    <FaMotorcycle className="text-white text-xl" />
                  </div>
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-400 rounded-2xl blur-xl opacity-50 -z-10"></div>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Rain Forecasting System
            </h1>
            <p className="text-blue-200 text-sm font-medium">
              Please Enter your details to log in
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">Email Address</label>
              <div className="relative">
                <IoMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" />
                <input
                  value={email}
                  onChange={({target}) => setEmail(target.value)}
                  placeholder="Enter your email"
                  type="email"
                  disabled={isLoading}
                  className="w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl pointer-events-none"></div>
              </div>
            </div>
            
            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">Password</label>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" />
                <input
                  value={password}
                  onChange={({target}) => setPassword(target.value)}
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  disabled={isLoading}
                  className="w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl pointer-events-none"></div>
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="text-red-300 mr-3 text-lg">⚠️</div>
                  <p className='text-red-200 text-sm font-medium'>{error}</p>
                </div>
              </div>
            )}
            
            {/* Login Button */}
            <button 
              type="submit"
              className={`w-full relative group bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 hover:from-blue-700 hover:via-sky-700 hover:to-cyan-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1 ${isLoading ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative z-10">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Connecting to Weather Network...
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Sign In</span>
                  </div>
                )}
              </div>
            </button>
          </form>

          {/* Sign Up Link */}
          <p className='text-center text-sm text-white/70 mt-6'>
            Don't have an account?{" "}
            <Link className='font-semibold text-blue-300 hover:text-blue-200 underline underline-offset-2 transition-colors' to="/signUp">
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-15px) rotate(1deg); }
          66% { transform: translateY(-10px) rotate(-1deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(-1deg); }
          66% { transform: translateY(-5px) rotate(1deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(2deg); }
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
          animation-delay: 3s;
        }
        
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
          animation-delay: 1s;
        }
        
        /* Rain animation */
        .absolute.w-0\\.5 {
          animation: rain linear infinite;
        }
        
        @keyframes rain {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
};

export default Login;