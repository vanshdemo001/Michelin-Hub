"use client";

import { useEffect, useState } from "react";

export function PreparationTimer({ createdAt, estimatedTimeMinutes = 30, size = "lg" }: { createdAt: unknown, estimatedTimeMinutes?: number, size?: "sm" | "lg" }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(estimatedTimeMinutes * 60);

  useEffect(() => {
    if (!createdAt) return;

    // Convert Firestore Timestamp or Date to Date object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createdAtAny = createdAt as any;
    const startTime = createdAtAny?.toDate ? createdAtAny.toDate() : new Date(createdAtAny as string | number | Date);

    const updateTimer = () => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedSeconds(diffInSeconds);
      
      const totalSeconds = estimatedTimeMinutes * 60;
      const remaining = Math.max(0, totalSeconds - diffInSeconds);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdAt, estimatedTimeMinutes]);

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  
  let statusMessage = "Arriving shortly. Get ready for a treat!";
  let progressColor = "text-green-500";
  
  if (elapsedMinutes < 5) {
    statusMessage = "Order Received - Restaurant is confirming your bucket.";
    progressColor = "text-blue-500";
  } else if (elapsedMinutes < 15) {
    statusMessage = "Chef is preparing your hot & crispy order.";
    progressColor = "text-yellow-500";
  } else if (elapsedMinutes < 25) {
    statusMessage = "Order packed! Waiting for the delivery partner.";
    progressColor = "text-orange-500";
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  
  const totalSeconds = estimatedTimeMinutes * 60;
  const progressPercentage = Math.min(100, (elapsedSeconds / totalSeconds) * 100);

  if (size === "sm") {
    return (
      <div className="flex items-center gap-3 w-full bg-muted/30 p-2 rounded-lg mt-2">
        <div className="relative w-12 h-12 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" className="stroke-muted/30" strokeWidth="8" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="45"
              className={`stroke-current ${progressColor} transition-all duration-1000 ease-linear`}
              strokeWidth="8"
              fill="none"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * progressPercentage) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-extrabold tabular-nums tracking-tighter">
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold truncate ${progressColor}`}>{statusMessage}</p>
          <p className="text-[10px] text-muted-foreground truncate">Est. {estimatedTimeMinutes}m total</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 bg-background rounded-xl">
      <div className="relative w-48 h-48 mb-6">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            className="stroke-muted/30"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            className={`stroke-current ${progressColor} transition-all duration-1000 ease-linear`}
            strokeWidth="8"
            fill="none"
            strokeDasharray="283"
            strokeDashoffset={283 - (283 * progressPercentage) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold tabular-nums tracking-tighter">
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Remaining</span>
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="font-bold text-xl">{statusMessage}</h3>
        <p className="text-sm text-muted-foreground">
          Estimated delivery time: {estimatedTimeMinutes} minutes
        </p>
      </div>
    </div>
  );
}
