"use client";

import React, { useEffect, useRef, useState } from "react";

interface RevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number; // ms
}

export function Reveal({ children, className = "", delay = 0 }: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target); // Trigger once
                }
            },
            {
                threshold: 0.1, // Trigger when 10% visible
                rootMargin: "0px 0px -50px 0px", // Offset slightly so it doesn't trigger at very bottom pixel
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div
            ref={ref}
            className={`animate-on-scroll ${isVisible ? "is-visible" : ""} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}
