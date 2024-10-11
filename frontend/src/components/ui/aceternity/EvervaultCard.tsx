"use client";
import { useMotionValue } from "framer-motion";
import React, { useState, useEffect } from "react";
import { useMotionTemplate, motion } from "framer-motion";
import { cn } from "../../../utils/cn";
import { Typography, Button, Avatar } from '@mui/material';
import useStyles from "./EvervaultCardStyles";

export const EvervaultCard = ({
  title,
  description,
  icon,
  image,
  onClick,
  className,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  image?: string;
  onClick: () => void;
  className?: string;
}) => {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");
  const classes = useStyles();

  useEffect(() => {
    let str = generateRandomString(3500);
    setRandomString(str);
  }, []);

  function onMouseMove({ currentTarget, clientX, clientY }: any) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    const str = generateRandomString(3500);
    setRandomString(str);
  }

  return (
    <div
      className={cn(
        "p-0.5 bg-transparent flex items-center justify-center w-full h-full relative",
        className
      )}
    >
      <div
        onMouseMove={onMouseMove}
        className="group/card rounded-3xl w-full h-full relative overflow-hidden bg-transparent flex flex-col items-center justify-between p-6"
      >
        <CardPattern
          mouseX={mouseX}
          mouseY={mouseY}
          randomString={randomString}
        />
        <div className="relative z-10 flex flex-col items-center justify-between h-full w-full">
          <div className="text-center flex-grow flex flex-col justify-center items-center">
            <Avatar className={classes.avatarIcon}>
              {image ? (
                <img src={image} alt={title} className="w-8 h-8 object-contain" />
              ) : icon}
            </Avatar>
            <Typography
              variant="h5"
              className="mt-4 mb-2 text-white highlighted-text"
              style={{
                minHeight: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <mark className={classes.markStyles}>
                {title}
              </mark>
            </Typography>
            <Typography
              variant="body2"
              className="text-white highlighted-text"
              style={{
                minHeight: '48px',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 1,
                textAlign: 'center',
              }}
            >
              <mark className={classes.markStyles}>
                {description}
              </mark>
            </Typography>
          </div>
          <Button
            variant="contained"
            color="primary"
            onClick={onClick}
            className="mt-4"
          >
            Go
          </Button>
        </div>
      </div>
    </div>
  );
};

function CardPattern({ mouseX, mouseY, randomString }: any) {
  let maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  let style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 rounded-2xl [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50"></div>
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500 to-blue-700 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500"
        style={style}
      />
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay group-hover/card:opacity-100"
        style={style}
      >
        <p className="absolute inset-x-0 text-xs h-full break-words whitespace-pre-wrap text-white font-mono font-bold transition duration-500">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};