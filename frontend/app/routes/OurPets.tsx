import axios from "axios";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import PetCard from "~/components/petCard1";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import api from "~/api/client";

export type Pet = {
  id: number;
  name: string;
  species: string | null;
  type: string | null;
  age: number | null;
  gender: string;
  profile_picture: string | null;
  status: string;
  description: string;
};

export default function OurPets() {
  const [page, setPage] = useState(1);
  const petsPerPage = 12;

  const getPets = async (): Promise<Pet[]> => {
    try {
      console.log('🔍 ENV VAR:', import.meta.env.VITE_API_URL);
  console.log('🔍 Axios baseURL:', api.defaults.baseURL);
  console.log('🔍 Making request to:', `${api.defaults.baseURL}/api/pets`);
      console.log("🔍 API Base URL:", api.defaults.baseURL); // ADD THIS
    console.log("🔍 Full URL:", `${api.defaults.baseURL}/api/pets`); // ADD THIS
    
      const res = await api.get("/api/pets");
      console.log("✅ API Response SUCCESS:", res.data);
      console.log("Type of res.data:", typeof res.data);
      console.log("res.data.pets:", res.data.pets);
      
      // Handle different response structures
      if (Array.isArray(res.data)) {
        console.log("✅ Response is array directly");
        return res.data;
      } else if (res.data.pets && Array.isArray(res.data.pets)) {
        console.log("✅ Response has pets property");
        return res.data;
      } else if (res.data.data && Array.isArray(res.data.data)) {
        console.log("✅ Response has data property");
        return res.data;

      }
      
      console.error("❌ Unexpected response structure:", res.data);
      throw new Error("Invalid API response structure");
    } catch (err) {
      console.error("❌ API Error:", err);
      if (axios.isAxiosError(err)) {
        console.error("Error Response:", err.response?.data);
        console.error("Error Status:", err.response?.status);
        console.error("Error Message:", err.message);
      }
      throw err;
    }
  };

  const { data, isLoading, error } = useQuery<Pet[]>({
    queryKey: ["pets"],
    queryFn: getPets,
  });

  if (isLoading)
    return (
      <motion.div
        className="flex justify-center items-center h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="animate-spin rounded-full h-12 w-12 border-t-3 border-b-3 border-btnPrimary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    );

  if (error) {
    console.error("React Query error", error);
    return (
      <motion.div
        className="flex justify-center items-center h-screen"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div data-cy="network-error-message" className="text-btnPrimary font-bold text-3xl font-playfair">
          Error loading pets...
        </div>
      </motion.div>
    );
  }

  // pagination logic
  const start = (page - 1) * petsPerPage;
  const paginatedPets = data?.slice(start, start + petsPerPage);
  const totalPages = Math.ceil((data?.length ?? 0) / petsPerPage);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Stagger each child by 0.1s
        delayChildren: 0.2, // Start after 0.2s
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.8,
      rotateX: -15,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
        duration: 0.6,
      },
    },
    exit: {
      opacity: 0,
      y: -30,
      scale: 0.9,
      transition: {
        duration: 0.3,
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -30, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 120,
        damping: 10,
        duration: 0.8,
      },
    },
  };

  const paginationVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.5,
        type: "spring" as const,
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div
        className="text-3xl font-playfair font-bold text-center mt-4"
      >
        <span
          style={{
            background: "linear-gradient(90deg, #36332E, #D97F3E, #CCBFB1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Our Pets
        </span>
      </div>

      <div

        className="font-raleway text-md text-center mt-2.5 mb-20"
      >
        <span className="opacity-70">
          Meet our lovely pets looking for a forever home!
        </span>
      </div>

      {/* Animated Pet Cards Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={page} // Re-animate when page changes
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10 justify-items-center"
        >
          {paginatedPets?.map((pet, index) => (
            <motion.div
              key={pet.id}
              variants={cardVariants}
              whileHover={{
                scale: 1.05,
                y: -10,
                rotateY: 5,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }}
              whileTap={{ scale: 0.95 }}
              custom={index}
            >
              <PetCard props={pet} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Animated Pagination */}
      <motion.div
        variants={paginationVariants}
        initial="hidden"
        animate="visible"
        className="flex justify-center items-center gap-3 mt-6 mb-10"
      >
        <motion.button
          disabled={page === 1}
          onClick={() => {
            setPage((p) => p - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center justify-center px-4 py-2 text-sm font-medium hover:cursor-pointer text-btnPrimary bg-white border border-e-btnPrimary rounded-lg shadow-sm hover:bg-neutral-50 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          whileHover={{ scale: 1.05, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <motion.svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ x: page === 1 ? 0 : [-2, 0] }}
            transition={{ duration: 0.3 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </motion.svg>
          Previous
        </motion.button>

        <motion.span
          className="px-3 py-1 text-sm font-medium "
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.3 }}
          key={page} // Re-animate when page changes
        >
          Page <span className="font-semibold text-btnPrimary">{page}</span> of{" "}
          <span className="font-semibold text-btnPrimary">{totalPages}</span>
        </motion.span>

        <motion.button
          disabled={page === totalPages}
          onClick={() => {
            setPage((p) => p + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center justify-center px-4 py-2 text-sm hover:cursor-pointer font-medium text-btnPrimary bg-white border border-e-btnPrimary rounded-lg shadow-sm hover:bg-neutral-50 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          whileHover={{ scale: 1.05, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          Next
          <motion.svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ x: page === totalPages ? 0 : [2, 0] }}
            transition={{ duration: 0.3 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            ></path>
          </motion.svg>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
