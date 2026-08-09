import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Mail, ArrowRight, UserPlus, ShieldCheck, Layers, Zap, Terminal, Loader2, User } from 'lucide-react'
import toast from 'react-hot-toast'


export default function Register() {
  const [loader, setLoader] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const navigate = useNavigate()
  const authRoute = import.meta.env.VITE_AUTH_URL;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoader(true)
    try {
      const data = { name, email, password }
      const res = await fetch(`${authRoute}/auth/register`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)


      })
      const resData = await res.json();
      if (res.ok) {
        toast.success(resData.message);
        navigate('/login');

      } else {
        // Catches HTTP 400 BAD_REQUEST (e.g., e.getMessage() from Spring Boot)
        toast.error(resData.error || 'Registration failed');
      }

    } catch (error) {
      toast.error('Server unavailable. Please try again later.');

    } finally {
      setLoader(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-slate-950 font-sans text-slate-100 flex flex-col justify-between overflow-hidden p-6 lg:p-12">
      {/* Full-screen Background Grid & Ambient Lighting */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#4f46e5 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />
      <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Bar Header */}
      <header className="relative z-10 flex items-center justify-between w-full max-w-[90%] mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-sm bg-indigo-600 flex items-center justify-center font-mono font-bold text-white shadow-lg shadow-indigo-500/30">
            D
          </div>
          <span className="font-mono font-bold text-xl tracking-wider text-white">
            {'{'} Devboard {'}'}
          </span>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-mono text-indigo-400">
          PROVISIONING
        </span>
      </header>

      {/* Center Layout Grid */}
      <main className="relative z-10 my-auto py-10 w-full max-w-[90%] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

        {/* Left Section */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-md border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-mono text-indigo-300">
            <UserPlus className="h-3.5 w-3.5" /> ACCOUNT CREATION
          </div>

          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Streamlined Workflows for Engineering Teams
          </h1>

          <p className="text-slate-400 text-base lg:text-lg leading-relaxed max-w-2xl">
            Create an account to start assigning and managing tasks across isolated microservice contexts.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2 font-mono text-xs text-slate-300 max-w-lg">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 backdrop-blur-md">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Task Orchestration</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Secure Access</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 backdrop-blur-md">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Instant Assignment</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 backdrop-blur-md">
              <Terminal className="h-4 w-4 text-purple-400" />
              <span>Agile Task Tracking</span>
            </div>
          </div>
        </div>

        {/* Right Section: Floating Transparent Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-md rounded-2xl border border-slate-700/80 bg-[rgb(56, 69, 91)] p-8 lg:p-10 shadow-2xl shadow-slate-700/90 backdrop-blur-xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Create Developer Account</h2>
              <p className="mt-1 text-sm text-slate-400">Register a new user in the Auth Service</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="username"
                    className="w-full rounded-xl border border-slate-800/90 bg-slate-950/60 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@devboard.com"
                    className="w-full rounded-xl border border-slate-800/90 bg-slate-950/60 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-800/90 bg-slate-950/60 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loader}
                className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loader ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <span>Register User</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800/80 text-center">
              <p className="text-sm text-slate-400">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto font-mono text-xs text-slate-500 pt-6">
        DevBoard Workspace • Microservices Learning Project
      </footer>
    </div>
  )
}