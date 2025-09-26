import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import FormField from "../components/ui/FormField.jsx";
import { tenantApi, authApi } from "../api";

export default function RegisterTenant() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    registrationCode: "",
    name: "",
    subdomain: "",
    username: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [strength, setStrength] = useState(0);
  const [hint, setHint] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    // client-side password check
    const v = form.password || '';
    const missing = [];
    if (v.length < 8) missing.push('8+ chars');
    if (!/[A-Z]/.test(v)) missing.push('uppercase');
    if (!/[a-z]/.test(v)) missing.push('lowercase');
    if (!/[0-9]/.test(v)) missing.push('number');
    if (!/[^A-Za-z0-9]/.test(v)) missing.push('special');
    if (missing.length) { setMessage('❌ Password requirements not met: ' + missing.join(', ')); setLoading(false); return; }
    try {
      const res = await tenantApi.register(form);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Registration failed");
      
      // Auto-login after successful registration
      const loginRes = await authApi.login({ username: form.username, password: form.password });
      const loginData = await loginRes.json();
      
      if (loginData.success) {
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        navigate('/dashboard');
      } else {
        setMessage("✅ Registered successfully. Please log in.");
      }
    } catch (e) {
      setMessage("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
          {/* Brand/Header */}
          <div className="text-center mb-8">
            <img src="/logo.png" alt="JCMS" className="h-14 mx-auto mb-4 object-contain" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your tenant</h2>
            <p className="text-gray-600">Set up your workspace and admin account</p>
          </div>

          {/* Login Link */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              Already have an account? <a href="/" className="text-indigo-600 hover:text-indigo-500 font-medium">Login here</a>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Registration Code (if required)" htmlFor="registrationCode">
              <Input id="registrationCode" value={form.registrationCode} onChange={(e) => setForm({ ...form, registrationCode: e.target.value })} placeholder="Optional" />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Tenant Name" htmlFor="name">
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </FormField>
              <FormField label="Subdomain" htmlFor="subdomain">
                <Input id="subdomain" value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value })} placeholder="e.g. acme" required />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Admin Username" htmlFor="username">
                <Input id="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              </FormField>
              <FormField label="Admin Email" htmlFor="email">
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </FormField>
            </div>

            <FormField label="Admin Password" htmlFor="password">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => {
                    const v = e.target.value; setForm({ ...form, password: v });
                    let s = 0; if (v.length >= 8) s++; if (/[A-Z]/.test(v)) s++; if (/[a-z]/.test(v)) s++; if (/[0-9]/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++;
                    setStrength(s);
                    const m = []; if (v && v.length < 8) m.push('8+ chars'); if (v && !/[A-Z]/.test(v)) m.push('uppercase'); if (v && !/[a-z]/.test(v)) m.push('lowercase'); if (v && !/[0-9]/.test(v)) m.push('number'); if (v && !/[^A-Za-z0-9]/.test(v)) m.push('special');
                    setHint(m.length?`Missing: ${m.join(', ')}`:'Looks good');
                  }}
                  required
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
              {form.password && (
                <>
                  <div className="h-2 bg-gray-200 rounded mt-2">
                    <div className={`${strength <= 2 ? 'bg-red-500' : strength === 3 ? 'bg-yellow-500' : strength === 4 ? 'bg-blue-500' : 'bg-green-600'} h-2 rounded`} style={{ width: `${(strength/5)*100}%` }} />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{hint}</div>
                </>
              )}
            </FormField>

            <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
            {message && <div className="text-sm text-gray-700">{message}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}




