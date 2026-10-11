import { Metadata } from "next";
import SignupCard from "@/components/auth/signup-card";

export const metadata: Metadata = {
  title: "Sign Up - AccuBooks",
  description: "Create your AccuBooks account to manage your finances seamlessly.",
};

const COVER_IMAGE_URL =
  "https://ik.imagekit.io/jk9e7l2uo/klndlaa.jpg?updatedAt=1790339939632";

export default function SignupPage() {
  return (
    <main
      className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-end overflow-y-auto lg:overflow-hidden"
      style={{
        backgroundImage: `url("${COVER_IMAGE_URL}")`,
      }}
    >
      {/* Subtle overlay for aesthetic depth */}
      <div className="absolute inset-0 bg-slate-900/10 backdrop-brightness-[0.97]" />

      {/* Main Container */}
      <div className="relative z-10 w-full min-h-screen lg:h-screen flex items-center justify-center lg:justify-end px-4 py-4 sm:px-8 lg:px-14 xl:px-20">
        <SignupCard />
      </div>
    </main>
  );
}