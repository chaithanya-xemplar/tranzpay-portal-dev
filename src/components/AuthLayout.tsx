import type { ReactNode } from "react";
import Logo from "./Logo";
import Footer from "./Footer";
import mobileReceipt from "../assets/mobile-recipt.svg";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(224.69%_92.02%_at_39.48%_22.61%,_#E9F4F7_0%,_#E9F4F7_39.7%,_#B1D8E2_100%)]">
      {/* Logo */}
      <div className="absolute top-6 left-8 z-10">
        <Logo />
      </div>

      <div className="w-full flex flex-col md:flex-row items-stretch rounded-2xl overflow-hidden">
        {/* Left Section - Illustration */}
        <div className="w-1/2 items-center ml-4 justify-center hidden md:flex">
            <img
            src={mobileReceipt}
            alt="Authentication Illustration"
            className="max-h-[320px] md:max-h-[400px] lg:max-h-[480px] object-contain w-auto"
            />
        </div>

        {/* Right Section - Page Content */}
        <div className="w-full md:w-1/2 p-4 md:p-10 flex justify-center">
            <div className="flex-col w-full max-w-[440px] px-4 md:px-8 pt-8 pb-6 bg-white rounded-3xl">
                {children}
            </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AuthLayout;
