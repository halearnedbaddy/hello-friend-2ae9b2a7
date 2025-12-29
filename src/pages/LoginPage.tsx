import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

export function LoginPage() {
    const navigate = useNavigate();
    const { login, requestOTP } = useAuth();
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [devOtp, setDevOtp] = useState<string | null>(null);

    const phoneSchema = z
        .string()
        .trim()
        .refine((val) => {
            const digits = val.replace(/\D/g, '');
            return digits.length >= 10 && digits.length <= 15;
        }, 'Enter a valid phone number');

    const normalizePhone = (val: string) => val.replace(/\D/g, '');

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const parsed = phoneSchema.safeParse(phone);
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message || 'Enter a valid phone number');
            return;
        }

        const normalizedPhone = normalizePhone(phone);

        setIsLoading(true);
        const result = await requestOTP(normalizedPhone, 'LOGIN');
        
        if (result.success) {
            setStep('otp');
            if (result.otp) {
                setDevOtp(result.otp); // For development only
            }
        } else {
            setError(result.error || 'Failed to send OTP');
        }
        setIsLoading(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const parsed = phoneSchema.safeParse(phone);
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message || 'Enter a valid phone number');
            return;
        }

        setIsLoading(true);
        const normalizedPhone = normalizePhone(phone);
        const result = await login(normalizedPhone, otp);

        if (result.success) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.role === 'SELLER') {
                navigate('/seller');
            } else if (user.role === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/buyer');
            }
        } else {
            setError(result.error || 'Login failed');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Image */}
            <div className="hidden lg:flex w-1/2 bg-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 to-black/90 z-10" />
                <img
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=2000"
                    alt="Secure Payment"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="relative z-20 flex flex-col justify-center px-16 text-white h-full">
                    <h1 className="text-5xl font-black mb-6 leading-tight">Secure Payments for <br /> Social Commerce.</h1>
                    <p className="text-xl text-gray-300 max-w-md leading-relaxed">
                        Join thousands of Kenyans buying and selling safely on Instagram, WhatsApp, and TikTok with SWIFTLINE Escrow.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md w-full">
                    <div className="text-center lg:text-left mb-10">
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome Back! 👋</h2>
                        <p className="text-gray-500">
                            {step === 'phone' ? 'Enter your phone number to receive OTP.' : 'Enter the OTP sent to your phone.'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {devOtp && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
                            <strong>Dev Mode:</strong> Your OTP is <code className="font-mono bg-yellow-100 px-2 py-1 rounded">{devOtp}</code>
                        </div>
                    )}

                    {step === 'phone' ? (
                        <form onSubmit={handleRequestOTP} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="tel"
                                        required
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition"
                                        placeholder="+254 7XX XXX XXX"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition transform hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Send OTP <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Enter OTP</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition text-center text-2xl tracking-widest font-mono"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || otp.length !== 6}
                                className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Sign In <ArrowRight size={20} />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setStep('phone'); setOtp(''); setDevOtp(null); }}
                                className="w-full text-gray-600 hover:text-gray-900 text-sm font-semibold"
                            >
                                ← Change phone number
                            </button>
                        </form>
                    )}

                    <div className="mt-8 text-center text-sm text-gray-500">
                        Don't have an account?
                        <a href="/signup" className="font-bold text-green-600 hover:text-green-700 ml-1">Create free account</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
