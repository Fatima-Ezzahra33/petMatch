import React, {
  useContext,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { UserContext } from "../contexts/UserContext";
import AvatarSelectionModal from "./AvatarSelectionModal";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "~/api/client";
import { useTheme } from "~/contexts/themeContext";

interface UserFormData {
  name: string;
  location: string;
  phone: string;
  email: string;
}

interface PersonalDetailsFormProps {
  user: any;
}

export interface PersonalDetailsFormHandle {
  submit: () => void;
}

const PersonalDetailsForm = forwardRef<
  PersonalDetailsFormHandle,
  PersonalDetailsFormProps
>(({ user }, ref) => {
  const { setUser } = useContext(UserContext)!;
  const { isDarkMode } = useTheme();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(
    user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=1"
  );
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    defaultValues: {
      name: user?.name || "",
      location: user?.location || "",
      phone: user?.phone || "",
      email: user?.email || "",
    },
  });

  // Update form when user data changes
  React.useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        location: user.location || "",
        phone: user.phone || "",
        email: user.email || "",
      });
      setSelectedAvatar(
        user.avatar ||
          "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436180.jpg?t=st=1765361086~exp=1765364686~hmac=7cdd4763ea8b5dc52d37988ab77c005fefdf479f2c4e12359dfa94af43c4cc61&w=1480"
      );
    }
  }, [user, reset]);

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    try {
      // Only send the fields we want to update (no password fields)
      const updateData = {
        name: data.name,
        location: data.location,
        phone: data.phone,
        email: data.email,
        avatar: selectedAvatar,
      };

      const res = await api.put("/api/me", updateData);
      if (setUser) {
        setUser({ ...user, ...res.data.user, avatar: selectedAvatar });
      }
      toast.success("Profile updated successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update profile";
      const errors = error.response?.data?.errors;

      if (errors) {
        // Display validation errors
        Object.values(errors)
          .flat()
          .forEach((err: any) => {
            toast.error(err, {
              position: "top-right",
              autoClose: 5000,
            });
          });
      } else {
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    submit: () => {
      handleSubmit(onSubmit)();
    },
  }));

  const handleAvatarSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    setIsAvatarModalOpen(false);
    if (setUser) {
      setUser({ ...user, avatar });
    }
    toast.success('Avatar updated! Click "Save Changes" to confirm.', {
      position: "top-right",
      autoClose: 3000,
    });
  };

  // Avatar options with actual image URLs
  const avatarOptions = [
    "https://img.freepik.com/free-psd/3d-illustration-person-with-pink-hair_23-2149436186.jpg?t=st=1765360779~exp=1765364379~hmac=283489743fa451276f5cf5076b3d81c1af1075cf36c9b0567e722efb5f716199&w=1480",
    "https://img.freepik.com/free-psd/3d-illustration-person-with-punk-hair-jacket_23-2149436198.jpg?t=st=1765361001~exp=1765364601~hmac=673efde053c140d3cf64dc1a2121c98f892b21f05a5392287ad50bec207ca003&w=1480",
    "https://img.freepik.com/free-psd/3d-illustration-person_23-2149436179.jpg?t=st=1765361021~exp=1765364621~hmac=101d747475fcb165800a42d3e532f29deb336a82768dab1f1daaa76860f1373e&w=1480",
    "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436178.jpg?t=st=1765361038~exp=1765364638~hmac=be9bcc15818350d50add51e002eca4a76be88a03d1827552fb01019dfdaa211f&w=1480",
    "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436180.jpg?t=st=1765361086~exp=1765364686~hmac=7cdd4763ea8b5dc52d37988ab77c005fefdf479f2c4e12359dfa94af43c4cc61&w=1480",
    "https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611698.jpg",
    "https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611713.jpg?t=st=1765361133~exp=1765364733~hmac=6a9f3d7dd7e7a7c01e459fd8c9f514697981037690c0efc07003f0fc5a3e3dd3&w=1480",
    "https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611746.jpg?t=st=1765361152~exp=1765364752~hmac=fd4ee5690b2500e12c8feff820700fc17450a36a6c7a5441659ea56e1a743ab6&w=1480 ",
    "https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611716.jpg?t=st=1765361200~exp=1765364800~hmac=6a7b5c52b1c82c54b44db6827df0ad936a3b87ad3da198a74e4d76b148f620b6&w=1480",
  ];

  return (
    <>
      <div
        className="p-6 rounded-lg shadow-md mb-6 transition-colors duration-300"
        style={{
          backgroundColor: isDarkMode ? "rgba(115, 101, 91, 0.3)" : "white",
        }}
      >
        {/* Header with Title and Save Button */}
        <div className="flex justify-between items-center mb-6">
          <h2
            className="text-xl font-semibold transition-colors duration-300"
            style={{ color: isDarkMode ? "#F5F3ED" : "#1f2937" }}
          >
            Personal Details
          </h2>
          <button
            type="button"
            onClick={() => handleSubmit(onSubmit)()}
            disabled={isLoading}
            className="px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            style={{
              backgroundColor: isLoading
                ? isDarkMode
                  ? "#B86F3E"
                  : "#fb923c"
                : isDarkMode
                  ? "#D9915B"
                  : "#f97316",
              color: "white",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? "#C77D47"
                  : "#ea580c";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? "#D9915B"
                  : "#f97316";
              }
            }}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Avatar Section */}
        <div className="mb-6">
          <label
            className="block text-sm font-medium mb-2 transition-colors duration-300"
            style={{ color: isDarkMode ? "#F7F5EA" : "#374151" }}
          >
            Photo
          </label>
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden transition-colors duration-300"
              style={{
                backgroundColor: isDarkMode
                  ? "rgba(115, 101, 91, 0.4)"
                  : "#e5e7eb",
              }}
            >
              {selectedAvatar ? (
                <img
                  src={selectedAvatar}
                  alt="User avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircleIcon
                  className="w-20 h-20"
                  style={{ color: isDarkMode ? "#73655B" : "#9ca3af" }}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="text-sm font-medium underline transition-colors duration-300"
              style={{ color: isDarkMode ? "#D9915B" : "#2563eb" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = isDarkMode
                  ? "#C77D47"
                  : "#1e40af";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isDarkMode
                  ? "#D9915B"
                  : "#2563eb";
              }}
            >
              Change avatar
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium mb-1 transition-colors duration-300"
              style={{ color: isDarkMode ? "#F7F5EA" : "#374151" }}
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              className="w-full p-2 border rounded-md focus:ring-2 focus:border-transparent transition-colors duration-300"
              style={{
                backgroundColor: isDarkMode
                  ? "rgba(115, 101, 91, 0.2)"
                  : "white",
                borderColor: errors.name
                  ? isDarkMode
                    ? "#f87171"
                    : "#ef4444"
                  : isDarkMode
                    ? "#73655B"
                    : "#d1d5db",
                color: isDarkMode ? "#F7F5EA" : "#1f2937",
              }}
            />
            {errors.name && (
              <p
                className="text-xs mt-1 transition-colors duration-300"
                style={{ color: isDarkMode ? "#fca5a5" : "#dc2626" }}
              >
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium mb-1 transition-colors duration-300"
              style={{ color: isDarkMode ? "#F7F5EA" : "#374151" }}
            >
              Location
            </label>
            <select
              id="location"
              {...register("location")}
              className="w-full p-2 border rounded-md focus:ring-2 focus:border-transparent transition-colors duration-300"
              style={{
                backgroundColor: isDarkMode
                  ? "rgba(115, 101, 91, 0.2)"
                  : "white",
                borderColor: isDarkMode ? "#73655B" : "#d1d5db",
                color: isDarkMode ? "#F7F5EA" : "#1f2937",
              }}
            >
              <option
                value=""
                style={{ backgroundColor: isDarkMode ? "#36332E" : "white" }}
              >
                Select Location
              </option>
              <option
                value="casablanca"
                style={{ backgroundColor: isDarkMode ? "#36332E" : "white" }}
              >
                Casablanca
              </option>
              <option
                value="rabat"
                style={{ backgroundColor: isDarkMode ? "#36332E" : "white" }}
              >
                Rabat
              </option>
              <option
                value="marrakech"
                style={{ backgroundColor: isDarkMode ? "#36332E" : "white" }}
              >
                Marrakech
              </option>
              <option
                value="fes"
                style={{ backgroundColor: isDarkMode ? "#36332E" : "white" }}
              >
                Fes
              </option>
              <option
                value="tanger"
                style={{ backgroundColor: isDarkMode ? "#36332E" : "white" }}
              >
                Tanger
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium mb-1 transition-colors duration-300"
              style={{ color: isDarkMode ? "#F7F5EA" : "#374151" }}
            >
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              {...register("phone")}
              className="w-full p-2 border rounded-md focus:ring-2 focus:border-transparent transition-colors duration-300"
              style={{
                backgroundColor: isDarkMode
                  ? "rgba(115, 101, 91, 0.2)"
                  : "white",
                borderColor: isDarkMode ? "#73655B" : "#d1d5db",
                color: isDarkMode ? "#F7F5EA" : "#1f2937",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1 transition-colors duration-300"
              style={{ color: isDarkMode ? "#F7F5EA" : "#374151" }}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              {...register("email", {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:border-transparent transition-colors duration-300"
              style={{
                backgroundColor: isDarkMode
                  ? "rgba(115, 101, 91, 0.2)"
                  : "white",
                borderColor: errors.email
                  ? isDarkMode
                    ? "#f87171"
                    : "#ef4444"
                  : isDarkMode
                    ? "#73655B"
                    : "#d1d5db",
                color: isDarkMode ? "#F7F5EA" : "#1f2937",
              }}
            />
            {errors.email && (
              <p
                className="text-xs mt-1 transition-colors duration-300"
                style={{ color: isDarkMode ? "#fca5a5" : "#dc2626" }}
              >
                {errors.email.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {isAvatarModalOpen && (
        <AvatarSelectionModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          onSelect={handleAvatarSelect}
          currentAvatar={selectedAvatar}
          avatars={avatarOptions}
        />
      )}
    </>
  );
});

PersonalDetailsForm.displayName = "PersonalDetailsForm";

export default PersonalDetailsForm;
