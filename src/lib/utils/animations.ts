import { Variants } from 'framer-motion';

// Fade in animation
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

// Slide up animation
export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
};

// Scale animation
export const scale: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

// Stagger children animation
export const stagger = (staggerChildren = 0.1): Variants => ({
  animate: {
    transition: {
      staggerChildren
    }
  }
});

// Page transition animation
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  },
  exit: {
    opacity: 0,
    y: 20
  }
};

// List item animation
export const listItem: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

// Modal animation
export const modal: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
};

// Card hover animation
export const cardHover: Variants = {
  initial: {
    y: 0
  },
  hover: {
    y: -5,
    transition: {
      type: 'spring',
      stiffness: 300
    }
  }
};

// Image zoom animation
export const imageZoom: Variants = {
  initial: {
    scale: 1
  },
  hover: {
    scale: 1.1,
    transition: {
      duration: 0.7,
      ease: 'easeOut'
    }
  }
};