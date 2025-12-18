"use client";

import confetti from "canvas-confetti";
import React, { createRef } from "react";

import type { GlobalOptions } from "canvas-confetti";
import { Button } from "@/components/ui/button";

interface ConfettiButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    options?: GlobalOptions & {
        angle?: number;
    };
    children?: React.ReactNode;
}

export function ConfettiButton({ options, children, ...props }: ConfettiButtonProps) {
    const confettiButtonRef = createRef<HTMLButtonElement>();

    const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        confetti({
            ...options,
            origin: {
                x: x / window.innerWidth,
                y: y / window.innerHeight,
            },
        });
    };

    return (
        <Button ref={confettiButtonRef} onClick={onClick} {...props}>
            {children}
        </Button>
    );
}

export function triggerConfettiFireworks() {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
    }, 250);
}
