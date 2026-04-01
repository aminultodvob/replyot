import React from "react";

type Props = {
  children: React.ReactNode;
};

function layout({ children }: Props) {
  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-[#a1c4e6] via-[#dbe2ee] to-[#f4f7fb]" />
      <div className="fixed left-[-10%] top-[20%] -z-10 h-[600px] w-[600px] rounded-full bg-white/40 blur-[120px]" />
      <div className="fixed right-[-5%] top-[10%] -z-10 h-[500px] w-[600px] rounded-full bg-white/50 blur-[100px]" />
      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export default layout;
