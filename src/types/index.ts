export type UserRole = 'SUPER_ADMIN' | 'SHADOW_ADMIN' | 'JURY' | 'VOTER' | 'PUBLIC';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  assignedCategoryIds?: string[]; // for Jury: which competitions they judge
  voteBalance?: number; // for Voter: current balance
  avatarUrl?: string;
}

export type ScoreCriteriaType = 'CHECKBOX' | 'NUMBER';

export interface ScoreCriteria {
  id: string;
  name: string;
  description?: string;
  type: ScoreCriteriaType;
  maxScore: number; // For CHECKBOX, defines how many checkboxes appear (1 to maxScore)
  weight?: number; // Optional percentage weight
}

export interface CompetitionCategory {
  id: string;
  name: string;
  description: string;
  location: string;
  scheduleTime: string;
  rules: string[];
  maxDurationMinutes?: number;
  assignedJuryIds: string[]; // multi-jury (can be > 4 juries)
  criteria: ScoreCriteria[];
}

export interface Participant {
  id: string;
  registrationNumber: string;
  name: string;
  institution: string; // Sekolah / Kontingen / Instansi
  categoryId: string;
  contact?: string;
  photoUrl?: string;
}

export interface PenaltyRecord {
  id: string;
  reason: string;
  pointsDeducted: number;
}

export interface JuryScoreSubmission {
  id: string;
  categoryId: string;
  participantId: string;
  juryId: string;
  juryName: string;
  criteriaScores: { [criteriaId: string]: number };
  penalties: PenaltyRecord[];
  totalScore: number; // SUM(criteria) - SUM(penalties)
  timeCompletionSeconds: number; // Duration recorded by jury in seconds
  signatureDataUrl: string; // Digital signature
  integrityPactAccepted: boolean;
  notes?: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
}

export interface RankingResult {
  rank: number;
  participantId: string;
  participantName: string;
  registrationNumber: string;
  institution: string;
  categoryId: string;
  averageScore: number;
  totalScoreAllJuries: number;
  juriesCount: number;
  averageTimeSeconds: number; // For tie-breaker
  minTimeSeconds: number;
  awardTitle?: 'Juara 1' | 'Juara 2' | 'Juara 3' | 'Harapan 1' | 'Harapan 2' | 'Harapan 3' | 'Peserta';
  detailsPerJury: {
    juryId: string;
    juryName: string;
    score: number;
    timeSeconds: number;
  }[];
}

export interface VotingCategory {
  id: string;
  name: string;
  description: string;
  pricePerVote: number; // In IDR (Rupiah), e.g. 1000
  isActive: boolean;
  candidates: VotingCandidate[];
}

export interface VotingCandidate {
  id: string;
  name: string;
  subtitle: string;
  institution: string;
  photoUrl: string;
  votesCount: number;
}

export interface VoteTransaction {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  senderName?: string; // Nama Pengirim DANA
  amountVotes: number;
  totalPriceIdr: number;
  danaAccountNumber: string; // '081314420312'
  transferProofUrl: string; // Base64 or image URL
  referenceCode: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  verifiedAt?: string;
  notes?: string;
}

export interface VoteCast {
  id: string;
  userId: string;
  userName: string;
  candidateId: string;
  candidateName: string;
  votingCategoryId: string;
  votesGiven: number;
  createdAt: string;
}

export interface EventScheduleItem {
  id: string;
  time: string;
  activity: string;
  location: string;
}

export interface EventRuleItem {
  id: string;
  rule: string;
}

export interface PublicEventInfo {
  title: string;
  subTitle: string;
  eventDescription: string;
  location: string;
  eventDate: string;
  contactPerson: string;
  rulesOverview: (string | EventRuleItem)[];
  scheduleOverview: EventScheduleItem[];
}

export interface AppSettings {
  competitionTitle: string;
  competitionSubtitle: string;
  competitionDescription: string;
  location: string;
  eventDateTime: string;
  themeColor: 'gold' | 'red' | 'blue' | 'green' | 'brown' | 'dark';
  backgroundImageUrl: string;
  logoUrl: string;
  videoPromoUrl: string;
  bgmAudioUrl: string;
  bgmFileName?: string;
  bgmEnabled: boolean;
  bgmVolume: number; // 0 - 1
  votingEnabled: boolean; // Toggle Super Admin: Penutupan voting
  danaTransferEnabled: boolean; // Toggle Super Admin: Transfer dana
  danaTargetNumber: string; // '081314420312'
  danaTargetName: string; // 'PANITIA S-IMPEL DIGITAL'
  defaultPricePerVote?: number; // Nominal harga per vote (Rupiah/Poin), misal 1000
}
