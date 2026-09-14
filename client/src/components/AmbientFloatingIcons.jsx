import React from 'react';
import { Terminal, Cpu, Database, Cloud, Code2, Sparkles, ShieldCheck, KeyRound, HardDrive } from 'lucide-react';

export default function AmbientFloatingIcons() {
  const floatingIcons = [
    {
      Icon: Terminal,
      top: "10%",
      left: "3%",
      size: "w-8 h-8 sm:w-10 sm:h-10",
      delay: "0s",
      anim: "animate-float-slow",
      opacity: "opacity-20 hover:opacity-40"
    },
    {
      Icon: Cpu,
      top: "22%",
      right: "4%",
      size: "w-9 h-9 sm:w-12 sm:h-12",
      delay: "1.2s",
      anim: "animate-float-delayed",
      opacity: "opacity-25 hover:opacity-40"
    },
    {
      Icon: Cloud,
      top: "45%",
      left: "2%",
      size: "w-10 h-10 sm:w-14 sm:h-14",
      delay: "2.4s",
      anim: "animate-float-slow",
      opacity: "opacity-15 hover:opacity-30"
    },
    {
      Icon: Database,
      top: "58%",
      right: "3%",
      size: "w-8 h-8 sm:w-11 sm:h-11",
      delay: "0.8s",
      anim: "animate-float-delayed",
      opacity: "opacity-20 hover:opacity-40"
    },
    {
      Icon: Code2,
      top: "75%",
      left: "4%",
      size: "w-8 h-8 sm:w-10 sm:h-10",
      delay: "1.8s",
      anim: "animate-float-slow",
      opacity: "opacity-20 hover:opacity-40"
    },
    {
      Icon: ShieldCheck,
      top: "88%",
      right: "5%",
      size: "w-9 h-9 sm:w-12 sm:h-12",
      delay: "3s",
      anim: "animate-float-delayed",
      opacity: "opacity-20 hover:opacity-40"
    }
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {floatingIcons.map((item, i) => {
        const IconComponent = item.Icon;
        return (
          <div
            key={i}
            className={`absolute ${item.size} text-purple-400/40 ${item.opacity} ${item.anim} transition-all duration-700`}
            style={{
              top: item.top,
              left: item.left,
              right: item.right,
              animationDelay: item.delay,
              willChange: 'transform'
            }}
          >
            <IconComponent className="w-full h-full" />
          </div>
        );
      })}
    </div>
  );
}
