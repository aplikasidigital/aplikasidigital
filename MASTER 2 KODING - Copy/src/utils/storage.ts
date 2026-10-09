import {
  AppSettings,
  CompetitionCategory,
  JuryScoreSubmission,
  Participant,
  PublicEventInfo,
  RankingResult,
  User,
  VoteCast,
  VoteTransaction,
  VotingCategory
} from '../types';

export const STORAGE_KEYS = {
  USERS: 'simpel_users_v2',
  SETTINGS: 'simpel_settings_v2',
  CATEGORIES: 'simpel_categories_v2',
  PARTICIPANTS: 'simpel_participants_v2',
  SUBMISSIONS: 'simpel_submissions_v2',
  VOTING_CATEGORIES: 'simpel_voting_categories_v2',
  VOTE_TRANSACTIONS: 'simpel_vote_tx_v2',
  VOTE_CASTS: 'simpel_vote_casts_v2',
  PUBLIC_INFO: 'simpel_public_info_v2',
  CURRENT_USER: 'simpel_current_user_v2'
};

// Cross-tab real-time sync broadcast channel
const syncChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('simpel_digital_realtime_channel')
    : null;

export const DEFAULT_SETTINGS: AppSettings = {
  competitionTitle: 'FESTIVAL & KOMPETISI KREATIF NASIONAL 2026',
  competitionSubtitle: 'S-IMPEL DIGITAL: Sistem Penilaian Digital & Voting Berbayar Terpadu',
  competitionDescription: 'Ajang bergengsi unjuk kompetensi keahlian, Keterampilan, kreativitas, pengetahuan dan Vokasi dengan sistem penjurian digital transparan, cepat, dan akuntabel.',
  location: 'Auditorium Utama Graha Teknologi & Seni Nusantara, Gedung B',
  eventDateTime: '14 - 16 November 2026 | 08.00 - 17.30 WIB',
  themeColor: 'gold',
  backgroundImageUrl: '',
  logoUrl: '',
  videoPromoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  bgmAudioUrl: '',
  bgmFileName: '',
  bgmEnabled: true,
  bgmVolume: 0.35,
  votingEnabled: true,
  danaTransferEnabled: true,
  danaTargetNumber: '081314420312',
  danaTargetName: 'PANITIA S-IMPEL DIGITAL (OFFICIAL)',
  defaultPricePerVote: 1000
};

export const DEFAULT_USERS: User[] = [
  {
    id: 'usr-admin-1',
    username: 'Usseradmin',
    password: '123#',
    name: 'Muhamad Hidayatullah (Super Admin)',
    role: 'SUPER_ADMIN',
    phone: '081314420312',
    email: 'admin.utama@simpel-digital.id'
  },
  {
    id: 'usr-shadow-1',
    username: 'coadmin1',
    password: '123#',
    name: 'Rian Pratama (Admin Operasional)',
    role: 'SHADOW_ADMIN',
    phone: '081234567890',
    email: 'operasional@simpel-digital.id'
  },
  {
    id: 'usr-jury-1',
    username: 'juri_ahmad',
    password: '123#',
    name: 'Dr. Ir. Ahmad Syahrul, M.Kom',
    role: 'JURY',
    phone: '081211112222',
    assignedCategoryIds: ['cat-web', 'cat-robot']
  },
  {
    id: 'usr-jury-2',
    username: 'juri_siti',
    password: '123#',
    name: 'Siti Nurhaliza, M.Ds (Desain Grafis)',
    role: 'JURY',
    phone: '081222223333',
    assignedCategoryIds: ['cat-web', 'cat-pidato']
  },
  {
    id: 'usr-jury-3',
    username: 'juri_budi',
    password: '123#',
    name: 'Budi Santoso, S.T., M.Eng',
    role: 'JURY',
    phone: '081233334444',
    assignedCategoryIds: ['cat-web', 'cat-robot']
  },
  {
    id: 'usr-jury-4',
    username: 'juri_dewi',
    password: '123#',
    name: 'Dewi Lestari, S.S., M.Hum',
    role: 'JURY',
    phone: '081244445555',
    assignedCategoryIds: ['cat-pidato', 'cat-web']
  },
  {
    id: 'usr-jury-5',
    username: 'juri_hendra',
    password: '123#',
    name: 'Prof. Hendra Kusuma, Ph.D',
    role: 'JURY',
    phone: '081255556666',
    assignedCategoryIds: ['cat-web', 'cat-robot']
  },
  {
    id: 'usr-voter-1',
    username: 'voter_andri',
    password: '123#',
    name: 'Andri Wijaya (Pendukung SMK 1)',
    role: 'VOTER',
    phone: '085712345678',
    voteBalance: 25
  },
  {
    id: 'usr-voter-2',
    username: 'voter_maya',
    password: '123#',
    name: 'Maya Puspita (Alumni/Umum)',
    role: 'VOTER',
    phone: '085888776655',
    voteBalance: 10
  }
];

export const DEFAULT_CATEGORIES: CompetitionCategory[] = [
  {
    id: 'cat-web',
    name: 'Desain & Pengembangan Web Kreatif',
    description: 'Kompetisi pembuatan aplikasi web responsif bertema Digitalisasi Edukasi & Kewirausahaan Siswa.',
    location: 'Lab Komputer 1 & 2',
    scheduleTime: '14 Nov 2026, 08:30 - 12:00 WIB',
    rules: [
      'Waktu pengerjaan maksimal 180 menit',
      'Originalitas ide dan kode sumber wajib dibuktikan',
      'Setiap keterlambatan atau pelanggaran tata tertib dikenai penalti poin'
    ],
    maxDurationMinutes: 180,
    assignedJuryIds: ['usr-jury-1', 'usr-jury-2', 'usr-jury-3', 'usr-jury-4', 'usr-jury-5'],
    criteria: [
      {
        id: 'crit-1',
        name: 'UI/UX & Desain Visual Responsif',
        description: 'Tata letak, kesesuaian palet warna, tipografi, dan kemudahan navigasi.',
        type: 'CHECKBOX',
        maxScore: 10
      },
      {
        id: 'crit-2',
        name: 'Kualitas Kode & Struktur Arsitektur',
        description: 'Kebersihan kode, modularitas komponen, dan tanpa error pada console.',
        type: 'NUMBER',
        maxScore: 100
      },
      {
        id: 'crit-3',
        name: 'Inovasi Fitur & Pemecahan Masalah',
        description: 'Daya guna aplikasi terhadap kasus nyata dan orisinalitas ide.',
        type: 'CHECKBOX',
        maxScore: 8
      },
      {
        id: 'crit-4',
        name: 'Presentasi & Penguasaan Materi',
        description: 'Kelancaran menjawab pertanyaan tim juri penguji.',
        type: 'NUMBER',
        maxScore: 100
      }
    ]
  },
  {
    id: 'cat-pidato',
    name: 'Pidato Kebangsaan & Public Speaking',
    description: 'Ajang penyampaian orasi inspiratif pemuda bertema Semangat Kebhinekaan di Era Digital.',
    location: 'Panggung Utama Auditorium',
    scheduleTime: '14 Nov 2026, 13:00 - 16:30 WIB',
    rules: [
      'Durasi pidato 7 - 10 menit (diukur stopwatch presisi)',
      'Tanpa teks (memoriter) di atas panggung',
      'Pakaian adat atau seragam kebesaran rapi'
    ],
    maxDurationMinutes: 10,
    assignedJuryIds: ['usr-jury-2', 'usr-jury-4'],
    criteria: [
      {
        id: 'crit-p1',
        name: 'Artikulasi, Intonasi, dan Olah Vokal',
        type: 'CHECKBOX',
        maxScore: 10
      },
      {
        id: 'crit-p2',
        name: 'Struktur Konten & Kedalaman Makna',
        type: 'NUMBER',
        maxScore: 100
      },
      {
        id: 'crit-p3',
        name: 'Gestur, Ekspresi & Penguasaan Panggung',
        type: 'CHECKBOX',
        maxScore: 10
      }
    ]
  },
  {
    id: 'cat-robot',
    name: 'Robotika & Automasi Cerdas (Line Follower / IoT)',
    description: 'Lintasan sirkuit rintangan cepat dan kendali automasi cerdas mikrokontroler.',
    location: 'Hall Sains & Teknologi',
    scheduleTime: '15 Nov 2026, 09:00 - 15:00 WIB',
    rules: [
      'Maksimal 3 kali percobaan lintasan',
      'Pencatatan waktu lap tercepat menjadi penentu kemenangan utama',
      'Pelanggaran keluar jalur (out of track) memotong 5 poin'
    ],
    maxDurationMinutes: 15,
    assignedJuryIds: ['usr-jury-1', 'usr-jury-3', 'usr-jury-5'],
    criteria: [
      {
        id: 'crit-r1',
        name: 'Kecepatan & Ketepatan Lintasan',
        type: 'NUMBER',
        maxScore: 100
      },
      {
        id: 'crit-r2',
        name: 'Stabilitas & Desain Mekanik Robot',
        type: 'CHECKBOX',
        maxScore: 10
      },
      {
        id: 'crit-r3',
        name: 'Efisiensi Algoritma Sensor',
        type: 'CHECKBOX',
        maxScore: 10
      }
    ]
  }
];

export const DEFAULT_PARTICIPANTS: Participant[] = [
  // Web Category
  {
    id: 'part-w1',
    registrationNumber: 'WEB-001',
    name: 'Bintang Alamsyah & Tim',
    institution: 'SMKN 1 Jakarta Raya',
    categoryId: 'cat-web',
    contact: '081299990001'
  },
  {
    id: 'part-w2',
    registrationNumber: 'WEB-002',
    name: 'Anisa Rahmawati',
    institution: 'SMKN 2 Bandung',
    categoryId: 'cat-web',
    contact: '081299990002'
  },
  {
    id: 'part-w3',
    registrationNumber: 'WEB-003',
    name: 'Rezky Pratama Putra',
    institution: 'SMA Taruna Nusantara',
    categoryId: 'cat-web',
    contact: '081299990003'
  },
  {
    id: 'part-w4',
    registrationNumber: 'WEB-004',
    name: 'Fadhil Ihsan',
    institution: 'SMK Telkom Malang',
    categoryId: 'cat-web',
    contact: '081299990004'
  },
  {
    id: 'part-w5',
    registrationNumber: 'WEB-005',
    name: 'Nabila Zahra',
    institution: 'SMK Raden Umar Said Kudus',
    categoryId: 'cat-web',
    contact: '081299990005'
  },
  {
    id: 'part-w6',
    registrationNumber: 'WEB-006',
    name: 'Christian Wijaya',
    institution: 'SMA Kristen Gloria Surabaya',
    categoryId: 'cat-web',
    contact: '081299990006'
  },
  // Pidato Category
  {
    id: 'part-p1',
    registrationNumber: 'PID-001',
    name: 'Cut Mutia Salsabila',
    institution: 'SMA Negeri 1 Banda Aceh',
    categoryId: 'cat-pidato',
    contact: '081399990001'
  },
  {
    id: 'part-p2',
    registrationNumber: 'PID-002',
    name: 'I Made Bagus Dirgantara',
    institution: 'SMAN 3 Denpasar',
    categoryId: 'cat-pidato',
    contact: '081399990002'
  },
  {
    id: 'part-p3',
    registrationNumber: 'PID-003',
    name: 'Siti Fatimah Azzahra',
    institution: 'MAN Insan Cendekia Serpong',
    categoryId: 'cat-pidato',
    contact: '081399990003'
  },
  // Robotika Category
  {
    id: 'part-r1',
    registrationNumber: 'ROB-001',
    name: 'Tim Cyber Robotech',
    institution: 'SMKN 2 Surabaya',
    categoryId: 'cat-robot',
    contact: '081499990001'
  },
  {
    id: 'part-r2',
    registrationNumber: 'ROB-002',
    name: 'Tim Techno Garuda',
    institution: 'SMK Negeri 2 Yogyakarta',
    categoryId: 'cat-robot',
    contact: '081499990002'
  }
];

export const DEFAULT_VOTING_CATEGORIES: VotingCategory[] = [
  {
    id: 'vote-cat-fav-web',
    name: 'Kandidat Web & Inovasi Terfavorit Pilihan Publik',
    description: 'Dukung karya karya terbaik siswa pilihan Anda untuk dinobatkan sebagai Juara Favorit Pemirsa!',
    pricePerVote: 1000,
    isActive: true,
    candidates: [
      {
        id: 'cand-1',
        name: 'Bintang Alamsyah (WEB-001)',
        subtitle: 'Proyek: E-Smart Portal Siswa Terpadu',
        institution: 'SMKN 1 Jakarta Raya',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
        votesCount: 384
      },
      {
        id: 'cand-2',
        name: 'Anisa Rahmawati (WEB-002)',
        subtitle: 'Proyek: UMKM Connect - Marketplace Lokal',
        institution: 'SMKN 2 Bandung',
        photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80',
        votesCount: 512
      },
      {
        id: 'cand-3',
        name: 'Rezky Pratama Putra (WEB-003)',
        subtitle: 'Proyek: Si-Pantau Bencana Berbasis PWA',
        institution: 'SMA Taruna Nusantara',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
        votesCount: 295
      },
      {
        id: 'cand-4',
        name: 'Fadhil Ihsan (WEB-004)',
        subtitle: 'Proyek: Edutech Lab Virtual Kimia',
        institution: 'SMK Telkom Malang',
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80',
        votesCount: 420
      }
    ]
  },
  {
    id: 'vote-cat-orator',
    name: 'Orator Muda Paling Inspiratif & Berkarakter',
    description: 'Vote pembicara dengan pesan paling menyentuh dan membangkitkan nasionalisme generasi muda.',
    pricePerVote: 2000,
    isActive: true,
    candidates: [
      {
        id: 'cand-o1',
        name: 'Cut Mutia Salsabila (PID-001)',
        subtitle: 'Tema: Obor Pancasila di Arus Globalisasi',
        institution: 'SMA Negeri 1 Banda Aceh',
        photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80',
        votesCount: 640
      },
      {
        id: 'cand-o2',
        name: 'I Made Bagus Dirgantara (PID-002)',
        subtitle: 'Tema: Merajut Harmoni Nusantara',
        institution: 'SMAN 3 Denpasar',
        photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80',
        votesCount: 580
      }
    ]
  }
];

export const DEFAULT_SUBMISSIONS: JuryScoreSubmission[] = [
  {
    id: 'sub-1',
    categoryId: 'cat-web',
    participantId: 'part-w1',
    juryId: 'usr-jury-1',
    juryName: 'Dr. Ir. Ahmad Syahrul, M.Kom',
    criteriaScores: {
      'crit-1': 9,
      'crit-2': 92,
      'crit-3': 7,
      'crit-4': 90
    },
    penalties: [],
    totalScore: 198,
    timeCompletionSeconds: 7800, // 2h 10m
    signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10 50 Q 50 10 90 50 T 170 40" fill="none" stroke="black" stroke-width="2"/></svg>',
    integrityPactAccepted: true,
    submittedAt: '2026-11-14T11:20:00Z',
    status: 'APPROVED'
  },
  {
    id: 'sub-2',
    categoryId: 'cat-web',
    participantId: 'part-w1',
    juryId: 'usr-jury-2',
    juryName: 'Siti Nurhaliza, M.Ds (Desain Grafis)',
    criteriaScores: {
      'crit-1': 10,
      'crit-2': 88,
      'crit-3': 8,
      'crit-4': 94
    },
    penalties: [],
    totalScore: 200,
    timeCompletionSeconds: 7800,
    signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M20 40 Q 60 20 100 45 T 180 50" fill="none" stroke="black" stroke-width="2"/></svg>',
    integrityPactAccepted: true,
    submittedAt: '2026-11-14T11:25:00Z',
    status: 'APPROVED'
  },
  {
    id: 'sub-3',
    categoryId: 'cat-web',
    participantId: 'part-w2',
    juryId: 'usr-jury-1',
    juryName: 'Dr. Ir. Ahmad Syahrul, M.Kom',
    criteriaScores: {
      'crit-1': 10,
      'crit-2': 95,
      'crit-3': 8,
      'crit-4': 95
    },
    penalties: [],
    totalScore: 208,
    timeCompletionSeconds: 7200, // 2h 00m (faster!)
    signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10 50 Q 50 10 90 50 T 170 40" fill="none" stroke="black" stroke-width="2"/></svg>',
    integrityPactAccepted: true,
    submittedAt: '2026-11-14T11:30:00Z',
    status: 'APPROVED'
  },
  {
    id: 'sub-4',
    categoryId: 'cat-web',
    participantId: 'part-w2',
    juryId: 'usr-jury-2',
    juryName: 'Siti Nurhaliza, M.Ds (Desain Grafis)',
    criteriaScores: {
      'crit-1': 9,
      'crit-2': 94,
      'crit-3': 7,
      'crit-4': 96
    },
    penalties: [],
    totalScore: 206,
    timeCompletionSeconds: 7200,
    signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M20 40 Q 60 20 100 45 T 180 50" fill="none" stroke="black" stroke-width="2"/></svg>',
    integrityPactAccepted: true,
    submittedAt: '2026-11-14T11:35:00Z',
    status: 'APPROVED'
  },
  {
    id: 'sub-5',
    categoryId: 'cat-web',
    participantId: 'part-w3',
    juryId: 'usr-jury-1',
    juryName: 'Dr. Ir. Ahmad Syahrul, M.Kom',
    criteriaScores: {
      'crit-1': 8,
      'crit-2': 86,
      'crit-3': 7,
      'crit-4': 88
    },
    penalties: [{ id: 'pen-1', reason: 'Keterlambatan submit repositori 3 menit', pointsDeducted: 5 }],
    totalScore: 184,
    timeCompletionSeconds: 8400,
    signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10 50 Q 50 10 90 50 T 170 40" fill="none" stroke="black" stroke-width="2"/></svg>',
    integrityPactAccepted: true,
    submittedAt: '2026-11-14T11:40:00Z',
    status: 'APPROVED'
  }
];

export const DEFAULT_VOTE_TRANSACTIONS: VoteTransaction[] = [
  {
    id: 'tx-001',
    userId: 'usr-voter-1',
    userName: 'Andri Wijaya',
    userPhone: '085712345678',
    senderName: 'Andri Wijaya (DANA)',
    amountVotes: 25,
    totalPriceIdr: 25000,
    danaAccountNumber: '081314420312',
    transferProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80',
    referenceCode: 'DANA-20261114-0012',
    status: 'APPROVED',
    createdAt: '2026-11-14T09:15:00Z',
    verifiedAt: '2026-11-14T09:20:00Z'
  },
  {
    id: 'tx-002',
    userId: 'usr-voter-2',
    userName: 'Maya Puspita',
    userPhone: '085888776655',
    senderName: 'Maya Puspita (DANA)',
    amountVotes: 10,
    totalPriceIdr: 10000,
    danaAccountNumber: '081314420312',
    transferProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80',
    referenceCode: 'DANA-20261114-0034',
    status: 'APPROVED',
    createdAt: '2026-11-14T10:00:00Z',
    verifiedAt: '2026-11-14T10:05:00Z'
  }
];

export const DEFAULT_PUBLIC_INFO: PublicEventInfo = {
  title: 'FESTIVAL & KOMPETISI KREATIF DIGITAL NASIONAL',
  subTitle: 'Menembus Batas Kreativitas dengan Semangat Sportivitas & Integritas',
  eventDescription: 'Ajang bergengsi tingkat nasional yang mempertemukan talenta-talenta terbaik dari seluruh nusantara dalam berbagai bidang keahlian digital, vokasi, dan orasi kebangsaan. Seluruh proses penjurian menggunakan teknologi S-IMPEL DIGITAL demi menjamin transparansi, keadilan, dan kecepatan hasil.',
  location: 'Auditorium Utama & Kompleks Laboratorium Terpadu Graha Sains Nusantara',
  eventDate: '14 s/d 16 November 2026',
  contactPerson: 'Helpdesk Panitia: 0813-1442-0312 (WhatsApp Resmi)',
  rulesOverview: [
    { id: 'rule-1', rule: 'Seluruh peserta wajib hadir 30 menit sebelum jadwal pertandingan dimulai.' },
    { id: 'rule-2', rule: 'Peserta wajib mengenakan tanda pengenal resmi yang disediakan panitia.' },
    { id: 'rule-3', rule: 'Keputusan dewan juri bersifat mutlak, independen, dan dilindungi oleh Pakta Integritas Berita Acara.' },
    { id: 'rule-4', rule: 'Penilaian live score dipublikasikan secara langsung setelah mendapat persetujuan (approval) Panitia Pusat.' },
    { id: 'rule-5', rule: 'Dilarang melakukan tindakan kecurangan atau manipulasi dalam bentuk apa pun.' },
    { id: 'rule-6', rule: 'Voting publik resmi hanya dilayani melalui sistem S-IMPEL DIGITAL dengan QRIS DANA terverifikasi.' }
  ],
  scheduleOverview: [
    { id: 'sched-1', time: '07.30 - 08.30 WIB', activity: 'Registrasi Ulang Peserta & Pembagian ID Card', location: 'Lobi Utama Gedung' },
    { id: 'sched-2', time: '08.30 - 09.15 WIB', activity: 'Upacara Pembukaan & Pengucapan Sumpah Pakta Integritas Juri', location: 'Auditorium Utama' },
    { id: 'sched-3', time: '09.30 - 12.30 WIB', activity: 'Sesi Pertandingan Tahap 1 (Web & Robotika)', location: 'Lab Komputer & Hall Sains' },
    { id: 'sched-4', time: '12.30 - 13.30 WIB', activity: 'Istirahat, Sholat & Penayangan Sponsor / Live Voting', location: 'Area Plaza & Booth' },
    { id: 'sched-5', time: '13.30 - 16.30 WIB', activity: 'Sesi Pertandingan Tahap 2 & Babak Final Orasi Pidato', location: 'Panggung Utama' },
    { id: 'sched-6', time: '16.30 - 17.30 WIB', activity: 'Rapat Pleno Dewan Juri & Pengumuman Juara Seremonial', location: 'Auditorium Utama' }
  ]
};

// Helper IndexedDB storage for large persistent media (Audio / Base64 Backgrounds)
const IDB_NAME = 'simpel_digital_db';
const IDB_STORE = 'app_settings';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB tidak didukung pada browser ini'));
    }
    const request = window.indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(key: string, value: any): Promise<void> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[StorageService] IDB set notice:', err);
  }
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[StorageService] IDB get notice:', err);
    return null;
  }
}

export type StorageListener = (key: string, data?: any) => void;

// Helper safe storage getters & setters
export class StorageService {
  private static cachedSettings: AppSettings | null = null;
  private static listeners: Set<StorageListener> = new Set();
  private static isChannelInitialized = false;

  private static initSync() {
    if (this.isChannelInitialized || typeof window === 'undefined') return;
    this.isChannelInitialized = true;

    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        const key = event.data?.key || 'all';
        StorageService.listeners.forEach(fn => {
          try { fn(key, event.data); } catch (e) { console.error(e); }
        });
      };
    }

    window.addEventListener('storage', (event) => {
      if (event.key) {
        StorageService.listeners.forEach(fn => {
          try { fn(event.key!); } catch (e) { console.error(e); }
        });
      }
    });
  }

  static subscribe(listener: StorageListener): () => void {
    this.initSync();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  static notify(key: string, data?: any): void {
    // 1. Notify listeners in current page
    this.listeners.forEach(fn => {
      try { fn(key, data); } catch (e) { console.error(e); }
    });

    // 2. Dispatch custom DOM event
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('simpel:realtime-sync', { detail: { key, data, timestamp: Date.now() } }));
      } catch {}
    }

    // 3. Broadcast across tabs
    if (syncChannel) {
      try {
        syncChannel.postMessage({ key, data, timestamp: Date.now() });
      } catch {}
    }
  }

  static getSettings(): AppSettings {
    if (this.cachedSettings) {
      return { ...DEFAULT_SETTINGS, ...this.cachedSettings };
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) {
        this.saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      const parsed = JSON.parse(raw);
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      this.cachedSettings = merged;
      return merged;
    } catch {
      return { ...DEFAULT_SETTINGS, ...(this.cachedSettings || {}) };
    }
  }

  static async initSettings(onLoaded?: (settings: AppSettings) => void): Promise<AppSettings> {
    try {
      const idbData = await idbGet<AppSettings>('settings');
      if (idbData) {
        const current = this.getSettings();
        const merged = { ...DEFAULT_SETTINGS, ...current, ...idbData };
        this.cachedSettings = merged;
        if (onLoaded) {
          onLoaded(merged);
        }
        return merged;
      }
    } catch (e) {
      console.warn('[StorageService] initSettings IDB fallback notice:', e);
    }
    const current = this.getSettings();
    if (onLoaded) onLoaded(current);
    return current;
  }

  static saveSettings(settings: AppSettings): void {
    // 1. Perbarui state cache memori lokal segera
    this.cachedSettings = { ...settings };

    // 2. Simpan cadangan persisten ke IndexedDB (Mendukung data besar seperti audio/media)
    idbSet('settings', settings).catch(() => {});

    // 3. Simpan ke localStorage dengan fallback toleransi kuota browser (5MB)
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.warn('[StorageService] localStorage.setItem kuota penuh, menjalankan fallback ringkas:', err);
      try {
        // Fallback 1: Jika audio base64 sangat besar, simpan referensi string ringan di localStorage
        // sementara file audio asli tetap aman di IndexedDB dan memori aktif.
        const compactSettings = {
          ...settings,
          bgmAudioUrl:
            settings.bgmAudioUrl && settings.bgmAudioUrl.length > 200000
              ? 'idb:bgm_audio'
              : settings.bgmAudioUrl
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(compactSettings));
      } catch (err2) {
        // Fallback 2: Jika masih melampaui kuota, simpan teks konfigurasi murni
        try {
          const minimalSettings = {
            ...settings,
            bgmAudioUrl: '',
            backgroundImageUrl: ''
          };
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(minimalSettings));
        } catch {
          console.warn('[StorageService] localStorage tidak dapat diakses, data disimpan pada memory & IndexedDB.');
        }
      }
    }
    this.notify(STORAGE_KEYS.SETTINGS, settings);
  }

  static getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_USERS;
    }
  }

  static saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notify(STORAGE_KEYS.USERS, users);
  }

  static getCategories(): CompetitionCategory[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  static saveCategories(categories: CompetitionCategory[]): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    this.notify(STORAGE_KEYS.CATEGORIES, categories);
  }

  static getParticipants(): Participant[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(DEFAULT_PARTICIPANTS));
      return DEFAULT_PARTICIPANTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_PARTICIPANTS;
    }
  }

  static saveParticipants(participants: Participant[]): void {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants));
    this.notify(STORAGE_KEYS.PARTICIPANTS, participants);
  }

  static getSubmissions(): JuryScoreSubmission[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(DEFAULT_SUBMISSIONS));
      return DEFAULT_SUBMISSIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_SUBMISSIONS;
    }
  }

  static saveSubmissions(submissions: JuryScoreSubmission[]): void {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
    this.notify(STORAGE_KEYS.SUBMISSIONS, submissions);
  }

  static getVotingCategories(): VotingCategory[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VOTING_CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.VOTING_CATEGORIES, JSON.stringify(DEFAULT_VOTING_CATEGORIES));
      return DEFAULT_VOTING_CATEGORIES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_VOTING_CATEGORIES;
    }
  }

  static saveVotingCategories(cats: VotingCategory[]): void {
    localStorage.setItem(STORAGE_KEYS.VOTING_CATEGORIES, JSON.stringify(cats));
    this.notify(STORAGE_KEYS.VOTING_CATEGORIES, cats);
  }

  private static cachedTransactions: VoteTransaction[] | null = null;

  static getVoteTransactions(): VoteTransaction[] {
    if (this.cachedTransactions) {
      return this.cachedTransactions;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VOTE_TRANSACTIONS);
      if (!raw) {
        this.cachedTransactions = DEFAULT_VOTE_TRANSACTIONS;
        try {
          localStorage.setItem(STORAGE_KEYS.VOTE_TRANSACTIONS, JSON.stringify(DEFAULT_VOTE_TRANSACTIONS));
        } catch {}
        return DEFAULT_VOTE_TRANSACTIONS;
      }
      const parsed = JSON.parse(raw);
      this.cachedTransactions = parsed;
      return parsed;
    } catch {
      return this.cachedTransactions || DEFAULT_VOTE_TRANSACTIONS;
    }
  }

  static saveVoteTransactions(txs: VoteTransaction[]): void {
    this.cachedTransactions = txs;
    // Save to IndexedDB for persistent storage of transaction proof images
    idbSet('vote_transactions', txs).catch(() => {});

    try {
      localStorage.setItem(STORAGE_KEYS.VOTE_TRANSACTIONS, JSON.stringify(txs));
    } catch (err) {
      console.warn('[StorageService] localStorage kuota penuh saat menyimpan transaksi, menerapkan fallback:', err);
      try {
        // Fallback: simpan data transaksi dengan bukti yang diringkas jika kuota browser penuh
        const compactTxs = txs.map(t => ({
          ...t,
          transferProofUrl:
            t.transferProofUrl && t.transferProofUrl.length > 100000
              ? t.transferProofUrl.substring(0, 50) + '...[idb_cached]'
              : t.transferProofUrl
        }));
        localStorage.setItem(STORAGE_KEYS.VOTE_TRANSACTIONS, JSON.stringify(compactTxs));
      } catch (err2) {
        console.warn('[StorageService] Gagal menyimpan ke localStorage, transaksi aktif di memori & IDB:', err2);
      }
    }
    this.notify(STORAGE_KEYS.VOTE_TRANSACTIONS, txs);
  }

  static getVoteCasts(): VoteCast[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VOTE_CASTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveVoteCasts(casts: VoteCast[]): void {
    localStorage.setItem(STORAGE_KEYS.VOTE_CASTS, JSON.stringify(casts));
    this.notify(STORAGE_KEYS.VOTE_CASTS, casts);
  }

  static getPublicInfo(): PublicEventInfo {
    const raw = localStorage.getItem(STORAGE_KEYS.PUBLIC_INFO);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PUBLIC_INFO, JSON.stringify(DEFAULT_PUBLIC_INFO));
      return DEFAULT_PUBLIC_INFO;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_PUBLIC_INFO;
    }
  }

  static savePublicInfo(info: PublicEventInfo): void {
    localStorage.setItem(STORAGE_KEYS.PUBLIC_INFO, JSON.stringify(info));
    this.notify(STORAGE_KEYS.PUBLIC_INFO, info);
  }

  static getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.notify(STORAGE_KEYS.CURRENT_USER, user);
  }

  // ==========================================
  // METODE MANAJEMEN DATA POLLING & VOTING
  // ==========================================

  /**
   * Mengembalikan hitungan vote/poin kembali ke 0.
   * Jika categoryId diberikan, hanya mereset kandidat pada kategori tersebut.
   * Jika tidak diberikan, mereset hitungan vote semua kandidat di semua kategori.
   */
  static resetVotingScores(categoryId?: string, clearCasts: boolean = false): VotingCategory[] {
    const current = this.getVotingCategories();
    const updated = current.map(cat => {
      if (!categoryId || cat.id === categoryId) {
        return {
          ...cat,
          candidates: cat.candidates.map(cand => ({
            ...cand,
            votesCount: 0
          }))
        };
      }
      return cat;
    });

    this.saveVotingCategories(updated);

    if (clearCasts) {
      if (categoryId) {
        const remainingCasts = this.getVoteCasts().filter(c => c.votingCategoryId !== categoryId);
        this.saveVoteCasts(remainingCasts);
      } else {
        this.saveVoteCasts([]);
      }
    }

    return updated;
  }

  /**
   * Reset suara kandidat tertentu kembali ke 0
   */
  static resetCandidateVotes(categoryId: string, candidateId: string): VotingCategory[] {
    const current = this.getVotingCategories();
    const updated = current.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          candidates: cat.candidates.map(cand =>
            cand.id === candidateId ? { ...cand, votesCount: 0 } : cand
          )
        };
      }
      return cat;
    });

    this.saveVotingCategories(updated);
    return updated;
  }

  /**
   * Tambah kandidat polling/voting baru ke kategori
   */
  static addVotingCandidate(
    categoryId: string,
    candidate: { name: string; subtitle: string; institution: string; photoUrl?: string; votesCount?: number }
  ): VotingCategory[] {
    const current = this.getVotingCategories();
    const newCand = {
      id: `cand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: candidate.name.trim(),
      subtitle: candidate.subtitle.trim(),
      institution: candidate.institution.trim(),
      photoUrl: candidate.photoUrl?.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
      votesCount: Number(candidate.votesCount) || 0
    };

    const updated = current.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          candidates: [...cat.candidates, newCand]
        };
      }
      return cat;
    });

    this.saveVotingCategories(updated);
    return updated;
  }

  /**
   * Edit data kandidat polling/voting
   */
  static updateVotingCandidate(
    categoryId: string,
    candidate: { id: string; name: string; subtitle: string; institution: string; photoUrl?: string; votesCount?: number }
  ): VotingCategory[] {
    const current = this.getVotingCategories();
    const updated = current.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          candidates: cat.candidates.map(cand =>
            cand.id === candidate.id
              ? {
                  ...cand,
                  name: candidate.name.trim(),
                  subtitle: candidate.subtitle.trim(),
                  institution: candidate.institution.trim(),
                  photoUrl: candidate.photoUrl?.trim() || cand.photoUrl,
                  votesCount: candidate.votesCount !== undefined ? Number(candidate.votesCount) : cand.votesCount
                }
              : cand
          )
        };
      }
      return cat;
    });

    this.saveVotingCategories(updated);
    return updated;
  }

  /**
   * Hapus kandidat polling/voting
   */
  static deleteVotingCandidate(categoryId: string, candidateId: string): VotingCategory[] {
    const current = this.getVotingCategories();
    const updated = current.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          candidates: cat.candidates.filter(cand => cand.id !== candidateId)
        };
      }
      return cat;
    });

    this.saveVotingCategories(updated);
    return updated;
  }

  /**
   * Reset atau Kosongkan (Clear) seluruh data Polling & Voting
   */
  static resetAllVotingData(options?: {
    resetScoresToZero?: boolean;
    clearTransactions?: boolean;
    clearCasts?: boolean;
  }): void {
    if (options?.resetScoresToZero) {
      this.resetVotingScores(undefined, options?.clearCasts);
    }
    if (options?.clearTransactions) {
      this.saveVoteTransactions([]);
    }
    if (options?.clearCasts) {
      this.saveVoteCasts([]);
    }
  }

  /**
   * Pembaruan Nomor Akun Gateway DANA Penerima (Portal Resmi 081314420312)
   */
  static updateDanaGateway(targetNumber: string, targetName?: string): AppSettings {
    const current = this.getSettings();
    const updated: AppSettings = {
      ...current,
      danaTargetNumber: targetNumber.trim(),
      ...(targetName ? { danaTargetName: targetName.trim() } : {})
    };
    this.saveSettings(updated);
    return updated;
  }

  /**
   * Pembaruan Pengaturan Harga Voter per Voting (Tarif per Suara)
   * Mengintegrasikan ke AppSettings dan seluruh kategori voting aktif
   */
  static updatePricePerVote(
    price: number,
    applyToAllCategories: boolean = true
  ): { settings: AppSettings; categories: VotingCategory[] } {
    const currentSettings = this.getSettings();
    const safePrice = Math.max(100, price);
    const updatedSettings: AppSettings = {
      ...currentSettings,
      defaultPricePerVote: safePrice
    };
    this.saveSettings(updatedSettings);

    let updatedCats = this.getVotingCategories();
    if (applyToAllCategories) {
      updatedCats = updatedCats.map(c => ({
        ...c,
        pricePerVote: safePrice
      }));
      this.saveVotingCategories(updatedCats);
    }
    return { settings: updatedSettings, categories: updatedCats };
  }

  static resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(DEFAULT_PARTICIPANTS));
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(DEFAULT_SUBMISSIONS));
    localStorage.setItem(STORAGE_KEYS.VOTING_CATEGORIES, JSON.stringify(DEFAULT_VOTING_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.VOTE_TRANSACTIONS, JSON.stringify(DEFAULT_VOTE_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.PUBLIC_INFO, JSON.stringify(DEFAULT_PUBLIC_INFO));
    this.notify('RESET_ALL');
  }
}

/**
 * Calculation logic:
 * Total Score = SUM(Criteria) - SUM(Penalties)
 * Average Score = Total Score of all Approved Juries for this participant
 * Tie-Breaker: When Average Scores are equal, the participant with faster completion time
 * (shorter averageTimeSeconds) ranks HIGHER.
 * Awards: Juara 1, Juara 2, Juara 3, Harapan 1, Harapan 2, Harapan 3.
 */
export function calculateRankings(categoryId: string, approvedOnly: boolean = true): RankingResult[] {
  const participants = StorageService.getParticipants().filter(p => p.categoryId === categoryId);
  const allSubmissions = StorageService.getSubmissions().filter(s => s.categoryId === categoryId);

  const validSubmissions = approvedOnly
    ? allSubmissions.filter(s => s.status === 'APPROVED')
    : allSubmissions;

  const results: RankingResult[] = participants.map(part => {
    const partSubs = validSubmissions.filter(s => s.participantId === part.id);
    const juriesCount = partSubs.length;

    let totalScoreAllJuries = 0;
    let totalTime = 0;
    let minTime = Infinity;

    const detailsPerJury = partSubs.map(s => {
      totalScoreAllJuries += s.totalScore;
      totalTime += s.timeCompletionSeconds;
      if (s.timeCompletionSeconds < minTime) minTime = s.timeCompletionSeconds;

      return {
        juryId: s.juryId,
        juryName: s.juryName,
        score: s.totalScore,
        timeSeconds: s.timeCompletionSeconds
      };
    });

    const averageScore = juriesCount > 0 ? Number((totalScoreAllJuries / juriesCount).toFixed(2)) : 0;
    const averageTimeSeconds = juriesCount > 0 ? Math.round(totalTime / juriesCount) : 0;
    const minTimeSeconds = minTime === Infinity ? 0 : minTime;

    return {
      rank: 0,
      participantId: part.id,
      participantName: part.name,
      registrationNumber: part.registrationNumber,
      institution: part.institution,
      categoryId: part.categoryId,
      averageScore,
      totalScoreAllJuries,
      juriesCount,
      averageTimeSeconds,
      minTimeSeconds,
      detailsPerJury
    };
  });

  // Sort descending by averageScore, tie-breaker ascending by averageTimeSeconds (faster is better)
  results.sort((a, b) => {
    if (b.averageScore !== a.averageScore) {
      return b.averageScore - a.averageScore;
    }
    // Tie-breaker: faster time wins (smaller seconds)
    // If one has 0 (no time recorded), give preference to the one with recorded time
    if (a.averageTimeSeconds > 0 && b.averageTimeSeconds > 0) {
      return a.averageTimeSeconds - b.averageTimeSeconds;
    }
    return 0;
  });

  // Assign ranks and award titles
  return results.map((item, index) => {
    const rank = index + 1;
    let awardTitle: RankingResult['awardTitle'] = 'Peserta';
    if (item.averageScore > 0 || item.juriesCount > 0) {
      if (rank === 1) awardTitle = 'Juara 1';
      else if (rank === 2) awardTitle = 'Juara 2';
      else if (rank === 3) awardTitle = 'Juara 3';
      else if (rank === 4) awardTitle = 'Harapan 1';
      else if (rank === 5) awardTitle = 'Harapan 2';
      else if (rank === 6) awardTitle = 'Harapan 3';
    }

    return {
      ...item,
      rank,
      awardTitle
    };
  });
}
