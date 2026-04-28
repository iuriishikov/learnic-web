'use client';

import Image from 'next/image';
import { ArrowUpRightIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import { PLACEHOLDERS, type PlaceholderKey } from '@/shared/lib/placeholders';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Card } from '@/shared/ui/card';

export type BlogPostCardProps = {
  category: string;
  title: string;
  description: string;
  author: string;
  date: string;
  image: PlaceholderKey;
  avatar: string;
  index: number;
};

export function BlogPostCard({
  category,
  title,
  description,
  author,
  date,
  image,
  avatar,
  index,
}: BlogPostCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
      className="h-full"
    >
      <a
        href="#"
        className="group/post flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background rounded-xl"
      >
        <Card className="flex h-full flex-col gap-0 border-0 bg-transparent py-0 shadow-none ring-0">
          <div className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl bg-muted">
            <Image
              src={PLACEHOLDERS[image]}
              alt=""
              fill
              sizes="(min-width: 1024px) 384px, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 ease-out group-hover/post:scale-[1.03]"
            />
          </div>
          <div className="flex flex-1 flex-col gap-2 pt-6">
            <span className="text-sm font-semibold text-brand">
              {category}
            </span>
            <div className="flex items-start justify-between gap-6">
              <h3 className="text-xl font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover/post:text-brand">
                {title}
              </h3>
              <ArrowUpRightIcon
                aria-hidden
                className="mt-1 size-6 shrink-0 text-foreground transition-transform duration-300 group-hover/post:translate-x-0.5 group-hover/post:-translate-y-0.5"
              />
            </div>
            <p className="pt-1 text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="mt-auto flex items-center gap-3 pt-6">
            <Avatar>
              <AvatarFallback className="bg-brand/10 text-xs font-semibold text-brand">
                {avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {author}
              </span>
              <span className="text-sm text-muted-foreground">{date}</span>
            </div>
          </div>
        </Card>
      </a>
    </motion.div>
  );
}
