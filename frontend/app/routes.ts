import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("/our-pets","routes/OurPets.tsx"),
    route("/contact","routes/Contact.tsx"),
    route("/pets-list","routes/ListePets.tsx"),
    route("/pet/:id", "routes/PetProfile.tsx"),
    route("/requests", "routes/Requests.tsx"),

    route("/profile","routes/Profile.tsx"),
    route("/favorites", "routes/Favorites.tsx"),
    route("/welcome-user", "routes/AIwelcome.tsx"),
    route("/match-results", "routes/MatchResults.tsx"), 
    route("/login","routes/Login.tsx"),
    route("/register","routes/Register.tsx"),
   // route("/error","routes/Error.tsx"),
    route("/forgot-password","routes/forgot-password.tsx"),
    route("/reset-password","routes/Reset-password.tsx"),

    // Admin routes
    route("/admin/requests", "routes/AdminRequests.tsx"),
    route("/admin/pets", "routes/AdminPets.tsx"),
    route("/admin/pets/:id/edit", "routes/AdminPetDetails.tsx"), 
    route("/admin/profile", "routes/AdminProfile.tsx"),
    route("/admin/dashboard", "routes/AdminDashboard.tsx"),
    
    // Catch-all 404
    route("*", "routes/Error.tsx"),
  ] satisfies RouteConfig;