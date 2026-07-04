import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const CustomGoogleButton = () => {
  const { googleLogin } = useAuth();
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    try {
      await googleLogin(""); // No token needed for NextAuth
    } catch (err) {
      console.error("Google login failed", err);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => login()}
      className="flex flex-row gap-x-3 text-white cursor-pointer items-center justify-center w-full bg-[#0e0e0e] p-3 rounded-lg border border-neutral-800 hover:bg-white/80 hover:text-black transition-all duration-500 ease-in-out "
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google"
        className="w-6 h-6 group-hover:rotate-12 transition-transform"
      />
      <span className=" text-lg">
        {loading ? "Connecting..." : "Continue with Google"}
      </span>
    </button>
  );
};

export default CustomGoogleButton;
