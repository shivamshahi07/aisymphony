"use client";
import { services } from "./services";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState, useRef } from 'react';
interface ServiceItem {
  id: number;
  title: string;
  Description: string;
  vid: string;
  source: string;
  btn: string;
}

export default function ServiceCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((item) => (
        <CardWithVideo key={item.id} item={item} />
      ))}
    </div>
  );
}

function CardWithVideo({ item }: { item: ServiceItem }) {
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current instanceof HTMLVideoElement) {
      videoRef.current.play().catch(error => console.error("Error playing video:", error));
    }
  };
  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current instanceof HTMLVideoElement) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <Card 
      className="flex flex-col"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
        <CardDescription>{item.Description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className={`transition-transform duration-300 ${isHovering ? 'scale-105' : ''}`}>
          <video
            ref={videoRef}
            loop
            muted
            className="w-full h-48 object-cover"
          >
            <source src={item.vid} type="video/mp4" />
          </video>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={item.source} className="w-full">
          <Button className="w-full">{item.btn}</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}