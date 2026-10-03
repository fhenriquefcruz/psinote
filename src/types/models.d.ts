type TimestampLike =
  | Date
  | string
  | number
  | {
      toDate: () => Date;
    }
  | null;

type PatientAnamnesis = {
  chiefComplaint?: string;
  familyHistory?: string;
  medicalHistory?: string;
  medications?: string;
  therapeuticGoals?: string;
  initialObservations?: string;
};

type PatientRecord = {
  id: string;
  psychologistId?: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  cpf?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  profession?: string;
  address?: string;
  emergencyContact?: string;
  observations?: string;
  anamnesis?: PatientAnamnesis;
  status?: 'active' | 'archived' | 'deleted' | string;
  isFavorite?: boolean;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  createdBy?: string;
  updatedBy?: string;
  archivedAt?: TimestampLike;
  deletedAt?: TimestampLike;
  [key: string]: unknown;
};

type SessionScales = {
  mood?: number;
  [key: string]: unknown;
};

type SessionRecord = {
  id: string;
  psychologistId?: string;
  patientId?: string;
  patientName?: string;
  appointmentId?: string | null;
  sessionNumber?: number | string | null;
  date?: TimestampLike;
  status?: 'draft' | 'scheduled' | 'finalized' | 'archived' | string;
  version?: number;
  revision?: number;
  mainTheme?: string;
  observations?: string;
  evolution?: string;
  clinicalEvolution?: string;
  interventions?: string;
  referrals?: string;
  agreements?: string;
  nextSteps?: string;
  tags?: string[];
  scales?: SessionScales;
  finalizedAt?: TimestampLike;
  reopenedAt?: TimestampLike;
  previousVersions?: unknown[];
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  createdBy?: string;
  updatedBy?: string;
  [key: string]: unknown;
};

type SessionVersionRecord = {
  id: string;
  psychologistId?: string;
  patientId?: string;
  sessionId?: string;
  version?: number;
  revision?: number;
  reason?: string;
  snapshot?: Record<string, unknown>;
  createdAt?: TimestampLike;
  createdBy?: string;
  source?: 'immutable' | 'legacy' | string;
  [key: string]: unknown;
};

type DocumentDraftRecord = {
  id: string;
  psychologistId?: string;
  patientId?: string | null;
  patientName?: string;
  templateId?: string;
  templateVersion?: number;
  templateType?: string;
  templateFamily?: string;
  values?: Record<string, string>;
  status?: 'draft' | 'issued' | string;
  familyId?: string;
  issueVersion?: number;
  supersedesDocumentId?: string | null;
  issuedDocumentId?: string | null;
  issuedAt?: TimestampLike;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  createdBy?: string;
  updatedBy?: string;
  [key: string]: unknown;
};

type DocumentRecord = {
  id: string;
  psychologistId?: string;
  patientId?: string | null;
  name?: string;
  category?: string;
  kind?: 'attachment' | 'generated' | string;
  status?: 'stored' | 'issued' | string;
  storageProvider?: string;
  storagePath?: string;
  fileType?: string;
  fileSize?: number;
  sha256?: string;
  version?: number;
  familyId?: string | null;
  templateId?: string | null;
  templateVersion?: number | null;
  templateType?: string | null;
  draftId?: string | null;
  supersedesDocumentId?: string | null;
  issuedAt?: TimestampLike;
  issuedBy?: string;
  uploadedAt?: TimestampLike;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  uploadedBy?: string;
  createdBy?: string;
  updatedBy?: string;
  fileURL?: string;
  [key: string]: unknown;
};


type UserProfileRecord = {
  name?: string;
  email?: string;
  phone?: string;
  photoURL?: string;
  crp?: string;
  crpUf?: string;
  role?: string;
  blocked?: boolean;
  [key: string]: unknown;
};

type AuthContextValue = {
  user: import('firebase/auth').User | null;
  userProfile: UserProfileRecord | null;
  userRole: string;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<import('firebase/auth').UserCredential>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<import('firebase/auth').UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Record<string, unknown>) => Promise<void>;
  isAdmin: boolean;
};

type ThemeContextValue = {
  theme: string;
  toggleTheme: () => void;
};

type AdminAccountRecord = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  blocked?: boolean;
  [key: string]: unknown;
};

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}
