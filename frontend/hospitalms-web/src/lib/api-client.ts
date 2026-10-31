import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { AuthResponseDto } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("hospitalms_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto-Refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = typeof window !== "undefined" ? localStorage.getItem("hospitalms_refresh") : null;
        const response = await axios.post<AuthResponseDto>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );

        const newAuth = response.data;
        if (typeof window !== "undefined") {
          localStorage.setItem("hospitalms_token", newAuth.accessToken);
          localStorage.setItem("hospitalms_refresh", newAuth.refreshToken);
        }

        processQueue(null, newAuth.accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAuth.accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("hospitalms_token");
          localStorage.removeItem("hospitalms_refresh");
          localStorage.removeItem("hospitalms_user");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// -------------------------------------------------------------
// HEALTHCARE API CLIENT SERVICES
// -------------------------------------------------------------

// 1. Dashboard APIs
export const dashboardApi = {
  getStats: async () => {
    const res = await apiClient.get("/dashboard/stats");
    return res.data.data;
  },
  getTrends: async (period = "Last week") => {
    const res = await apiClient.get(`/dashboard/trends?period=${encodeURIComponent(period)}`);
    return res.data.data;
  },
  getDepartmentStats: async (timeFilter = "Today") => {
    const res = await apiClient.get(`/dashboard/department-stats?timeFilter=${encodeURIComponent(timeFilter)}`);
    return res.data.data;
  },
  getDoctorSchedule: async () => {
    const res = await apiClient.get("/dashboard/schedule");
    return res.data.data;
  },
  getAlerts: async () => {
    const res = await apiClient.get("/dashboard/alerts");
    return res.data.data;
  },
};

// 2. Patients APIs
export interface PatientItem {
  id: string;
  patientUid: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  bloodGroup: string;
  phone: string;
  email?: string;
  address: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  knownAllergies?: string;
  chronicConditions?: string;
  isActive: boolean;
  createdAt: string;
}

export const patientsApi = {
  getPatients: async (params?: { page?: number; pageSize?: number; search?: string; gender?: string; bloodGroup?: string }) => {
    const res = await apiClient.get("/patients", { params });
    return res.data.data;
  },
  getPatientById: async (id: string) => {
    const res = await apiClient.get(`/patients/${id}`);
    return res.data.data;
  },
  createPatient: async (data: Partial<PatientItem>) => {
    const res = await apiClient.post("/patients", data);
    return res.data.data;
  },
  updatePatient: async (id: string, data: Partial<PatientItem>) => {
    const res = await apiClient.put(`/patients/${id}`, data);
    return res.data.data;
  },
  deletePatient: async (id: string) => {
    const res = await apiClient.delete(`/patients/${id}`);
    return res.data;
  },
};

// 3. Doctors APIs
export interface DoctorItem {
  id: string;
  fullName: string;
  licenseNumber: string;
  specialization: string;
  qualifications: string;
  departmentId: string;
  departmentName: string;
  consultationFee: number;
  consultationFeeDisplay: string;
  roomNumber?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  isAvailable: boolean;
  isAvailableTelemedicine: boolean;
  schedules: Array<{
    id: string;
    day: string;
    timeDisplay: string;
    maxPatients: number;
  }>;
}

export const doctorsApi = {
  getDoctors: async (params?: { search?: string; department?: string; specialization?: string; isAvailable?: boolean }) => {
    const res = await apiClient.get("/doctors", { params });
    return res.data.data;
  },
  getDoctorById: async (id: string) => {
    const res = await apiClient.get(`/doctors/${id}`);
    return res.data.data;
  },
  getSpecialties: async () => {
    const res = await apiClient.get("/doctors/specialties");
    return res.data.data;
  },
  toggleStatus: async (id: string, isAvailable: boolean) => {
    const res = await apiClient.patch(`/doctors/${id}/status`, { isAvailable });
    return res.data.data;
  },
};

// 4. Appointments APIs
export interface AppointmentItem {
  id: string;
  appointmentNumber: string;
  appointmentDate: string;
  timeSlot: string;
  queueSerialNumber: number;
  appointmentType: string;
  status: string;
  feeAmount: number;
  feeAmountDisplay: string;
  isPaid: boolean;
  reason?: string;
  patient: {
    id: string;
    patientUid: string;
    fullName: string;
    phone: string;
    bloodGroup: string;
    gender: string;
  };
  doctor: {
    id: string;
    fullName: string;
    specialization: string;
    department: string;
    roomNumber?: string;
  };
}

export const appointmentsApi = {
  getAppointments: async (params?: { page?: number; pageSize?: number; date?: string; doctorId?: string; patientId?: string; status?: string }) => {
    const res = await apiClient.get("/appointments", { params });
    return res.data.data;
  },
  getAppointmentById: async (id: string) => {
    const res = await apiClient.get(`/appointments/${id}`);
    return res.data.data;
  },
  createAppointment: async (data: {
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentType?: string;
    isPaid?: boolean;
    reason?: string;
  }) => {
    const res = await apiClient.post("/appointments", data);
    return res.data.data;
  },
  updateStatus: async (id: string, status: string, reason?: string) => {
    const res = await apiClient.patch(`/appointments/${id}/status`, { status, reason });
    return res.data.data;
  },
  getTodayQueue: async (doctorId?: string) => {
    const res = await apiClient.get("/appointments/queue/today", { params: { doctorId } });
    return res.data.data;
  },
};

// 5. Clinical APIs
export const clinicalApi = {
  getEncounters: async (params?: { patientId?: string; doctorId?: string; page?: number; pageSize?: number }) => {
    const res = await apiClient.get("/clinical/encounters", { params });
    return res.data.data;
  },
  getPrescriptions: async (params?: { patientId?: string; page?: number; pageSize?: number }) => {
    const res = await apiClient.get("/clinical/prescriptions", { params });
    return res.data.data;
  },
};

// 6. Laboratory APIs
export interface LabTestItem {
  id: string;
  code: string;
  name: string;
  category: string;
  sampleType: string;
  price: number;
  priceDisplay: string;
  turnaroundHours: number;
  referenceRange?: string;
}

export const laboratoryApi = {
  getTests: async (params?: { category?: string; search?: string }) => {
    const res = await apiClient.get("/laboratory/tests", { params });
    return res.data.data;
  },
  getOrders: async (params?: { patientId?: string; status?: string; page?: number }) => {
    const res = await apiClient.get("/laboratory/orders", { params });
    return res.data.data;
  },
};

// 7. Pharmacy APIs
export interface MedicineItem {
  id: string;
  brandName: string;
  genericName: string;
  manufacturer: string;
  dosageForm: string;
  strength: string;
  unitPrice: number;
  unitPriceDisplay: string;
  stockQuantity: number;
  reorderLevel: number;
  isLowStock: boolean;
  requiresPrescription: boolean;
}

export const pharmacyApi = {
  getMedicines: async (params?: { search?: string; lowStock?: boolean; dosageForm?: string; page?: number; pageSize?: number }) => {
    const res = await apiClient.get("/pharmacy/medicines", { params });
    return res.data.data;
  },
  adjustStock: async (id: string, quantityDelta: number) => {
    const res = await apiClient.post(`/pharmacy/medicines/${id}/stock`, { quantityDelta });
    return res.data.data;
  },
};

// 8. Billing APIs
export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  totalAmountDisplay: string;
  paidAmount: number;
  paidAmountDisplay: string;
  dueAmount: number;
  dueAmountDisplay: string;
  status: string;
  patient: {
    id: string;
    patientUid: string;
    fullName: string;
    phone: string;
  };
  itemCount: number;
  paymentCount: number;
}

export const billingApi = {
  getInvoices: async (params?: { patientId?: string; status?: string; page?: number; pageSize?: number }) => {
    const res = await apiClient.get("/billing/invoices", { params });
    return res.data.data;
  },
  getInvoiceById: async (id: string) => {
    const res = await apiClient.get(`/billing/invoices/${id}`);
    return res.data.data;
  },
  getSummary: async () => {
    const res = await apiClient.get("/billing/summary");
    return res.data.data;
  },
  recordPayment: async (data: { invoiceId: string; amount: number; paymentMethod?: string; transactionReference?: string }) => {
    const res = await apiClient.post("/billing/payments", data);
    return res.data.data;
  },
};
