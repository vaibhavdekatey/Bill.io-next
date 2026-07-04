"use client";
import Silk from "@/components/Silk";
import CustomButton from "@/components/CustomButton";

const Landing = () => {
  return (
    <div className="bg-black min-h-screen w-full flex flex-col lg:flex-row text-white font-lexend p-6 lg:px-12 xl:px-[12em] gap-12 lg:gap-0">
      <div className="flex flex-col justify-between w-full lg:w-1/2 min-h-[70vh] lg:min-h-0 py-4 lg:py-0">
        <div className="w-20 md:w-28 h-fit ">
          <img
            className="w-full h-full"
            src="/bill.io_ico.svg"
            alt="Bill.io Icon"
          />
        </div>

        <div className="flex flex-col gap-y-8">
          <div className="w-60 md:w-80 h-fit">
            <img
              className="w-full h-full"
              src="/bill.io_full.svg"
              alt="Bill.io Logo"
            />
          </div>
          <h1 className="text-white font-thin text-4xl md:text-6xl tracking-tight">
            The Simplest Way to Quote <br className="hidden md:block" />
            and Invoice Your Clients.
          </h1>
          <h2 className="text-white/70 font-light leading-tight text-base md:text-lg tracking-wide w-full md:w-3/4">
            Bill.io is the all-in-one platform built for freelancers and
            agencies. Seamlessly manage clients, and automate your invoicing so
            you can focus on the work that actually matters.
          </h2>
          <div>
            <p className="text-white/70 ml-2 mb-1 tracking-wider font-light text-base">
              Get started Now!
            </p>
            <CustomButton title="Sign Up" href="/register" disabled={false} />
          </div>
          <div>
            <p className="text-white/70 ml-2 mb-1 tracking-wider font-light text-base">
              Already Registered?
            </p>
            <CustomButton title="Log In" href="/login" disabled={false} />
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 h-[50vh] lg:h-auto rounded-3xl lg:rounded-4xl overflow-hidden mt-8 lg:mt-0">
        <Silk />
      </div>
    </div>
  );
};

export default Landing;
