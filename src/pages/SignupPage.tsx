import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, User, ShoppingBag, Phone } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

export function SignupPage() {
    const navigate = useNavigate();
    const { register, requestOTP } = useAuth();
    const [step, setStep] = useState<'role' | 'details' | 'otp'>('role');
    const [role, setRole] = useState<'BUYER' | 'SELLER' | null>(null);
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

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        otp: '',
    });

    const handleRoleSelect = (selectedRole: 'BUYER' | 'SELLER') => {
        setRole(selectedRole);
        setStep('details');
    };

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const parsed = phoneSchema.safeParse(formData.phone);
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message || 'Enter a valid phone number');
            return;
        }

        const normalizedPhone = normalizePhone(formData.phone);

        setIsLoading(true);
        const result = await requestOTP(normalizedPhone, 'REGISTRATION');

        if (result.success) {
            setStep('otp');
            if (result.otp) {
                setDevOtp(result.otp);
            }
        } else {
            setError(result.error || 'Failed to send OTP');
        }
        setIsLoading(false);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const parsed = phoneSchema.safeParse(formData.phone);
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message || 'Enter a valid phone number');
            return;
        }

        setIsLoading(true);

        const result = await register({
            phone: normalizePhone(formData.phone),
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email || undefined,
            role: role || 'BUYER',
            otp: formData.otp,
        });

        if (result.success) {
            navigate(role === 'SELLER' ? '/seller' : '/buyer');
        } else {
            setError(result.error || 'Registration failed');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Image */}
            <div className="hidden lg:flex w-1/2 bg-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-black/90 z-10" />
                <img
                    src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=2000"
                    alt="Growth"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="relative z-20 flex flex-col justify-center px-16 text-white h-full">
                    <div className="mb-6 inline-flex p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 w-fit">
                        <CheckCircle className="text-green-400 mr-2" />
                        <span className="font-bold">Trusted by 10,000+ Users</span>
                    </div>
                    <h1 className="text-5xl font-black mb-6 leading-tight">Start Your Journey <br /> with Confidence.</h1>
                    <p className="text-xl text-gray-300 max-w-md leading-relaxed">
                        Whether you're buying kicks or selling electronics, we ensure every shilling is safe.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md w-full">
                    <div className="text-center lg:text-left mb-10">
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Create Account 🚀</h2>
                        <p className="text-gray-500">Join SWIFTLINE today.</p>
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

                    {step === 'role' && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-300">
                            <p className="text-lg font-bold text-gray-900 mb-4">I want to...</p>

                            <button
                                onClick={() => handleRoleSelect('BUYER')}
                                className="w-full p-6 rounded-2xl border-2 border-gray-100 hover:border-green-500 hover:bg-green-50 transition text-left group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-green-700">Buy Safely</h3>
                                        <p className="text-sm text-gray-500">I want to shop without getting scammed.</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleRoleSelect('SELLER')}
                                className="w-full p-6 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition text-left group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-blue-700">Sell Securely</h3>
                                        <p className="text-sm text-gray-500">I want to build trust with customers.</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {step === 'details' && (
                        <form onSubmit={handleRequestOTP} className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="flex items-center gap-2 mb-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${role === 'BUYER' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {role === 'BUYER' ? 'Buyer Account' : 'Seller Account'}
                                </span>
                                <button type="button" onClick={() => setStep('role')} className="text-xs text-gray-500 hover:underline">Change</button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="tel"
                                        required
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition"
                                        placeholder="+254 7XX XXX XXX"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email (Optional)</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full text-white font-bold py-4 rounded-xl transition transform hover:scale-[1.02] flex items-center justify-center gap-2 ${role === 'BUYER' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
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
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleRegister} className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Enter OTP</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-black transition text-center text-2xl tracking-widest font-mono"
                                    placeholder="000000"
                                    value={formData.otp}
                                    onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || formData.otp.length !== 6}
                                className={`w-full text-white font-bold py-4 rounded-xl transition transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 ${role === 'BUYER' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Create Account <ArrowRight size={20} />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setStep('details'); setFormData({ ...formData, otp: '' }); setDevOtp(null); }}
                                className="w-full text-gray-600 hover:text-gray-900 text-sm font-semibold"
                            >
                                ← Back to details
                            </button>
                        </form>
                    )}

                    <div className="mt-8 text-center text-sm text-gray-500">
                        Already have an account?
                        <a href="/login" className="font-bold text-gray-900 hover:underline ml-1">Sign in here</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
