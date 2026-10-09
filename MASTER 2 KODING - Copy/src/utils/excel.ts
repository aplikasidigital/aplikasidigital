import * as XLSX from 'xlsx';
import { Participant, User } from '../types';

export function downloadParticipantTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const sampleData = [
    {
      'Nomor Registrasi': 'LOMBA-001',
      'Nama Peserta / Tim': 'Muhammad Ridwan',
      'Asal Sekolah / Instansi': 'SMK Negeri 1 Jakarta',
      'Nomor Kontak (WhatsApp)': '081234567890'
    },
    {
      'Nomor Registrasi': 'LOMBA-002',
      'Nama Peserta / Tim': 'Kania Tri Utami & Tim',
      'Asal Sekolah / Instansi': 'SMA Negeri 3 Bandung',
      'Nomor Kontak (WhatsApp)': '081298765432'
    },
    {
      'Nomor Registrasi': 'LOMBA-003',
      'Nama Peserta / Tim': 'Bagus Prasetyo',
      'Asal Sekolah / Instansi': 'SMK Telkom Malang',
      'Nomor Kontak (WhatsApp)': '085711223344'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Peserta');

  if (format === 'csv') {
    XLSX.writeFile(wb, 'Template_Import_Peserta_SIMPEL_DIGITAL.csv', { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, 'Template_Import_Peserta_SIMPEL_DIGITAL.xlsx', { bookType: 'xlsx' });
  }
}

export function downloadUserTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const sampleData = [
    {
      'Username': 'juri_anton',
      'Password': '123#',
      'Nama Lengkap': 'Ir. Anton Wijaya, M.T.',
      'Peran (SHADOW_ADMIN/JURY/VOTER)': 'JURY',
      'Nomor Kontak': '081233445566'
    },
    {
      'Username': 'voter_putri',
      'Password': '123#',
      'Nama Lengkap': 'Putri Handayani',
      'Peran (SHADOW_ADMIN/JURY/VOTER)': 'VOTER',
      'Nomor Kontak': '085811223344'
    },
    {
      'Username': 'coadmin_dian',
      'Password': '123#',
      'Nama Lengkap': 'Dian Permana',
      'Peran (SHADOW_ADMIN/JURY/VOTER)': 'SHADOW_ADMIN',
      'Nomor Kontak': '081399887766'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Pengguna');

  if (format === 'csv') {
    XLSX.writeFile(wb, 'Template_Import_Pengguna_SIMPEL_DIGITAL.csv', { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, 'Template_Import_Pengguna_SIMPEL_DIGITAL.xlsx', { bookType: 'xlsx' });
  }
}

export async function parseParticipantFile(file: File, categoryId: string): Promise<Participant[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

  const participants: Participant[] = [];

  rows.forEach((row, index) => {
    const regNo =
      row['Nomor Registrasi'] ||
      row['No Registrasi'] ||
      row['Nomor'] ||
      row['No'] ||
      `REG-${Date.now().toString().slice(-4)}-${index + 1}`;
    const name =
      row['Nama Peserta / Tim'] ||
      row['Nama'] ||
      row['Nama Peserta'] ||
      row['Nama Tim'] ||
      `Peserta ${index + 1}`;
    const inst =
      row['Asal Sekolah / Instansi'] ||
      row['Sekolah'] ||
      row['Instansi'] ||
      row['Asal Sekolah'] ||
      'Umum';
    const contact =
      row['Nomor Kontak (WhatsApp)'] ||
      row['Kontak'] ||
      row['No Kontak'] ||
      row['WhatsApp'] ||
      '';

    if (name) {
      participants.push({
        id: `part-imp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        registrationNumber: String(regNo).trim(),
        name: String(name).trim(),
        institution: String(inst).trim(),
        categoryId,
        contact: String(contact).trim()
      });
    }
  });

  return participants;
}

export async function parseUserFile(file: File): Promise<User[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

  const users: User[] = [];

  rows.forEach((row, index) => {
    const username = row['Username'] || row['username'] || `user_${Date.now().toString().slice(-4)}_${index}`;
    const password = row['Password'] || row['password'] || '123#';
    const name = row['Nama Lengkap'] || row['Nama'] || row['name'] || `Pengguna ${index + 1}`;
    let role = (row['Peran (SHADOW_ADMIN/JURY/VOTER)'] || row['Peran'] || row['role'] || 'VOTER')
      .toString()
      .trim()
      .toUpperCase();

    if (!['SHADOW_ADMIN', 'JURY', 'VOTER'].includes(role)) {
      if (role.includes('JURI') || role.includes('PENILAI')) role = 'JURY';
      else if (role.includes('ADMIN') || role.includes('BAYANGAN')) role = 'SHADOW_ADMIN';
      else role = 'VOTER';
    }

    const phone = row['Nomor Kontak'] || row['Kontak'] || row['Phone'] || '';

    users.push({
      id: `usr-imp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      username: String(username).trim(),
      password: String(password).trim(),
      name: String(name).trim(),
      role: role as User['role'],
      phone: String(phone).trim(),
      voteBalance: role === 'VOTER' ? 5 : undefined
    });
  });

  return users;
}

export function exportDataToExcel(filename: string, sheetData: { name: string; data: Record<string, any>[] }[]) {
  const wb = XLSX.utils.book_new();
  sheetData.forEach(sheet => {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31));
  });
  XLSX.writeFile(wb, `${filename}.xlsx`, { bookType: 'xlsx' });
}
