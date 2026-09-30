import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory data store for live simulation matching Spring Boot Data JPA models
interface DbUser {
  id: number;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'ADMIN' | 'OWNER' | 'USER';
  active: boolean;
  createdAt: string;
}

interface DbProject {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

interface DbProjectMember {
  id: number;
  projectId: number;
  userId: number;
  joinedAt: string;
}

interface DbDocument {
  id: number;
  originalName: string;
  mimeType: string;
  fileCategory: 'DOCUMENT' | 'IMAGE' | 'VIDEO';
  fileSize: number;
  objectKey: string;
  uploaderId: number;
  projectId: number;
  createdAt: string;
  dataUrl?: string;
}

// Seed admin account
const users: DbUser[] = [
  {
    id: 1,
    email: 'admin@ojt.com',
    passwordHash: bcrypt.hashSync('Admin@123456', 10),
    fullName: 'System Administrator',
    role: 'ADMIN',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    email: 'alex@company.com',
    passwordHash: bcrypt.hashSync('Password@123', 10),
    fullName: 'Alex Morgan',
    role: 'USER',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

const projects: DbProject[] = [
  {
    id: 1,
    name: 'Knowledge Base Portal 2026',
    description: 'Centralized engineering knowledge base and technical specifications repository.',
    ownerId: 1,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Mobile App Architecture v2',
    description: 'Design files, system architecture diagrams, and release notes for the mobile app.',
    ownerId: 2,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const projectMembers: DbProjectMember[] = [
  { id: 1, projectId: 1, userId: 1, joinedAt: new Date().toISOString() },
  { id: 2, projectId: 1, userId: 2, joinedAt: new Date().toISOString() },
  { id: 3, projectId: 2, userId: 2, joinedAt: new Date().toISOString() },
];

const documents: DbDocument[] = [
  {
    id: 1,
    originalName: 'System_Architecture_Overview.pdf',
    mimeType: 'application/pdf',
    fileCategory: 'DOCUMENT',
    fileSize: 1024 * 450,
    objectKey: 'projects/1/sample_spec.pdf',
    uploaderId: 1,
    projectId: 1,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    dataUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 2,
    originalName: 'Database_Schema_Diagram.png',
    mimeType: 'image/png',
    fileCategory: 'IMAGE',
    fileSize: 1024 * 120,
    objectKey: 'projects/1/sample_diagram.png',
    uploaderId: 1,
    projectId: 1,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    dataUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
  },
];

let nextUserId = 3;
let nextProjectId = 3;
let nextMemberId = 4;
let nextDocId = 3;

// Multer memory storage
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Helper functions
function toUserResponse(user: DbUser) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
  };
}

function resolveCategory(filename: string): 'DOCUMENT' | 'IMAGE' | 'VIDEO' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp'].includes(ext)) return 'IMAGE';
  if (['mp4', 'mov', 'avi'].includes(ext)) return 'VIDEO';
  return 'DOCUMENT';
}

function resolveMimeType(filename: string, fallback?: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ppt: 'application/vnd.ms-powerpoint',
    md: 'text/markdown',
    txt: 'text/plain',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
  };
  return map[ext] || fallback || 'application/octet-stream';
}

// Authentication Middleware
interface AuthenticatedRequest extends Request {
  currentUser?: DbUser;
}

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 401, message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { email: string; userId: number };
    const user = users.find((u) => u.id === payload.userId && u.active);
    if (!user) {
      return res.status(401).json({ status: 401, message: 'User not found or deactivated' });
    }
    req.currentUser = user;
    next();
  } catch {
    return res.status(401).json({ status: 401, message: 'Token expired or invalid' });
  }
};

const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.currentUser?.role !== 'ADMIN') {
    return res.status(403).json({ status: 403, message: 'Access denied: requires ADMIN role' });
  }
  next();
};

// ----------------------------------------------------
// AUTH ENDPOINTS (/api/auth)
// ----------------------------------------------------
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ status: 400, message: 'Email, password and full name are required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  if (users.some((u) => u.email === cleanEmail)) {
    return res.status(400).json({ status: 400, message: `User with email '${cleanEmail}' already exists` });
  }

  const newUser: DbUser = {
    id: nextUserId++,
    email: cleanEmail,
    passwordHash: bcrypt.hashSync(password, 10),
    fullName: String(fullName).trim(),
    role: 'USER',
    active: true,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  const token = jwt.sign({ userId: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, {
    expiresIn: '24h',
  });

  return res.status(201).json({
    token,
    user: toUserResponse(newUser),
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ status: 400, message: 'Email and password required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = users.find((u) => u.email === cleanEmail);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ status: 401, message: 'Invalid email or password' });
  }

  if (!user.active) {
    return res.status(400).json({ status: 400, message: 'Account is deactivated' });
  }

  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '24h',
  });

  return res.json({
    token,
    user: toUserResponse(user),
  });
});

app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json(toUserResponse(req.currentUser!));
});

// ----------------------------------------------------
// USER ENDPOINTS (/api/users)
// ----------------------------------------------------
app.get('/api/users/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json(toUserResponse(req.currentUser!));
});

app.put('/api/users/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { fullName } = req.body;
  if (!fullName) return res.status(400).json({ status: 400, message: 'Full name required' });
  req.currentUser!.fullName = fullName.trim();
  res.json(toUserResponse(req.currentUser!));
});

app.put('/api/users/profile/password', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ status: 400, message: 'Both passwords required' });
  }

  if (!bcrypt.compareSync(oldPassword, req.currentUser!.passwordHash)) {
    return res.status(400).json({ status: 400, message: 'Current password does not match' });
  }

  req.currentUser!.passwordHash = bcrypt.hashSync(newPassword, 10);
  res.json({ message: 'Password changed successfully' });
});

app.get('/api/users', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 0;
  const size = parseInt(req.query.size as string) || 10;
  const search = ((req.query.search as string) || '').toLowerCase().trim();

  let filtered = users;
  if (search) {
    filtered = users.filter(
      (u) => u.fullName.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
    );
  }

  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / size);
  const start = page * size;
  const content = filtered.slice(start, start + size).map(toUserResponse);

  res.json({
    content,
    page,
    size,
    totalElements,
    totalPages,
    last: page >= totalPages - 1,
  });
});

app.get('/api/users/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ status: 404, message: 'User not found' });
  res.json(toUserResponse(user));
});

app.put('/api/users/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ status: 404, message: 'User not found' });

  const { fullName, role, active } = req.body;
  if (fullName) user.fullName = fullName.trim();
  if (role) user.role = role;
  if (typeof active === 'boolean') user.active = active;

  res.json(toUserResponse(user));
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (req.currentUser?.id === id) {
    return res.status(400).json({ status: 400, message: 'You cannot delete your own account' });
  }

  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return res.status(404).json({ status: 404, message: 'User not found' });

  users.splice(idx, 1);
  res.status(204).send();
});

// ----------------------------------------------------
// PROJECT ENDPOINTS (/api/projects)
// ----------------------------------------------------
function formatProjectResponse(project: DbProject) {
  const owner = users.find((u) => u.id === project.ownerId) || users[0];
  const memberCount = projectMembers.filter((m) => m.projectId === project.id).length;
  const documentCount = documents.filter((d) => d.projectId === project.id).length;

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    owner: toUserResponse(owner),
    memberCount,
    documentCount,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

app.get('/api/projects', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.currentUser!;
  let accessibleProjects: DbProject[];

  if (user.role === 'ADMIN') {
    accessibleProjects = projects;
  } else {
    const memberProjectIds = new Set(
      projectMembers.filter((m) => m.userId === user.id).map((m) => m.projectId)
    );
    accessibleProjects = projects.filter((p) => p.ownerId === user.id || memberProjectIds.has(p.id));
  }

  res.json(accessibleProjects.map(formatProjectResponse));
});

app.get('/api/projects/search', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.currentUser!;
  const page = parseInt(req.query.page as string) || 0;
  const size = parseInt(req.query.size as string) || 10;
  const search = ((req.query.search as string) || '').toLowerCase().trim();

  let accessibleProjects: DbProject[];
  if (user.role === 'ADMIN') {
    accessibleProjects = projects;
  } else {
    const memberProjectIds = new Set(
      projectMembers.filter((m) => m.userId === user.id).map((m) => m.projectId)
    );
    accessibleProjects = projects.filter((p) => p.ownerId === user.id || memberProjectIds.has(p.id));
  }

  if (search) {
    accessibleProjects = accessibleProjects.filter(
      (p) => p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search)
    );
  }

  const totalElements = accessibleProjects.length;
  const totalPages = Math.ceil(totalElements / size);
  const start = page * size;
  const content = accessibleProjects.slice(start, start + size).map(formatProjectResponse);

  res.json({
    content,
    page,
    size,
    totalElements,
    totalPages,
    last: page >= totalPages - 1,
  });
});

app.get('/api/projects/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const projectId = Number(req.params.id);
  const project = projects.find((p) => p.id === projectId);
  if (!project) return res.status(404).json({ status: 404, message: 'Project not found' });

  const user = req.currentUser!;
  const isOwner = project.ownerId === user.id;
  const isMember = projectMembers.some((m) => m.projectId === projectId && m.userId === user.id);

  if (!isOwner && !isMember && user.role !== 'ADMIN') {
    return res.status(403).json({ status: 403, message: 'You do not have access to this project' });
  }

  const owner = users.find((u) => u.id === project.ownerId) || users[0];
  const members = projectMembers
    .filter((m) => m.projectId === projectId)
    .map((m) => {
      const u = users.find((usr) => usr.id === m.userId) || users[0];
      return {
        id: m.id,
        user: toUserResponse(u),
        joinedAt: m.joinedAt,
      };
    });

  const docCount = documents.filter((d) => d.projectId === projectId).length;

  res.json({
    id: project.id,
    name: project.name,
    description: project.description,
    owner: toUserResponse(owner),
    members,
    documentCount: docCount,
    isOwner: isOwner || user.role === 'ADMIN',
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
});

app.post('/api/projects', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ status: 400, message: 'Project name is required' });
  }

  const newProject: DbProject = {
    id: nextProjectId++,
    name: name.trim(),
    description: (description || '').trim(),
    ownerId: req.currentUser!.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  projects.push(newProject);
  // Add owner to members list
  projectMembers.push({
    id: nextMemberId++,
    projectId: newProject.id,
    userId: req.currentUser!.id,
    joinedAt: new Date().toISOString(),
  });

  res.status(201).json(formatProjectResponse(newProject));
});

app.put('/api/projects/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const projectId = Number(req.params.id);
  const project = projects.find((p) => p.id === projectId);
  if (!project) return res.status(404).json({ status: 404, message: 'Project not found' });

  if (project.ownerId !== req.currentUser!.id && req.currentUser!.role !== 'ADMIN') {
    return res.status(403).json({ status: 403, message: 'Forbidden: owner or admin only' });
  }

  const { name, description } = req.body;
  if (name) project.name = name.trim();
  if (typeof description === 'string') project.description = description.trim();
  project.updatedAt = new Date().toISOString();

  res.json(formatProjectResponse(project));
});

app.delete('/api/projects/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const projectId = Number(req.params.id);
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx === -1) return res.status(404).json({ status: 404, message: 'Project not found' });

  const project = projects[idx];
  if (project.ownerId !== req.currentUser!.id && req.currentUser!.role !== 'ADMIN') {
    return res.status(403).json({ status: 403, message: 'Forbidden: owner or admin only' });
  }

  projects.splice(idx, 1);
  // Remove members & documents
  for (let i = projectMembers.length - 1; i >= 0; i--) {
    if (projectMembers[i].projectId === projectId) projectMembers.splice(i, 1);
  }
  for (let i = documents.length - 1; i >= 0; i--) {
    if (documents[i].projectId === projectId) documents.splice(i, 1);
  }

  res.status(204).send();
});

app.post('/api/projects/:id/members', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const projectId = Number(req.params.id);
  const project = projects.find((p) => p.id === projectId);
  if (!project) return res.status(404).json({ status: 404, message: 'Project not found' });

  if (project.ownerId !== req.currentUser!.id && req.currentUser!.role !== 'ADMIN') {
    return res.status(403).json({ status: 403, message: 'Forbidden: owner or admin only' });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ status: 400, message: 'Email required' });

  const cleanEmail = String(email).trim().toLowerCase();
  const targetUser = users.find((u) => u.email === cleanEmail);
  if (!targetUser) {
    return res.status(404).json({ status: 404, message: `No registered user found with email: ${cleanEmail}` });
  }

  if (projectMembers.some((m) => m.projectId === projectId && m.userId === targetUser.id)) {
    return res.status(400).json({ status: 400, message: 'User is already a member of this project' });
  }

  const newMember: DbProjectMember = {
    id: nextMemberId++,
    projectId,
    userId: targetUser.id,
    joinedAt: new Date().toISOString(),
  };

  projectMembers.push(newMember);
  res.status(201).json({
    id: newMember.id,
    user: toUserResponse(targetUser),
    joinedAt: newMember.joinedAt,
  });
});

app.delete('/api/projects/:id/members/:userId', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const projectId = Number(req.params.id);
  const targetUserId = Number(req.params.userId);

  const project = projects.find((p) => p.id === projectId);
  if (!project) return res.status(404).json({ status: 404, message: 'Project not found' });

  if (project.ownerId !== req.currentUser!.id && req.currentUser!.role !== 'ADMIN') {
    return res.status(403).json({ status: 403, message: 'Forbidden: owner or admin only' });
  }

  if (project.ownerId === targetUserId) {
    return res.status(400).json({ status: 400, message: 'Cannot remove the project owner from members' });
  }

  const idx = projectMembers.findIndex((m) => m.projectId === projectId && m.userId === targetUserId);
  if (idx === -1) return res.status(404).json({ status: 404, message: 'Member not found in project' });

  projectMembers.splice(idx, 1);
  res.status(204).send();
});

// ----------------------------------------------------
// DOCUMENT ENDPOINTS (/api/documents)
// ----------------------------------------------------
function formatDocResponse(doc: DbDocument) {
  const uploader = users.find((u) => u.id === doc.uploaderId) || users[0];
  return {
    id: doc.id,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    fileCategory: doc.fileCategory,
    fileSize: doc.fileSize,
    uploader: toUserResponse(uploader),
    projectId: doc.projectId,
    createdAt: doc.createdAt,
  };
}

app.post(
  '/api/documents/projects/:projectId',
  authenticateToken,
  upload.single('file'),
  (req: AuthenticatedRequest, res: Response) => {
    const projectId = Number(req.params.projectId);
    const project = projects.find((p) => p.id === projectId);
    if (!project) return res.status(404).json({ status: 404, message: 'Project not found' });

    const user = req.currentUser!;
    const isOwner = project.ownerId === user.id;
    const isMember = projectMembers.some((m) => m.projectId === projectId && m.userId === user.id);
    if (!isOwner && !isMember && user.role !== 'ADMIN') {
      return res.status(403).json({ status: 403, message: 'You do not have access to this project' });
    }

    if (!req.file) {
      return res.status(400).json({ status: 400, message: 'No file provided' });
    }

    const file = req.file;
    const originalName = file.originalname;
    const ext = originalName.split('.').pop()?.toLowerCase() || '';

    const allowed = [
      'pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'md', 'txt',
      'jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp',
      'mp4', 'mov', 'avi'
    ];

    if (!allowed.includes(ext)) {
      return res.status(400).json({
        status: 400,
        message: `Unsupported file format .${ext}. Allowed: documents, images, and videos.`,
      });
    }

    const category = resolveCategory(originalName);
    const mimeType = resolveMimeType(originalName, file.mimetype);

    // Convert small files to data URL for preview in browser
    let dataUrl: string | undefined;
    if (file.buffer) {
      dataUrl = `data:${mimeType};base64,${file.buffer.toString('base64')}`;
    }

    const newDoc: DbDocument = {
      id: nextDocId++,
      originalName,
      mimeType,
      fileCategory: category,
      fileSize: file.size,
      objectKey: `projects/${projectId}/${Date.now()}_${originalName}`,
      uploaderId: user.id,
      projectId,
      createdAt: new Date().toISOString(),
      dataUrl,
    };

    documents.push(newDoc);
    res.status(201).json(formatDocResponse(newDoc));
  }
);

app.get('/api/documents/projects/:projectId', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const projectId = Number(req.params.projectId);
  const project = projects.find((p) => p.id === projectId);
  if (!project) return res.status(404).json({ status: 404, message: 'Project not found' });

  const user = req.currentUser!;
  const isOwner = project.ownerId === user.id;
  const isMember = projectMembers.some((m) => m.projectId === projectId && m.userId === user.id);
  if (!isOwner && !isMember && user.role !== 'ADMIN') {
    return res.status(403).json({ status: 403, message: 'Access denied' });
  }

  const page = parseInt(req.query.page as string) || 0;
  const size = parseInt(req.query.size as string) || 10;
  const search = ((req.query.search as string) || '').toLowerCase().trim();
  const category = (req.query.category as string) || '';

  let projectDocs = documents.filter((d) => d.projectId === projectId);

  if (category) {
    projectDocs = projectDocs.filter((d) => d.fileCategory === category);
  }
  if (search) {
    projectDocs = projectDocs.filter((d) => d.originalName.toLowerCase().includes(search));
  }

  // Sort by createdAt descending
  projectDocs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalElements = projectDocs.length;
  const totalPages = Math.ceil(totalElements / size);
  const start = page * size;
  const content = projectDocs.slice(start, start + size).map(formatDocResponse);

  res.json({
    content,
    page,
    size,
    totalElements,
    totalPages,
    last: page >= totalPages - 1,
  });
});

app.get('/api/documents/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const doc = documents.find((d) => d.id === Number(req.params.id));
  if (!doc) return res.status(404).json({ status: 404, message: 'Document not found' });

  res.json(formatDocResponse(doc));
});

app.get('/api/documents/:id/url', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const doc = documents.find((d) => d.id === Number(req.params.id));
  if (!doc) return res.status(404).json({ status: 404, message: 'Document not found' });

  // In live simulation, if we have a dataUrl or external URL, return that, otherwise provide mock presigned URL
  const url = doc.dataUrl || `https://storage.googleapis.com/download-placeholder/${doc.objectKey}`;
  res.json({
    url,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
  });
});

app.delete('/api/documents/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const docId = Number(req.params.id);
  const idx = documents.findIndex((d) => d.id === docId);
  if (idx === -1) return res.status(404).json({ status: 404, message: 'Document not found' });

  const doc = documents[idx];
  const project = projects.find((p) => p.id === doc.projectId);
  const user = req.currentUser!;

  const isUploader = doc.uploaderId === user.id;
  const isOwner = project?.ownerId === user.id;
  const isAdmin = user.role === 'ADMIN';

  if (!isUploader && !isOwner && !isAdmin) {
    return res.status(403).json({ status: 403, message: 'Only uploader, owner, or admin can delete this document' });
  }

  documents.splice(idx, 1);
  res.status(204).send();
});

// Vite Middleware for Frontend Development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
