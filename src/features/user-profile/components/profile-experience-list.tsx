'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';

import { ExperienceCard, type UserExperience } from '@/features/user-experiences';

type ProfileExperienceListProps = {
  experiences: UserExperience[];
};

const LIST_VARIANTS: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
};

export function ProfileExperienceList({
  experiences,
}: ProfileExperienceListProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.ul
      initial={reduceMotion ? false : 'hidden'}
      animate="visible"
      variants={LIST_VARIANTS}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      {experiences.map((experience) => (
        <motion.li key={experience.id} variants={ITEM_VARIANTS}>
          <ExperienceCard experience={experience} className="h-full" />
        </motion.li>
      ))}
    </motion.ul>
  );
}
