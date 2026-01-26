import { useLocation, useNavigate, Link } from "react-router";
import { useTheme } from "~/contexts/themeContext";
import AuthenticatedLayout from "../components/AuthenticatedLayout";
import { motion } from "framer-motion";
import type { Pet } from "../api/petsService";
import PetCardAI from "../components/PetCardAI";

export default function MatchResults() {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { 
    pets, 
    description, 
    total, 
    message 
  } = location.state as { 
    pets: (Pet & { score?: number })[]; 
    description: string;
    total: number;
    message: string;
  } || { pets: [], description: "", total: 0, message: "" };

  // If no pets data, redirect back
  if (!pets || pets.length === 0) {
    return (
      <AuthenticatedLayout>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA" }}
        >
          <div className="text-center space-y-6">
            <div className="text-6xl">🐾</div>
            <h2
              className="text-3xl font-bold"
              style={{ color: isDarkMode ? "#F5F3ED" : "#8B6F47" }}
            >
              {message || "No matches found"}
            </h2>
            <p
              className="text-lg"
              style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}
            >
              Try adjusting your preferences or browse all available pets
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/welcome-user">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-[#D97F3E] text-white rounded-xl text-lg font-medium shadow-lg hover:bg-[#c17135] transition-colors"
                >
                  Try Again
                </motion.button>
              </Link>
              <Link to="/pets-list">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-xl text-lg font-medium border-2 border-[#D97F3E] text-[#D97F3E] transition-colors"
                  style={{
                    backgroundColor: isDarkMode ? "#36332E" : "white",
                  }}
                >
                  Browse All Pets
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div
        className="min-h-screen py-16 duration-300"
        style={{ backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA" }}
      >
        <div className="container mx-auto px-6">
          {/* Header */}
          <div data-cy="match-results-header" className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h1
                className="text-4xl lg:text-5xl font-bold duration-300"
                style={{ color: isDarkMode ? "#F5F3ED" : "#8B6F47" }}
              >
                Your Perfect Matches! 🎉
              </h1>
              <p
                className="text-lg max-w-2xl mx-auto duration-300"
                style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}
              >
                Based on your preferences: "{description}"
              </p>
              {message && (
                <p
                  className="text-base font-medium"
                  style={{ color: "#D97F3E" }}
                >
                  {message}
                </p>
              )}
              <p
                className="text-base font-medium"
                style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}
              >
                Found {total || pets.length} {(total || pets.length) === 1 ? "pet" : "pets"}, sorted by match score
              </p>
            </motion.div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pets.map((pet, index) => (
              <motion.div
                key={pet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PetCardAI props={pet} />
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Link to="/welcome-user">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl text-lg font-medium border-2 border-[#D97F3E] text-[#D97F3E] transition-colors"
                style={{
                  backgroundColor: isDarkMode ? "#36332E" : "white",
                }}
              >
                Try New Search
              </motion.button>
            </Link>
            <Link to="/pets-list">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-[#D97F3E] text-white rounded-xl text-lg font-medium shadow-lg hover:bg-[#c17135] transition-colors"
              >
                Browse All Pets
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}