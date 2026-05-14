import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  History as HistoryIcon, 
  Lightbulb, 
  LayoutDashboard, 
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Waves,
  Mail,
  Lock,
  ArrowRight,
  TrendingDown,
  Gift
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, collection, query, orderBy, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { 
  auth, 
  db, 
  signIn, 
  logOut as firebaseLogOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from './lib/firebase';
import { UserSettings, RainfallEntry, ViewState } from './types';
import { calculateWater, cn } from './lib/utils';
import WaterTank from './components/WaterTank';
import { motion, AnimatePresence } from 'motion/react';

const pageVariants = {
  initial: (direction: number) => ({
    opacity: 0, 
    rotateY: direction > 0 ? 110 : -110, 
    transformOrigin: direction > 0 ? "left center" : "right center",
    scale: 0.7,
    z: -400,
    filter: "blur(10px)"
  }),
  enter: { 
    opacity: 1, 
    rotateY: 0, 
    scale: 1,
    z: 0,
    filter: "blur(0px)",
    transition: { 
      duration: 1.1, 
      ease: [0.16, 1, 0.3, 1],
      opacity: { duration: 0.5 },
      filter: { duration: 0.6 }
    } 
  },
  exit: (direction: number) => ({
    opacity: 0, 
    rotateY: direction > 0 ? -110 : 110, 
    transformOrigin: direction > 0 ? "right center" : "left center",
    scale: 0.7,
    z: -400,
    filter: "blur(10px)",
    transition: { 
      duration: 0.8, 
      ease: [0.16, 1, 0.3, 1] 
    } 
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [entries, setEntries] = useState<RainfallEntry[]>([]);
  const [view, setView] = useState<ViewState>('loading');
  const [loading, setLoading] = useState(true);

  const views = ['dashboard', 'history', 'tips'];
  const [direction, setDirection] = useState(0);

  const handleNav = (newView: ViewState) => {
    const currentIndex = views.indexOf(view as string);
    const nextIndex = views.indexOf(newView as string);
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setView(newView);
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setView('auth');
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Fetch Settings & Entries
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    
    // Listen to user settings
    const unsubSettings = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as UserSettings);
        if (view === 'loading' || view === 'auth') setView('dashboard');
      } else {
        setView('setup');
      }
      setLoading(false);
    }, (err) => {
      console.error("Settings listener error:", err);
      // Gracefully handle permission denied if user doc doesn't exist yet
      if (err.code === 'permission-denied') {
        setView('setup');
        setLoading(false);
      }
    });

    // Listen to entries
    const entriesRef = collection(db, 'users', user.uid, 'entries');
    const q = query(entriesRef, orderBy('createdAt', 'desc'));
    const unsubEntries = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as RainfallEntry));
      setEntries(data);
    }, (err) => {
      console.error("Entries listener error:", err);
    });

    return () => {
      unsubSettings();
      unsubEntries();
    };
  }, [user]); // Removed view as dependency to avoid refresh on nav

  const handleSaveSettings = async (area: number, capacity: number) => {
    if (!user) return;
    const newSettings: UserSettings = {
      userId: user.uid,
      roofArea: area,
      tankCapacity: capacity
    };
    await setDoc(doc(db, 'users', user.uid), newSettings);
    setSettings(newSettings);
    setView('dashboard');
  };

  const handleAddEntry = async (amount: number) => {
    if (!user || !settings) return;
    const collected = calculateWater(settings.roofArea, amount);
    const entry = {
      amountMm: amount,
      waterCollected: collected,
      date: new Date().toISOString(),
      createdAt: Timestamp.now()
    };
    await addDoc(collection(db, 'users', user.uid, 'entries'), entry);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Waves className="w-16 h-16 text-olive" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans pb-24 overflow-x-hidden" style={{ perspective: '2000px' }}>
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-olive/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-olive/10 rounded-full blur-[150px]" />
        <div className="absolute top-[30%] right-[-20%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        {view === 'auth' && (
          <AuthView key="auth" />
        )}

        {view === 'setup' && (
          <motion.div key="setup" custom={direction} variants={pageVariants} initial="initial" animate="enter" exit="exit" className="w-full h-full origin-center">
            <SetupForm onSave={handleSaveSettings} initialData={settings} />
          </motion.div>
        )}

        {view === 'dashboard' && settings && (
          <motion.div key="dashboard" custom={direction} variants={pageVariants} initial="initial" animate="enter" exit="exit" className="w-full h-full origin-center">
            <Dashboard 
              settings={settings} 
              entries={entries} 
              onAddEntry={handleAddEntry}
              onOpenSettings={() => setView('setup')}
            />
          </motion.div>
        )}

        {view === 'history' && (
          <motion.div key="history" custom={direction} variants={pageVariants} initial="initial" animate="enter" exit="exit" className="w-full h-full origin-center">
            <HistoryView entries={entries} />
          </motion.div>
        )}

        {view === 'tips' && (
          <motion.div key="tips" custom={direction} variants={pageVariants} initial="initial" animate="enter" exit="exit" className="w-full h-full origin-center">
            <TipsView />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Bar */}
      {user && view !== 'setup' && (
        <nav className="fixed bottom-8 left-8 right-8 bg-white/70 backdrop-blur-3xl border border-white/50 rounded-[3rem] px-10 py-5 flex justify-between items-center z-50 shadow-[0_20px_50px_rgba(85,107,47,0.15)]">
          <NavButton active={view === 'dashboard'} icon={LayoutDashboard} label="Home" onClick={() => handleNav('dashboard')} />
          <NavButton active={view === 'history'} icon={HistoryIcon} label="Log" onClick={() => handleNav('history')} />
          <NavButton active={view === 'tips'} icon={Lightbulb} label="Tips" onClick={() => handleNav('tips')} />
          <button onClick={firebaseLogOut} className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-red-400 transition-colors">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-[8px] uppercase font-black tracking-[0.2em]">Off</span>
          </button>
        </nav>
      )}
    </div>
  );
}

function NavButton({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 outline-none relative group">
      <motion.div 
        animate={{ 
          scale: active ? 1.1 : 1,
          backgroundColor: active ? "rgba(85, 107, 47, 0.1)" : "rgba(85, 107, 47, 0)"
        }}
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
          active ? "text-olive" : "text-slate-400 group-hover:text-slate-600"
        )}
      >
        <Icon className={cn("w-6 h-6", active && "stroke-[2.5px]")} />
        {active && (
          <motion.div 
            layoutId="nav-dot"
            className="absolute -bottom-1 w-1 h-1 bg-olive rounded-full"
          />
        )}
      </motion.div>
      <span className={cn(
        "text-[8px] uppercase font-black tracking-[0.2em] transition-colors",
        active ? "text-olive" : "text-slate-400"
      )}>
        {label}
      </span>
    </button>
  );
}

function AuthView() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;
    setError('');
    setAuthLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message.includes('auth/invalid-credential') ? 'Invalid email or password' : err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (authLoading) return;
    setAuthLoading(true);
    setError('');
    try {
      await signIn();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-white relative overflow-hidden"
    >
      {/* Background blobs for Auth */}
      <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[100%] bg-olive/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-olive/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            className="w-20 h-20 bg-olive rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-olive/30"
          >
            <Waves className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-slate-900 mb-1">RainVault</h1>
          <p className="text-slate-500 font-medium tracking-tight">Personal Water Harvesting Vault</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          {error && <div className="p-3 bg-red-50 text-red-500 text-sm rounded-xl font-medium">{error}</div>}
          
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="email" placeholder="Email Address" required
              value={email} onChange={e => setEmail(e.target.value)}
              disabled={authLoading}
              className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:border-olive transition-all font-medium disabled:opacity-50"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="password" placeholder="Password" required
              value={password} onChange={e => setPassword(e.target.value)}
              disabled={authLoading}
              className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:border-olive transition-all font-medium disabled:opacity-50"
            />
          </div>

          <button 
            disabled={authLoading}
            className="w-full bg-olive text-white font-bold py-4 rounded-2xl shadow-xl shadow-olive/20 flex items-center justify-center gap-2 hover:bg-olive-dark transition-all disabled:opacity-50"
          >
            {authLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            {!authLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-xs uppercase font-black text-slate-400 bg-white px-4">Or continue with</div>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={authLoading}
          className="w-full bg-white border border-slate-200 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          {authLoading ? 'Connecting...' : 'Google Account'}
        </button>

        <p className="mt-8 text-center text-sm font-bold text-slate-500">
          {isSignUp ? 'Already have an account?' : 'New to Jal-Sanchay?'} 
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-olive ml-2 underline decoration-2 underline-offset-4">
            {isSignUp ? 'Log In' : 'Create One'}
          </button>
        </p>
      </div>
    </motion.div>
  );
}

function SetupForm({ onSave, initialData }: { onSave: (area: number, capacity: number) => Promise<void> | void, initialData: UserSettings | null }) {
  const [area, setArea] = useState(initialData?.roofArea?.toString() || '');
  const [capacity, setCapacity] = useState(initialData?.tankCapacity?.toString() || '');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="p-8 pt-16 max-w-md mx-auto min-h-screen bg-white"
    >
      <header className="mb-10 text-center">
        <div className="w-16 h-16 bg-lime-100 text-lime-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Droplets className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-slate-900">Configure System</h2>
        <p className="text-slate-500 font-medium">To calculate your collection accurately, we need some details.</p>
      </header>

      <div className="space-y-6">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Roof Area (Sq.Ft.)</label>
          <input 
            type="number" 
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full bg-transparent text-2xl font-black focus:ring-0 outline-none text-olive"
            placeholder="0"
          />
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Tank Capacity (Liters)</label>
          <input 
            type="number" 
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full bg-transparent text-2xl font-black focus:ring-0 outline-none text-olive"
            placeholder="0"
          />
        </div>

        <button 
          onClick={() => onSave(Number(area), Number(capacity))}
          disabled={!area || !capacity}
          className="w-full bg-olive text-white font-bold py-5 rounded-2xl shadow-2xl shadow-olive/20 hover:bg-olive-dark transition-all disabled:opacity-30 flex items-center justify-center gap-2"
        >
          Confirm Configuration
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

function Dashboard({ settings, entries, onAddEntry, onOpenSettings }: { settings: UserSettings, entries: RainfallEntry[], onAddEntry: (v: number) => Promise<void> | void, onOpenSettings : () => void }) {
  const [showEntry, setShowEntry] = useState(false);
  const [amount, setAmount] = useState('');

  const totalSaved = entries.reduce((sum, entry) => sum + entry.waterCollected, 0);
  const householdDays = Math.floor(totalSaved / 150);

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="p-6 pt-12 space-y-8 max-w-md mx-auto relative overflow-hidden"
    >
      {/* Decorative Background Blobs */}
      <div className="fixed top-[-10%] right-[-10%] w-64 h-64 bg-olive/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-[10%] left-[-10%] w-72 h-72 bg-lime-100/30 rounded-full blur-3xl pointer-events-none" />

      <motion.header variants={staggerItem} className="flex justify-between items-center relative z-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-[0.9]">Rain<br/><span className="text-olive">Vault</span></h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Harvesting Live</p>
          </div>
        </div>
        <button onClick={onOpenSettings} className="w-14 h-14 bg-white/80 backdrop-blur-md rounded-[2rem] flex items-center justify-center text-olive shadow-lg shadow-olive/5 border border-white/50 group active:scale-90 transition-all">
          <SettingsIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </motion.header>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <motion.div 
          variants={staggerItem}
          whileHover={{ y: -5, scale: 1.02 }}
          className="bg-gradient-to-br from-olive to-olive-dark p-6 rounded-[2.5rem] shadow-2xl shadow-olive/30 text-white relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
            <Waves className="w-12 h-12" />
          </div>
          <span className="text-[10px] uppercase font-black text-white/50 tracking-widest block mb-1">Total Liters</span>
          <span className="text-4xl font-black font-mono tracking-tighter">{totalSaved.toFixed(0)}</span>
        </motion.div>
        
        <motion.div 
          variants={staggerItem}
          whileHover={{ y: -5, scale: 1.02 }}
          className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-2 text-lime-100 group-hover:scale-110 transition-transform">
            <Gift className="w-12 h-12" />
          </div>
          <span className="text-[10px] uppercase font-black text-emerald-600 tracking-widest block mb-1">Impact</span>
          <span className="text-4xl font-black text-slate-900 tracking-tighter">{householdDays} <span className="text-xs text-slate-400 font-bold">Days</span></span>
        </motion.div>
      </div>

      <motion.div 
        variants={staggerItem}
        whileHover={{ y: -10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="bg-white/80 backdrop-blur-md py-12 rounded-[4rem] shadow-2xl shadow-olive/10 border border-white flex flex-col items-center relative overflow-hidden group"
      >
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-olive/5 rounded-full blur-2xl group-hover:bg-olive/10 transition-colors" />
        
        <WaterTank currentLiters={totalSaved % settings.tankCapacity} capacity={settings.tankCapacity} />
        
        <div className="mt-8 text-center px-8 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-olive/5 rounded-full mb-3">
             <div className="w-1.5 h-1.5 bg-olive rounded-full" />
             <span className="text-[10px] font-black text-olive uppercase tracking-widest">Storage Status</span>
          </div>
          <h3 className="font-black text-slate-900 text-2xl tracking-tighter">Reservoir Level</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed mt-1">
            Currently holding <span className="text-olive font-black">{((totalSaved % settings.tankCapacity) / settings.tankCapacity * 100).toFixed(0)}%</span> of total volume.
          </p>
          
          <button 
            onClick={onOpenSettings}
            className="mt-6 flex items-center gap-2 mx-auto text-[11px] font-black uppercase text-slate-400 hover:text-olive transition-colors tracking-[0.2em]"
          >
            <SettingsIcon className="w-3 h-3" />
            Calibration: {settings.tankCapacity}L
          </button>
        </div>
      </motion.div>

      <motion.div variants={staggerItem}>
        {!showEntry ? (
          <motion.button 
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => setShowEntry(true)}
            className="w-full bg-slate-900 text-white font-bold py-6 rounded-[2rem] shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-4 group transition-all"
          >
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-lg tracking-tight">Record Rainfall</span>
          </motion.button>
        ) : (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-olive p-8 rounded-[3rem] text-white shadow-2xl shadow-olive/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><Droplets className="w-24 h-24" /></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <span className="font-black uppercase tracking-[0.2em] text-[10px] text-white/50">Precipitation (mm)</span>
                <button onClick={() => setShowEntry(false)} className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Plus className="rotate-45 w-5 h-5" />
                </button>
              </div>
              <input 
                autoFocus
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent border-none p-0 text-6xl font-black focus:ring-0 outline-none text-white placeholder:text-white/20 text-center"
                placeholder="0.0"
              />
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (amount) {
                    onAddEntry(Number(amount));
                    setAmount('');
                    setShowEntry(false);
                  }
                }}
                className="w-full bg-white text-olive font-black py-5 mt-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
              >
                Verify & Store
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={staggerItem} className="pb-16">
         <div className="flex justify-between items-center mb-6 px-2">
           <h4 className="font-black text-slate-900 tracking-tight text-xl">Recent Activity</h4>
           <div className="w-20 h-1 bg-slate-100 rounded-full" />
         </div>
         <div className="space-y-4">
           {entries.slice(0, 3).map((entry, idx) => (
             <motion.div 
               key={entry.id} 
               whileHover={{ x: 5 }}
               className="flex items-center justify-between bg-white/60 backdrop-blur-sm p-6 rounded-[2.5rem] border border-white shadow-sm hover:shadow-md transition-shadow group"
             >
               <div className="flex items-center gap-5">
                 <div className="w-14 h-14 bg-olive/5 rounded-[1.5rem] flex items-center justify-center group-hover:bg-olive/10 transition-colors">
                    <Droplets className="w-6 h-6 text-olive" />
                 </div>
                 <div>
                   <div className="font-black text-slate-900 text-lg">{entry.amountMm}mm</div>
                   <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{new Date(entry.date).toLocaleDateString()}</div>
                 </div>
               </div>
               <div className="text-right">
                 <div className="font-black text-olive text-xl">+{entry.waterCollected.toFixed(0)}<span className="text-xs ml-0.5">L</span></div>
                 <div className="text-[10px] uppercase font-black text-slate-300 tracking-widest">Added</div>
               </div>
             </motion.div>
           ))}
         </div>
      </motion.div>
    </motion.div>
  );
}

function HistoryView({ entries }: { entries: RainfallEntry[] }) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTotal = entries
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.waterCollected, 0);

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="p-6 pt-12 space-y-6 max-w-md mx-auto"
    >
      <motion.header variants={staggerItem}>
        <h2 className="text-3xl font-black text-slate-900">Records</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">History Log</p>
      </motion.header>

      {/* Monthly Summary Card */}
      <motion.div 
        variants={staggerItem}
        whileHover={{ scale: 1.02 }}
        className="bg-olive p-8 rounded-[2.5rem] text-white shadow-2xl shadow-olive/10 flex items-center justify-between"
      >
        <div>
          <span className="text-[10px] uppercase font-black text-white/50 tracking-widest block mb-1">Monthly Report</span>
          <div className="text-4xl font-black mb-1">{monthlyTotal.toFixed(0)}<span className="text-lg ml-1">L</span></div>
          <div className="text-xs font-bold text-white/70 italic">Captured this month</div>
        </div>
        <div className="w-16 h-16 bg-white/20 rounded-[2rem] flex items-center justify-center">
          <TrendingDown className="w-8 h-8 text-white rotate-180" />
        </div>
      </motion.div>

      <div className="space-y-4 pb-12">
        {entries.map((entry) => (
          <motion.div 
            key={entry.id} 
            variants={staggerItem}
            whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 1)" }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center">
                <div className="text-2xl font-black text-olive">
                  {new Date(entry.date).getDate()}
                </div>
                <div className="text-[10px] text-slate-400 font-black uppercase">
                  {new Date(entry.date).toLocaleDateString(undefined, { month: 'short' })}
                </div>
              </div>
              <div className="w-px h-10 bg-slate-100"></div>
              <div>
                <div className="font-black text-slate-900">{entry.amountMm}mm</div>
                <div className="text-[10px] text-slate-400 font-black uppercase italic tracking-tighter">Rain Recorded</div>
              </div>
            </div>
            <div className="text-right">
               <div className="font-black text-slate-900 text-lg">{entry.waterCollected.toFixed(1)}L</div>
               <div className="text-[10px] uppercase font-black text-lime-600">Collected</div>
            </div>
          </motion.div>
        ))}
        {entries.length === 0 && (
          <motion.div variants={staggerItem} className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
            <Waves className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black tracking-tight text-xl">Cloudless Sky...<br/><span className="text-sm font-medium">No records found.</span></p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function TipsView() {
  const tips = [
    { title: "Gutter Health", content: "Inspect gutters monthly for leaks and debris to ensure maximum flow to your tank.", icon: Waves, color: "bg-blue-50 text-blue-600" },
    { title: "Soil Infiltration", content: "Redirect overflow to garden beds to recharge the groundwater naturally.", icon: Droplets, color: "bg-lime-50 text-lime-600" },
    { title: "UV Protection", content: "Ensure your tank is UV resistant or painted to prevent sunlight from breeding algae.", icon: LayoutDashboard, color: "bg-olive/10 text-olive" },
    { title: "Weekly Siphoning", content: "Self-cleaning siphons can help remove the biofilm that settles at the bottom.", icon: Gift, color: "bg-orange-50 text-orange-600" }
  ];

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="p-6 pt-12 space-y-6 max-w-md mx-auto"
    >
      <motion.header variants={staggerItem}>
        <h2 className="text-3xl font-black text-slate-900">Education</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Master Harvesting</p>
      </motion.header>

      <div className="space-y-4 pb-12">
        {tips.map((tip, idx) => (
          <motion.div 
            key={idx}
            variants={staggerItem}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 group hover:border-olive/20 transition-all"
          >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", tip.color)}>
              <tip.icon className="w-7 h-7" />
            </div>
            <h3 className="font-black text-slate-900 mb-2 text-2xl tracking-tight leading-none">{tip.title}</h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">{tip.content}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
