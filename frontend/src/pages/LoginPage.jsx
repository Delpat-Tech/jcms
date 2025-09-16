import { useState } from "react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import FormField from "../components/ui/FormField";
import { useToasts } from "../components/util/Toasts";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const { addToast } = useToasts() || { addToast: () => {} };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Logging in...");

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }

      setMessage("✅ Login successful!");
      addToast?.({ title: "Logged in", description: `Welcome ${data.user.username}` });
      console.log("User data:", data);
      
      // Save token and user data to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.user.role.toLowerCase());
      
      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      setMessage("❌ " + err.message);
      addToast?.({ title: "Login failed", description: err.message, variant: "error" });
    }
  };

  return (
    <div className="flex justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-md border bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900">JCMS Login</h2>
        <FormField label="Username" htmlFor="username">
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Enter username" />
        </FormField>
        <FormField label="Password" htmlFor="password">
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter password" />
        </FormField>
        <Button type="submit" className="w-full">Login</Button>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </form>
    </div>
  );
}

export default Login;
