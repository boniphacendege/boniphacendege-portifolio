import React, { useEffect, useRef, useState, useCallback } from 'react';

export type ScrollRevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade' | 'none';

export interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
  staggerDelay?: number;
  delay?: number;
  duration?: number;
  distance?: number;
  direction?: ScrollRevealDirection;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  autoPlay?: boolean;
  autoPlayDelay?: number;
  as?: React.ElementType;
}

/**
 * ScrollReveal
 * Triggers smooth staggered fade-in entrance animations as users scroll content elements into view.
 * Supports autoPlay mode for timed introductions without requiring user scroll.
 * Dynamically coordinates sequential entrance timings for child elements with .stagger-child.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  stagger = true,
  staggerDelay = 75,
  delay = 0,
  duration = 750,
  distance = 26,
  direction = 'up',
  threshold = 0.08,
  rootMargin = '0px 0px -50px 0px',
  once = true,
  autoPlay = false,
  autoPlayDelay = 80,
  as: Component = 'div'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Apply sequential stagger delays to all child elements with .stagger-child class
  const applyStaggerDelays = useCallback(() => {
    const el = containerRef.current;
    if (!el || !stagger) return;

    const childrenList = el.querySelectorAll<HTMLElement>('.stagger-child');
    childrenList.forEach((child, index) => {
      // If user hasn't explicitly set inline transitionDelay, set staggered delay via CSS var
      if (!child.style.transitionDelay) {
        const itemDelay = delay + index * staggerDelay;
        child.style.setProperty('--stagger-delay', `${itemDelay}ms`);
      }
      if (duration) {
        child.style.setProperty('--stagger-duration', `${duration}ms`);
      }
      if (distance) {
        child.style.setProperty('--reveal-distance', `${distance}px`);
      }
    });
  }, [stagger, delay, staggerDelay, duration, distance]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    applyStaggerDelays();

    let timeoutId: number | undefined;

    // Optional 'auto-play' mode: triggers animations sequentially without requiring user scroll
    if (autoPlay) {
      timeoutId = window.setTimeout(() => {
        setIsVisible(true);
      }, autoPlayDelay);

      return () => {
        if (timeoutId) window.clearTimeout(timeoutId);
      };
    }

    // Check if element is already in viewport on mount (e.g. Hero section or scrolled state)
    const rect = el.getBoundingClientRect();
    const inViewport = rect.top < window.innerHeight && rect.bottom > 0;

    if (inViewport) {
      // Gentle RAF / microtask delay so initial CSS properties register before transitioning
      timeoutId = window.setTimeout(() => {
        setIsVisible(true);
      }, 40);

      if (once) {
        return () => {
          if (timeoutId) window.clearTimeout(timeoutId);
        };
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(entry.target);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(el);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [threshold, rootMargin, once, autoPlay, autoPlayDelay, applyStaggerDelays]);

  // Directional class
  const directionClass = direction && direction !== 'up' ? `reveal-from-${direction}` : '';

  const inlineStyles: React.CSSProperties = {
    ...(delay ? { transitionDelay: `${delay}ms` } : {}),
    ...(duration ? { ['--reveal-duration' as any]: `${duration}ms` } : {}),
    ...(distance ? { ['--reveal-distance' as any]: `${distance}px` } : {})
  };

  return (
    <Component
      ref={containerRef}
      className={`${stagger ? 'scroll-reveal-container' : 'scroll-reveal'} ${directionClass} ${
        isVisible ? 'is-visible' : ''
      } ${className}`.trim()}
      style={Object.keys(inlineStyles).length > 0 ? inlineStyles : undefined}
    >
      {children}
    </Component>
  );
};

/**
 * StaggerItem
 * Wraps individual content elements to receive cascading staggered fade-in delays.
 */
export interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
  delay?: number;
  direction?: ScrollRevealDirection;
  as?: React.ElementType;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className = '',
  index,
  delay,
  direction,
  as: Comp = 'div'
}) => {
  const inlineStyle: React.CSSProperties = {};
  if (typeof delay === 'number') {
    inlineStyle.transitionDelay = `${delay}ms`;
  } else if (typeof index === 'number') {
    inlineStyle.transitionDelay = `${index * 75 + 40}ms`;
  }

  const dirClass = direction ? `reveal-item-${direction}` : '';

  return (
    <Comp className={`stagger-child ${dirClass} ${className}`.trim()} style={inlineStyle}>
      {children}
    </Comp>
  );
};

/**
 * useScrollReveal
 * Custom hook for manual scroll reveal observation.
 */
export function useScrollReveal(options: { threshold?: number; rootMargin?: string } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const timer = window.setTimeout(() => setIsVisible(true), 40);
      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: options.threshold ?? 0.08,
        rootMargin: options.rootMargin ?? '0px 0px -50px 0px'
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return { ref, isVisible };
}
