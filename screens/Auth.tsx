import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient'; // Cliente Supabase canônico em services/
import { AccessRole } from '../types'; // Tipos globais na raiz do projeto

interface AuthProps {
  onSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAccess = async (userId: string) => {
    const { data: userRecord, error: dbError } = await supabase
      .from('users')
      .select('sector, role')
      .eq('user_id', userId)
      .single();

    if (dbError) {
      console.error(dbError);
      return false;
    }

    if (!userRecord) return false;

    return userRecord.sector === AccessRole.REQUIRED_SECTOR || userRecord.role === AccessRole.REQUIRED_ROLE;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        if (data.user) {
          const hasAccess = await checkAccess(data.user.id);
          if (hasAccess) {
            onSuccess();
          } else {
            await supabase.auth.signOut();
            setError("Acesso negado. Permissão insuficiente.");
          }
        }

      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          setError("Cadastro realizado! Aguarde aprovação.");
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#F2F2F7]">
      {/* Background blobs for glassmorphism effect - Updated Colors */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-ios-primary/20 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-ios-secondary/20 blur-[100px] animate-pulse delay-1000"></div>

      <div className="w-full max-w-[400px] bg-white/70 backdrop-blur-3xl rounded-[32px] p-10 shadow-float border border-white/60 relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-ios-primary to-ios-secondary rounded-[24px] mx-auto flex items-center justify-center shadow-lg shadow-ios-primary/30 mb-6 transform rotate-3">
            <img
              src="https://wofipjazcxwxzzxjsflh.supabase.co/storage/v1/object/public/Media/Image/image-removebg-preview%20(2).png"
              alt="Gama Center Logo"
              className="w-14 h-14 object-contain brightness-0 invert"
            />
          </div>
          <h1 className="text-3xl font-bold text-ios-text tracking-tight">Gama Center</h1>
          <p className="text-ios-subtext text-sm font-medium mt-2">Health OS 26</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-1">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 px-5 rounded-2xl bg-white border border-gray-200 focus:border-ios-primary focus:ring-4 focus:ring-ios-primary/10 outline-none transition-all placeholder-gray-400 text-ios-text text-lg shadow-sm"
              placeholder="Email"
            />
          </div>
          <div className="space-y-1">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 px-5 rounded-2xl bg-white border border-gray-200 focus:border-ios-primary focus:ring-4 focus:ring-ios-primary/10 outline-none transition-all placeholder-gray-400 text-ios-text text-lg shadow-sm"
              placeholder="Senha"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-xs font-semibold rounded-2xl text-center border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-ios-text hover:bg-black text-white font-bold text-lg rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-sm font-medium text-ios-subtext hover:text-ios-primary transition-colors"
          >
            {isLogin ? 'Criar uma conta' : 'Voltar para login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;