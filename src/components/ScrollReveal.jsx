import { motion } from 'framer-motion';

export default function ScrollReveal({ children, delay = 0, direction = 'up' }) {
  const variants = {
    hidden: { 
      opacity: 0, 
      y: direction === 'up' ? 30 : direction === 'down' ? -30 : 0,
      x: direction === 'left' ? 30 : direction === 'right' ? -30 : 0
    },
    visible: { 
      opacity: 1, 
      y: 0,
      x: 0,
      transition: { 
        duration: 0.8, 
        delay: delay,
        ease: [0.22, 1, 0.36, 1] 
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={variants}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
