import { motion } from 'framer-motion';

const Blob = ({ color, size, top, left, delay }) => (
  <motion.div
    className="absolute blur-[100px] opacity-20 -z-10"
    animate={{
      x: [0, 50, -30, 0],
      y: [0, -40, 60, 0],
      scale: [1, 1.2, 0.9, 1],
    }}
    transition={{
      duration: 15,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    style={{
      backgroundColor: color,
      width: size,
      height: size,
      top: top,
      left: left,
      borderRadius: '50%',
    }}
  />
);

const Bubble = ({ size, left, top, delay, duration }) => (
  <motion.div
    className="absolute bg-white/30 rounded-full blur-[1px] -z-10"
    initial={{ opacity: 0, y: 100 }}
    animate={{ 
      opacity: [0, 0.5, 0],
      y: [-20, -500],
      x: [0, 20, -20, 0],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear"
    }}
    style={{
      width: size,
      height: size,
      left: `${left}%`,
      top: `${top}%`,
    }}
  />
);

export default function DecorativeBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-20">
      {/* Soft Animated Blobs */}
      <Blob color="var(--soft-pink)" size={400} top="-10%" left="-10%" delay={0} />
      <Blob color="var(--soft-blue)" size={500} top="50%" left="70%" delay={2} />
      <Blob color="var(--soft-lavender)" size={350} top="70%" left="10%" delay={4} />
      <Blob color="var(--accent)" size={450} top="10%" left="60%" delay={6} />

      {/* Floating Bubbles */}
      <Bubble size={40} left={10} top={90} delay={0} duration={25} />
      <Bubble size={60} left={80} top={80} delay={5} duration={30} />
      <Bubble size={30} left={40} top={95} delay={10} duration={20} />
      <Bubble size={50} left={60} top={85} delay={15} duration={35} />
      <Bubble size={25} left={25} top={70} delay={2} duration={22} />
      <Bubble size={45} left={75} top={60} delay={8} duration={28} />
    </div>
  );
}
