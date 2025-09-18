import React, { useState } from "react";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import FormField from "../components/ui/FormField.jsx";

export default function RegisterTenant() {
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
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/tenants/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Registration failed");
      setMessage("✅ Registered. You can now log in as the admin.");
    } catch (e) {
      setMessage("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Register Tenant & Admin</h2>
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
              <Input id="password" type="password" value={form.password} onChange={(e) => {
                const v = e.target.value; setForm({ ...form, password: v });
                let s = 0; if (v.length >= 8) s++; if (/[A-Z]/.test(v)) s++; if (/[a-z]/.test(v)) s++; if (/[0-9]/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++; setStrength(s);
                const m = []; if (v && v.length < 8) m.push('8+ chars'); if (v && !/[A-Z]/.test(v)) m.push('uppercase'); if (v && !/[a-z]/.test(v)) m.push('lowercase'); if (v && !/[0-9]/.test(v)) m.push('number'); if (v && !/[^A-Za-z0-9]/.test(v)) m.push('special'); setHint(m.length?`Missing: ${m.join(', ')}`:'Looks good');
              }} required />
              <div className="h-2 bg-gray-200 rounded mt-2">
                <div className={`h-2 rounded ${strength <= 2 ? 'bg-red-500' : strength === 3 ? 'bg-yellow-500' : strength === 4 ? 'bg-blue-500' : 'bg-green-600'}`} style={{ width: `${(strength/5)*100}%` }} />
              </div>
              {form.password && <div className="text-xs text-gray-600 mt-1">{hint}</div>}
            </FormField>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Registering..." : "Register"}</Button>
            {message && <div className="text-sm text-gray-600">{message}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}


