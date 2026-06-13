/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Key, Sparkles, Disc, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuraLogo } from './AuraLogo';

export const AuthScreen: React.FC = () => {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    sendPhoneOTP,
    loginWithPhone,
    recoverPassword,
    loginAsGuest
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'phone'>('signin');
  
  // General Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  // Phone OTP State
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loadedOtp, setLoadedOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Recovery State
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Clear states on tab change
  const handleTabChange = (tab: 'signin' | 'signup' | 'phone') => {
    setActiveTab(tab);
    setErrorMsg(null);
    setOtpSent(false);
    setOtpCode('');
    setLoadedOtp('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || actionLoading) return;
    setErrorMsg(null);
    setActionLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('auth/operation-not-allowed')) {
        setErrorMsg('Email/Password provider is not enabled in your Firebase project. Please go to your Firebase Console > Authentication > Sign-in method, click "Add new provider", select "Email/Password" and enable it. Alternatively, sign in using Google.');
      } else {
        setErrorMsg(errMsg || 'Authorization failed. Please check your credentials.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !username.trim() || actionLoading) return;
    setErrorMsg(null);
    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters (auth/weak-password).');
      return;
    }
    setActionLoading(true);
    try {
      await registerWithEmail(email, username, password, phone || undefined);
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('auth/operation-not-allowed')) {
        setErrorMsg('Email/Password provider is not enabled in your Firebase project. Please go to your Firebase Console > Authentication > Sign-in method, click "Add new provider", select "Email/Password" and enable it. Alternatively, sign in using Google.');
      } else if (errMsg.includes('auth/weak-password')) {
        setErrorMsg('Firebase error: Password should be at least 6 characters.');
      } else {
        setErrorMsg(errMsg || 'Sign up failed. Please try a different email.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phone.trim() || otpLoading) return;
    setErrorMsg(null);
    setOtpLoading(true);
    try {
      const otp = await sendPhoneOTP(phone);
      setLoadedOtp(otp);
      setOtpSent(true);
    } catch (err: any) {
      setErrorMsg('Failed to send verification code. Please check standard format.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || actionLoading) return;
    setErrorMsg(null);
    setActionLoading(true);
    
    if (otpCode !== loadedOtp) {
      setErrorMsg('Incorrect code. Check verification log and try again.');
      setActionLoading(false);
      return;
    }

    try {
      await loginWithPhone(phone, otpCode);
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('auth/operation-not-allowed')) {
        setErrorMsg('Email/Password provider (used under-the-hood for passwordless login simulation) is not enabled in your Firebase project. Please enable Email/Password under Authentication > Sign-in method in your Firebase Console, or sign in using Google.');
      } else {
        setErrorMsg('OTP login failed.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim() || actionLoading) return;
    setErrorMsg(null);
    setRecoverySuccess(null);
    setActionLoading(true);
    try {
      await recoverPassword(recoveryEmail);
      setRecoverySuccess('A password recovery email has been sent down! Please verify your inbox.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Email not found in registered database.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen/90 flex flex-col justify-center px-6 py-12 relative overflow-hidden bg-[#000000] text-white md:max-w-lg md:mx-auto md:rounded-3xl md:shadow-2xl">
      {/* Background visual graphics */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-[#FF375F]/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-[#7C3AED]/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col">
        {/* Core title */}
        <div className="text-center mb-10 leading-normal flex flex-col items-center select-none animate-fade-in">
          <div className="mb-5 relative hover:scale-105 duration-300 transition-transform">
            <AuraLogo size={74} showBackground={true} />
            <Sparkles className="h-5 w-5 absolute -top-1.5 -right-1.5 text-yellow-300 fill-yellow-300 animate-pulse" />
          </div>
          <h1 className="text-3.5xl font-black tracking-tight bg-gradient-to-r from-white via-white to-[#D8A9C4] bg-clip-text text-transparent drop-shadow-sm font-sans mt-1">
            Aura Music
          </h1>
          <p className="text-[11px] text-[#FF375F] uppercase tracking-[0.25em] font-extrabold mt-2">Aesthetic Beat Streamer</p>
        </div>

        {/* Dynamic Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-250 text-xs font-semibold flex items-start gap-2.5 leading-snug">
            <AlertTriangle className="h-4 w-4 shrink-0 stroke-[2.5]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {recoverySuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-300 text-xs font-semibold flex items-start gap-2.5 leading-snug">
            <CheckCircle className="h-4 w-4 shrink-0 stroke-[2.5]" />
            <span>{recoverySuccess}</span>
          </div>
        )}

        {/* Tab switch row */}
        {!isRecovering && (
          <div className="flex bg-white/5 border border-white/5 p-1 rounded-2xl gap-1 mb-8">
            <button
              onClick={() => handleTabChange('signin')}
              className={`flex-1 rounded-xl py-2.5 text-xs font-extrabold uppercase tracking-widest cursor-pointer transition-all duration-300 ${
                activeTab === 'signin' ? 'bg-[#FF375F] text-white shadow-md' : 'text-white/50 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleTabChange('signup')}
              className={`flex-1 rounded-xl py-2.5 text-xs font-extrabold uppercase tracking-widest cursor-pointer transition-all duration-300 ${
                activeTab === 'signup' ? 'bg-[#FF375F] text-white shadow-md' : 'text-white/50 hover:text-white'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => handleTabChange('phone')}
              className={`flex-1 rounded-xl py-2.5 text-xs font-extrabold uppercase tracking-widest cursor-pointer transition-all duration-300 ${
                activeTab === 'phone' ? 'bg-[#FF375F] text-white shadow-md' : 'text-white/50 hover:text-white'
              }`}
            >
              OTP Code
            </button>
          </div>
        )}

        {/* Master panels switcher */}
        {isRecovering ? (
          /* Password recovery layout panel */
          <div className="space-y-6">
            <div className="text-center pb-2">
              <h2 className="text-lg font-bold">Recover Account</h2>
              <p className="text-xs text-white/50 mt-1">Enter your email credentials to reset your password code.</p>
            </div>
            
            <form onSubmit={handleRecovery} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3.5 text-sm font-semibold outline-none focus:border-[#FF375F] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full rounded-2xl bg-[#FF375F] hover:bg-[#FF375F]/90 py-3.5 font-extrabold text-sm tracking-wide disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {actionLoading ? 'Verifying email...' : 'Recover Password'} &rarr;
              </button>
            </form>

            <button
              onClick={() => {
                setIsRecovering(false);
                setErrorMsg(null);
                setRecoverySuccess(null);
              }}
              className="text-xs text-[#FF375F] hover:text-[#FF375F]/90 font-bold mx-auto block mt-4"
            >
              Back to Sign In
            </button>
          </div>
        ) : activeTab === 'signin' ? (
          /* Sign In layout panel */
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <input
                id="signin-email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3.5 text-sm font-semibold outline-none focus:border-[#FF375F] transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <input
                id="signin-password"
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3.5 text-sm font-semibold outline-none focus:border-[#FF375F] transition-colors"
              />
            </div>

            <button
              onClick={() => setIsRecovering(true)}
              type="button"
              className="text-xs text-[#FF375F] hover:text-[#FF375F]/90 font-bold ml-auto block mt-1"
            >
              Forgot Password?
            </button>

            <button
              id="signin-submit"
              type="submit"
              disabled={actionLoading}
              className="w-full rounded-2xl bg-[#FF375F] hover:bg-[#FF375F]/90 py-3.5 font-extrabold text-sm tracking-wide disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Logging In...' : 'Sign In'}
            </button>

            {/* Simulated Google Button */}
            <div className="relative py-4 border-t border-white/10 mt-6 text-center select-none">
              <span className="bg-[#000000] px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/12">or connect</span>
            </div>

            <button
              id="google-signin"
              type="button"
              onClick={loginWithGoogle}
              className="w-full rounded-2xl bg-white text-slate-950 font-black text-sm py-3.5 hover:bg-neutral-150 transform transition-transform cursor-pointer active:scale-98 flex items-center justify-center gap-2 shadow"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.68 14.93 1 12 1 7.35 1 3.37 3.68 1.44 7.6l3.77 2.92c.9-2.7 3.42-4.48 6.79-4.48z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.5-.2-2.27H12v4.51h6.43c-.27 1.44-1.09 2.66-2.31 3.48v2.9h3.71c2.17-2 3.42-4.94 3.42-8.32z" />
                <path fill="#FBBC05" d="M5.21 14.78C4.98 14.12 4.85 13.4 4.85 12.65c0-.75.13-1.47.36-2.13L1.44 7.6C.52 9.49 0 11.58 0 13.8s.52 4.31 1.44 6.2l3.77-2.92-1-.3z" fillRule="evenodd" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.71-2.9c-1.03.69-2.35 1.1-3.97 1.1-3.37 0-6.19-2.28-7.21-5.36L1.44 15.84C3.37 19.32 7.3 23 12 23z" />
              </svg>
              Google Sign-In
            </button>
          </form>
        ) : activeTab === 'signup' ? (
          /* Sign Up layout panel */
          <form onSubmit={handleSignUp} className="space-y-4.5">
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <input
                id="signup-username"
                type="text"
                required
                placeholder="Display Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3.5 text-sm font-semibold outline-none focus:border-[#FF375F] transition-colors"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <input
                id="signup-email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3.5 text-sm font-semibold outline-none focus:border-[#FF375F] transition-colors"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <input
                id="signup-phone"
                type="tel"
                placeholder="Mobile Number (Optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3.5 text-sm font-semibold outline-none focus:border-[#FF375F] transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <input
                id="signup-password"
                type="password"
                required
                placeholder="Secure Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3.5 text-sm font-semibold outline-none focus:border-[#FF375F] transition-colors"
              />
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={actionLoading}
              className="w-full rounded-2xl bg-[#FF375F] hover:bg-[#FF375F]/90 py-3.5 font-extrabold text-sm tracking-wide disabled:opacity-50 mt-4 cursor-pointer"
            >
              {actionLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        ) : (
          /* Phone OTP layout panel */
          <div className="space-y-4">
            <div className="text-center pb-2">
              <h3 className="text-[11px] uppercase tracking-widest text-[#FF375F] font-bold">Passwordless Login</h3>
              <p className="text-xs text-white/50 mt-0.5">Use your registered phone number to receive a secure auth code.</p>
            </div>

            {otpSent && (
              <div className="rounded-xl border border-[#FF375F]/30 bg-[#FF375F]/5 p-3 flex flex-col gap-1 text-xs select-none shadow">
                <span className="font-extrabold text-[#FF375F] uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <CheckCircle className="h-4.5 w-4.5" /> SMS SIMULATION LOG:
                </span>
                <p className="text-white/80 font-medium">Verification Code <span className="font-black text-[#FF375F] underline text-sm">{loadedOtp}</span> has been dispatched to {phone}. Input the digits below to authenticate.</p>
              </div>
            )}

            <div className="space-y-4.5">
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                <input
                  type="tel"
                  disabled={otpSent}
                  placeholder="+1 (555) 0192"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3.5 text-sm font-semibold outline-none focus:border-[#FF375F] transition-colors disabled:opacity-40"
                />
              </div>

              {!otpSent ? (
                <button
                  onClick={handleSendOTP}
                  disabled={otpLoading || !phone.trim()}
                  className="w-full rounded-2xl bg-[#FF375F] hover:bg-[#FF375F]/90 py-3.5 font-extrabold text-sm tracking-wide text-white disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {otpLoading ? 'Dispatching SMS...' : 'Request Auth Code'} &nbsp; <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4.5">
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="6-Digit Verification Code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 py-3.5 text-center font-black text-lg tracking-widest outline-none focus:border-[#FF375F] transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full rounded-2xl bg-[#FF375F] hover:bg-[#FF375F]/90 py-3.5 font-extrabold text-sm tracking-wide disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {actionLoading ? 'Authenticating...' : 'Verify & Enter'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                      setLoadedOtp('');
                    }}
                    className="text-xs text-[#FF375F] hover:text-[#FF375F]/90 font-bold mx-auto block mt-2"
                  >
                    Resend Code or Edit Number
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
        
        {/* Sandbox Guest Option */}
        {!isRecovering && (
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center">
            <p className="text-[10px] uppercase tracking-widest font-extrabold text-[#FF375F] mb-3.5">Bypass Auth</p>
            <button
              id="guest-instant-access"
              type="button"
              onClick={() => loginAsGuest('Aura Explorer')}
              className="w-full rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#FF375F] hover:from-[#7C3AED]/90 hover:to-[#FF375F]/90 text-white font-black text-sm py-3.5 cursor-pointer transform transition-transform active:scale-98 flex items-center justify-center gap-2.5 shadow-xl"
            >
              <Sparkles className="h-4.5 w-4.5 fill-current animate-pulse" />
              Enter Aura as Guest (Interactive Demo)
            </button>
            <p className="text-[10px] text-white/30 text-center mt-2.5 px-4 leading-relaxed">
              Skip registration and run fully in a local web sandbox. No configuration required!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
