// src/components/PetCardAI.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '~/contexts/themeContext';
import { Link } from 'react-router-dom';

interface PetCardAIProps {
  props: {
    id: number;
    name: string;
    species: string | null;
    type: string | null;
    age: number | null;
    gender: string;
    profile_picture: string | null;
    status: string;
    description: string;
    score?: number; // AI match score
  };
}

export default function PetCardAI({ props }: PetCardAIProps) {
  const { isDarkMode } = useTheme();

  const backgroundImage = props.profile_picture
    ? `url(${encodeURI(props.profile_picture)})`
    : 'url(/placeholder-pet.jpg)';

  return (
    <Link
      to={`/pet/${props.id}`}
      className="block w-full max-w-sm mx-auto"
    >
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        className="relative p-4 flex flex-col justify-end rounded-xl xl:rounded-2xl w-full h-96 bg-cover bg-center transition-all duration-300 cursor-pointer overflow-hidden"
        style={{
          backgroundImage,
          boxShadow: isDarkMode
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
            : '0 20px 25px -5px rgba(163, 163, 163, 0.4), 0 8px 10px -6px rgba(163, 163, 163, 0.4)',
        }}
      >
        {/* Match Score Badge - Top Left */}
        {props.score !== undefined && props.score > 0 && (
          <div data-cy="pet-match-score" className="absolute top-4 left-4 z-20">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="px-4 py-2 rounded-full text-sm font-medium bg-[#D97F3E] text-white flex items-center gap-1 shadow-lg"
            >
              <i className="ri-heart-fill"></i>
              {props.score}% Match
            </motion.div>
          </div>
        )}

        {/* Status Badge - Top Right */}
        <div className="absolute top-4 right-4 z-20">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium shadow-lg ${
              props.status === "available"
                ? "bg-green-500 text-white"
                : props.status === "pending"
                ? "bg-yellow-500 text-white"
                : "bg-gray-500 text-white"
            }`}
          >
            {props.status}
          </span>
        </div>

        {/* Overlay sombre en bas */}
        <div
          className="absolute inset-x-0 bottom-0 px-5 pb-8 pt-12 backdrop-blur-sm rounded-b-xl xl:rounded-b-2xl transition-colors duration-300"
          style={{
            background: isDarkMode
              ? 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)'
              : 'linear-gradient(to top, rgba(255,255,255,0.95), transparent)',
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <h2
                className="font-playfair text-2xl font-bold transition-colors duration-300"
                style={{ color: isDarkMode ? '#F5F3ED' : '#36332E' }}
              >
                {props.name}
              </h2>
              <span className="text-2xl">
                {props.species?.toLowerCase() === "dog" ? "🐕" : "🐈"}
              </span>
            </div>

            <div
              className="font-raleway text-sm flex gap-2 font-light mb-3 transition-colors duration-300"
              style={{ color: isDarkMode ? '#F7F5EA' : '#555' }}
            >
              {props.type && <span>{props.type}</span>}
              {props.type && props.age && <span>•</span>}
              {props.age && <span>{props.age} year{props.age > 1 ? 's' : ''}</span>}
              {(props.type || props.age) && <span>•</span>}
              <span className="capitalize">{props.gender}</span>
            </div>

            <p
              className="text-sm line-clamp-2 transition-colors duration-300"
              style={{ color: isDarkMode ? '#E5E1D9' : '#666' }}
            >
              {props.description || 'No description available.'}
            </p>
          </div>
        </div>

        {/* Hover overlay effect */}
        <div className="absolute inset-0 bg-black opacity-0 hover:opacity-20 transition-opacity duration-300 rounded-xl xl:rounded-2xl" />
      </motion.div>
    </Link>
  );
}