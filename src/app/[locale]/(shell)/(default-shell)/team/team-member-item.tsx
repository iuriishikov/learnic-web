'use client';

import { motion, useReducedMotion } from 'motion/react';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

type TeamMemberItemProps = {
  name: string;
  role: string;
  imageUrl?: string;
  index: number;
};

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('');
}

export function TeamMemberItem({
  name,
  role,
  imageUrl,
  index,
}: TeamMemberItemProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      className="flex flex-col items-center text-center"
    >
      <Avatar className="size-24">
        <AvatarImage src={imageUrl} alt={name} />
        <AvatarFallback className="text-xl">{initialsOf(name)}</AvatarFallback>
      </Avatar>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{name}</h3>
      <p className="mt-1 text-base text-brand">{role}</p>
    </motion.div>
  );
}
