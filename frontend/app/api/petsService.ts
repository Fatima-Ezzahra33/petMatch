// app/api/petsService.ts

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? "http://localhost:8000" : "http://localhost:8000");
const API_URL = `${API_BASE}/api`;

export interface Pet {
  id: number;
  name: string;
  species: string | null;
  type: string | null;
  age: number | null;
  gender: string;
  profile_picture: string | null;
  status: string;
  description: string;
}

export interface AdoptionApplication {
  id: number;
  user_id: number;
  pet_id: number;
  form_data: any;
  status: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  pet: {
    id: number;
    name: string;
    species: string;
  };
}
export interface PetStats {
  total: number;
  available: number;
  adopted: number;
  pending: number;
  by_species: Array<{ species: string; count: number }>;
  recent_additions: number;
  recent_adoptions: number;
  by_gender: Array<{ gender: string; count: number }>;
}

export interface DashboardActivity {
  recent_additions: Pet[];
  recent_adoptions: Pet[];
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

class PetsService {
  private matchPetsAbortController: AbortController | null = null;

  async getPets(): Promise<Pet[]> {
    try {
      const response = await fetch(`${API_URL}/pets`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch pets");
      }

      const pets: Pet[] = await response.json();
      return pets;
    } catch (error) {
      console.error("Get pets error:", error);
      throw error;
    }
  }

  // Admin methods
  async getAdminPets(): Promise<Pet[]> {
    try {
      const response = await fetch(`${API_URL}/admin/pets`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Failed to fetch admin pets:",
          response.status,
          errorText
        );
        throw new Error("Failed to fetch admin pets");
      }

      const pets: Pet[] = await response.json();
      return pets;
    } catch (error) {
      console.error("Get admin pets error:", error);
      throw error;
    }
  }

  async createPet(petData: Omit<Pet, "id">): Promise<Pet> {
    try {
      const response = await fetch(`${API_URL}/admin/pets`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(petData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create pet");
      }

      const pet: Pet = await response.json();
      return pet;
    } catch (error) {
      console.error("Create pet error:", error);
      throw error;
    }
  }

  async updatePet(id: number, petData: Partial<Pet>): Promise<Pet> {
    try {
      const response = await fetch(`${API_URL}/admin/pets/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(petData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update pet");
      }

      const pet: Pet = await response.json();
      return pet;
    } catch (error) {
      console.error("Update pet error:", error);
      throw error;
    }
  }

  async deletePet(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/admin/pets/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to delete pet");
      }
    } catch (error) {
      console.error("Delete pet error:", error);
      throw error;
    }
  }

  async getAdminAdoptionApplications(): Promise<AdoptionApplication[]> {
    try {
      const response = await fetch(`${API_URL}/admin/adoption-applications`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch admin adoption applications");
      }

      const applications: AdoptionApplication[] = await response.json();
      return applications;
    } catch (error) {
      console.error("Get admin adoption applications error:", error);
      throw error;
    }
  }

  async updateAdoptionApplicationStatus(
    id: number,
    status: string
  ): Promise<AdoptionApplication> {
    try {
      const response = await fetch(
        `${API_URL}/admin/adoption-applications/${id}/status`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update adoption application status");
      }

      const application: AdoptionApplication = await response.json();
      return application;
    } catch (error) {
      console.error("Update adoption application status error:", error);
      throw error;
    }
  }
  async getDashboardStats(): Promise<PetStats> {
    try {
      const response = await fetch(`${API_URL}/admin/pets/dashboard/stats`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      return await response.json();
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      throw error;
    }
  }

  async getDashboardActivity(): Promise<DashboardActivity> {
    try {
      const response = await fetch(`${API_URL}/admin/pets/dashboard/activity`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard activity");
      }

      return await response.json();
    } catch (error) {
      console.error("Get dashboard activity error:", error);
      throw error;
    }
  }

  // AI Pet Matching
  async matchPets(userMessage: string): Promise<{ pets: Pet[]; total: number; message: string }> {
    // Cancel any previous in-flight request
    if (this.matchPetsAbortController) {
      this.matchPetsAbortController.abort();
    }

    // Create new abort controller for this request
    this.matchPetsAbortController = new AbortController();

    try {
      const response = await fetch(`${API_URL}/match-pets`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ user_message: userMessage }),
        signal: this.matchPetsAbortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to match pets");
      }

      const data = await response.json();
      return {
        pets: data.pets || [],
        total: data.total || 0,
        message: data.message || "Matches found"
      };
    } catch (error) {
      // Don't log abort errors (they're intentional)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Previous match pets request cancelled');
        throw new Error('Request cancelled');
      }
      console.error("Match pets error:", error);
      throw error;
    } finally {
      this.matchPetsAbortController = null;
    }
  }
}

export const petsService = new PetsService();